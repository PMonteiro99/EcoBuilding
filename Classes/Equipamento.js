// Um equipamento da casa (lâmpada, ar condicionado, televisão ou computador).
// Guarda a posição, se está ligado ou desligado, e sabe desenhar-se.
class Equipamento {
  // tipo: chave de EQUIPAMENTOS ('lamp', 'ac', 'tv' ou 'computer')
  // movel: móvel onde assenta (TV e computador) ou null
  // alturaTeto: y do teto, para desenhar o fio da lâmpada, ou null
  constructor(tipo, x, y, movel, alturaTeto) {
    this.tipo = tipo;
    this.x = x;
    this.y = y;
    this.movel = movel;
    this.alturaTeto = alturaTeto;
    this.dados = EQUIPAMENTOS[tipo];
    this.potencia = this.dados.potencia;
    this.ligado = false;
    this.animacao = 0; // vai de 1 a 0 depois de mudar de estado (faz o equipamento "saltar")
  }

  estaSobORato() {
    return dist(mouseX, mouseY, this.x, this.y) <= RAIO_CLIQUE + 4;
  }

  atualizar(dt) {
    this.animacao = max(0, this.animacao - dt * 3);
  }

  desenhar() {
    const segundos = millis() / 1000;
    const tamanho = 64 * (1 + 0.25 * this.animacao);
    const caixa = this.dados.caixa;

    // móvel de apoio (só TV e computador)
    if (this.movel) {
      image(imgMoveis[this.movel.nome], this.movel.x, this.movel.y, this.movel.w, this.movel.h);
    }

    // fio e casquilho da lâmpada até ao teto
    if (this.alturaTeto !== null) {
      stroke(COR.escuro);
      strokeWeight(3);
      line(this.x, this.alturaTeto + 3, this.x, this.y - 26);
      noStroke();
      fill(COR.escuro);
      rect(this.x - 8, this.alturaTeto + 3, 16, 5);
    }

    // halo amarelo a pulsar quando está ligado, para se ver bem em qualquer parede
    if (this.ligado) {
      fill(255, 213, 74, 90 + 60 * sin(segundos * 6));
      circle(this.x, this.y, 80 + 6 * sin(segundos * 6));
      fill(255, 255, 255, 60);
      circle(this.x, this.y, 66);
    }

    // a imagem da lâmpada está ao contrário (casquilho em baixo), por isso é virada na vertical
    push();
    translate(this.x, this.y);
    if (this.alturaTeto !== null) scale(1, -1);
    const imagem = imgEquipamentos[this.tipo + (this.ligado ? '_on' : '_off')];
    image(imagem, -tamanho / 2, -tamanho / 2, tamanho, tamanho);
    pop();

    // alerta vermelho no canto superior direito, a saltar ligeiramente
    if (this.ligado) {
      image(imgAlerta, this.x + caixa[2] - 16, this.y + caixa[1] - 4 + 2 * sin(segundos * 8), 22, 22);
    }
  }
}