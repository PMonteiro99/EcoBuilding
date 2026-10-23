// O microfone do jogo.
// Pede autorização ao navegador, mede o ruído da sala (calibração) e deteta sons curtos,
// como uma palma, usando dois limites (histerese) para não disparar várias vezes seguidas.
class Microfone {
  constructor() {
    this.entrada = null;            // p5.AudioIn, criado só quando é preciso
    this.autorizado = false;
    this.desligado = false;         // true quando o jogador escolhe jogar só com o rato
    this.estadoTexto = 'por calibrar';
    this.fase = 'pedir';            // 'pedir', 'medir', 'pronta' ou 'erro'

    this.tempoMedicao = 0;          // ms já passados na calibração
    this.amostras = [];
    this.ruidoBase = 0;             // nível médio da sala em silêncio
    this.margemDisparo = MARGEM_INICIAL;

    this.nivel = 0;                 // nível do som neste frame (0 a 1)
    this.nivelVisivel = 0;          // igual, mas desce devagar, para a barra não tremer
    this.armado = false;            // pronto para disparar outra vez?
    this.palmasDetetadas = 0;       // contador do teste na calibração
    this.brilhoTeste = 0;           // flash verde quando o teste deteta uma palma
  }

  // Dispara quando o som passa o ruído da sala mais a margem (0,18 por defeito)
  get limiteDisparo() {
    return min(0.95, this.ruidoBase + this.margemDisparo);
  }

  // Só volta a armar quando o som desce abaixo deste limite (0,08 abaixo do de disparo)
  get limiteRearme() {
    return max(this.ruidoBase + 0.02, this.limiteDisparo - FOLGA_HISTERESE);
  }

  // Sensibilidade de 1 (pouca) a 16 (muita): quanto menor a margem, mais sensível
  get sensibilidade() {
    return round((MARGEM_MAXIMA - this.margemDisparo) / 0.02) + 1;
  }

  // passo +1 deixa mais sensível, -1 menos sensível
  ajustarSensibilidade(passo) {
    this.margemDisparo = constrain(this.margemDisparo - passo * 0.02, MARGEM_MINIMA, MARGEM_MAXIMA);
  }

  pedirAcesso() {
    this.desligado = false;
    if (!this.entrada) {
      this.entrada = new p5.AudioIn();
    }

    // se já foi autorizado antes, basta voltar a calibrar
    if (this.autorizado) {
      this.comecarMedicao();
      return;
    }

    this.fase = 'pedir';
    this.estadoTexto = 'a pedir';
    this.entrada.start(
      () => {
        this.autorizado = true;
        this.estadoTexto = 'pronto';
        this.comecarMedicao();
      },
      () => {
        this.estadoTexto = 'sem permissão';
        this.fase = 'erro';
      }
    );
  }

  comecarMedicao() {
    this.fase = 'medir';
    this.tempoMedicao = 0;
    this.amostras = [];
    this.ruidoBase = 0;
    this.palmasDetetadas = 0;
    this.armado = false;
  }

  // Lê o nível do microfone (chamado em todos os frames)
  lerNivel(dt) {
    this.nivel = this.autorizado ? this.entrada.getLevel() : 0;
    this.nivelVisivel = max(this.nivel, this.nivelVisivel - dt * 1.2);
  }

  // Calibração: durante 2 segundos de silêncio guarda o nível da sala; depois deixa testar uma palma
  atualizarCalibracao(dt) {
    if (this.fase === 'medir') {
      this.amostras.push(this.nivel);
      this.tempoMedicao += dt * 1000;
      if (this.tempoMedicao >= CALIBRACAO_MS) {
        const soma = this.amostras.reduce((total, valor) => total + valor, 0);
        this.ruidoBase = soma / this.amostras.length;
        this.fase = 'pronta';
        this.estadoTexto = 'calibrado';
      }
    } else if (this.fase === 'pronta' && this.detetouSom()) {
      this.palmasDetetadas++;
      this.brilhoTeste = 1;
    }
    this.brilhoTeste = max(0, this.brilhoTeste - dt * 2);
  }

  // Histerese: devolve true só no frame em que o som passa o limite de disparo.
  // Depois disso fica desarmado até o som descer abaixo do limite de rearme.
  detetouSom() {
    if (this.desligado) {
      this.armado = false;
      return false;
    }
    if (this.armado && this.nivel > this.limiteDisparo) {
      this.armado = false;
      return true;
    }
    if (!this.armado && this.nivel < this.limiteRearme) {
      this.armado = true;
    }
    return false;
  }

  // Barra do nível de som com as marcas dos dois limites (amarelo = dispara, verde = rearma)
  desenharBarra(x, y, w, h) {
    const posicao = (valor) => x + w * constrain(valor / 0.6, 0, 1); // a barra cheia corresponde a 0,6

    noStroke();
    fill(255, 255, 255, 30);
    rect(x, y, w, h);
    fill(this.nivelVisivel > this.limiteDisparo ? COR.laranja : COR.verde);
    rect(x, y, posicao(this.nivelVisivel) - x, h);

    strokeWeight(3);
    stroke(COR.amarelo);
    line(posicao(this.limiteDisparo), y - 4, posicao(this.limiteDisparo), y + h + 4);
    strokeWeight(2);
    stroke(COR.verdeClaro);
    line(posicao(this.limiteRearme), y - 3, posicao(this.limiteRearme), y + h + 3);

    noFill();
    rect(x, y, w, h);
    noStroke();
  }
}