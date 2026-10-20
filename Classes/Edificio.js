// O edifício de uma tipologia.
// Cria as divisões (com a mobília) e sorteia onde ficam os equipamentos,
// sempre em sítios lógicos: lâmpadas no teto, ar condicionado no alto da parede,
// televisão e computador em cima do seu móvel.
class Edificio {
  constructor(tipologia) {
    this.tipologia = tipologia;
    this.divisoes = tipologia.divisoes.map((definicao) => this.criarDivisao(definicao));
    this.equipamentos = this.sortearEquipamentos();
  }

  // Converte [código, tipo, coluna, linha, largura, altura] numa divisão com posição em píxeis
  criarDivisao([codigo, tipo, coluna, linha, largura, altura]) {
    const divisao = {
      codigo: codigo,
      tipo: tipo,
      dados: TIPOS_DIVISAO[tipo],
      x: PLANTA_X + coluna * QUADRADO_LARGURA,
      y: PLANTA_Y + linha * QUADRADO_ALTURA,
      w: largura * QUADRADO_LARGURA,
      h: altura * QUADRADO_ALTURA,
    };

    // os quartos são numerados ("QUARTO 1", "QUARTO 2", ...)
    divisao.nome = divisao.dados.nome;
    if (tipo === 'quarto' && codigo.length > 1) {
      divisao.nome += ' ' + codigo.slice(1);
    }

    // móveis fixos, encostados à parede esquerda ou direita
    divisao.mobilia = divisao.dados.mobilia.map(([nome, lado, margem]) => {
      const larguraMovel = imgMoveis[nome].width * 2;
      const x = lado === 'esq' ? divisao.x + margem : divisao.x + divisao.w - margem - larguraMovel;
      return this.criarMovel(divisao, nome, x);
    });

    return divisao;
  }

  // Um móvel assente no chão da divisão (as imagens são desenhadas ao dobro do tamanho)
  criarMovel(divisao, nome, x) {
    const imagem = imgMoveis[nome];
    const w = imagem.width * 2;
    const h = imagem.height * 2;
    return { nome: nome, x: x, y: divisao.y + divisao.h - 8 - h, w: w, h: h };
  }

  // Dois retângulos [esquerda, cima, direita, baixo] sobrepõem-se? (margem dá um pequeno espaço entre eles)
  static sobrepostos(a, b, margem = 4) {
    return a[0] - margem < b[2] && b[0] - margem < a[2] && a[1] - margem < b[3] && b[1] - margem < a[3];
  }

  // Sorteio com pesos: um peso 3 sai três vezes mais do que um peso 1. Devolve o índice escolhido.
  static sortearIndice(pesos) {
    const total = pesos.reduce((soma, p) => soma + p, 0);
    let sorteado = random(total);
    for (let i = 0; i < pesos.length; i++) {
      sorteado -= pesos[i];
      if (sorteado <= 0 && pesos[i] > 0) return i;
    }
    return pesos.findIndex((p) => p > 0);
  }

  // Tenta pôr um equipamento num sítio lógico e livre da divisão. Devolve o Equipamento ou null.
  colocarEquipamento(divisao, tipo) {
    const dados = EQUIPAMENTOS[tipo];
    const [esquerda, cima, direita, baixo] = dados.caixa;

    for (let tentativa = 0; tentativa < 40; tentativa++) {
      let x, y, movel = null, ocupa;

      if (dados.local === 'chao') {
        // TV e computador: primeiro escolhe-se o sítio do móvel, depois o equipamento assenta no tampo
        const larguraMovel = imgMoveis[dados.movel].width * 2;
        movel = this.criarMovel(divisao, dados.movel, random(divisao.x + 10, divisao.x + divisao.w - 10 - larguraMovel));
        x = movel.x + larguraMovel / 2;
        y = movel.y - baixo;
        ocupa = [min(x + esquerda, movel.x), y + cima, max(x + direita, movel.x + larguraMovel), movel.y + movel.h];
      } else {
        // lâmpada (pendurada) e ar condicionado (no alto da parede): só varia a posição horizontal
        x = random(divisao.x + 10 - esquerda, divisao.x + divisao.w - 10 - direita);
        y = divisao.y + (dados.local === 'teto' ? 64 : 52);
        // a lâmpada ocupa também o espaço do fio até ao teto
        const topo = dados.local === 'teto' ? divisao.y : y + cima;
        ocupa = [x + esquerda, topo, x + direita, y + baixo];
      }

      const livre = !divisao.ocupado.some((area) => Edificio.sobrepostos(area, ocupa));
      if (livre) {
        divisao.ocupado.push(ocupa);
        divisao.contagem[tipo] = (divisao.contagem[tipo] || 0) + 1;
        const alturaTeto = dados.local === 'teto' ? divisao.y : null;
        return new Equipamento(tipo, x, y, movel, alturaTeto);
      }
    }
    return null;
  }

  // Escolhe os equipamentos da casa.
  // Regras: divisões maiores recebem mais; no máximo 50% lâmpadas e 1/3 ar condicionado;
  // tem de haver pelo menos um ar condicionado e (a partir de 5 equipamentos) um computador.
  sortearEquipamentos() {
    const total = this.tipologia.equipamentos;
    const contar = (objeto, chave) => objeto[chave] || 0;
    let lista = [];
    textSize(11); // para medir a largura das etiquetas das divisões

    // se o sorteio não cumprir as regras, tenta-se outra vez (até 20 vezes)
    for (let tentativa = 0; tentativa < 20; tentativa++) {
      // cada divisão começa vazia: só a etiqueta com o nome e a mobília ocupam espaço
      for (const divisao of this.divisoes) {
        divisao.contagem = {};
        const etiqueta = [divisao.x + 10, divisao.y + 10, divisao.x + 24 + textWidth(divisao.nome), divisao.y + 28];
        const moveis = divisao.mobilia.map((m) => [m.x, m.y, m.x + m.w, m.y + m.h]);
        divisao.ocupado = [etiqueta, ...moveis];
      }

      const porTipo = {};
      lista = [];
      let falhas = 0;

      while (lista.length < total && falhas < 200) {
        // escolhe uma divisão (as maiores e as mais "importantes" saem mais vezes)
        const pesosDivisoes = this.divisoes.map((d) => d.w * d.h * d.dados.peso);
        const divisao = this.divisoes[Edificio.sortearIndice(pesosDivisoes)];

        // tipos de equipamento ainda possíveis nesta divisão
        const opcoes = Object.entries(divisao.dados.equipamentos).filter(([tipo]) => {
          if (contar(divisao.contagem, tipo) >= EQUIPAMENTOS[tipo].maximo) return false;
          if (tipo === 'lamp' && contar(porTipo, tipo) >= ceil(total / 2)) return false;
          if (tipo === 'ac' && contar(porTipo, tipo) >= ceil(total / 3)) return false;
          return true;
        });

        let novo = null;
        if (opcoes.length > 0) {
          const tipo = opcoes[Edificio.sortearIndice(opcoes.map((o) => o[1]))][0];
          novo = this.colocarEquipamento(divisao, tipo);
        }

        if (novo) {
          lista.push(novo);
          porTipo[novo.tipo] = contar(porTipo, novo.tipo) + 1;
        } else {
          falhas++;
        }
      }

      const tem = (tipo) => lista.some((eq) => eq.tipo === tipo);
      if (lista.length === total && tem('ac') && (total < 5 || tem('computer'))) break;
    }
    return lista;
  }

  desenhar() {
    for (const divisao of this.divisoes) {
      this.desenharDivisao(divisao);
    }

    // contorno grosso à volta de toda a casa
    let colunas = 0, linhas = 0;
    for (const [, , coluna, linha, largura, altura] of this.tipologia.divisoes) {
      colunas = max(colunas, coluna + largura);
      linhas = max(linhas, linha + altura);
    }
    noFill();
    stroke(COR.fundoEscuro);
    strokeWeight(10);
    rect(PLANTA_X, PLANTA_Y, colunas * QUADRADO_LARGURA, linhas * QUADRADO_ALTURA);
    noStroke();

    for (const eq of this.equipamentos) {
      eq.desenhar();
    }
  }

  // Parede, chão com tábuas, mobília, paredes da divisão e etiqueta com o nome
  desenharDivisao(divisao) {
    const { x, y, w, h, dados } = divisao;
    const alturaChao = constrain(h * 0.28, 40, 60);
    const inicioChao = y + h - alturaChao;

    noStroke();
    fill(dados.parede);
    rect(x, y, w, h - alturaChao);
    fill(dados.chao);
    rect(x, inicioChao, w, alturaChao);
    fill(0, 0, 0, 45); // sombra junto ao rodapé
    rect(x, inicioChao, w, 6);

    // tábuas do chão
    stroke(0, 0, 0, 28);
    strokeWeight(2);
    for (let i = x + 40; i < x + w; i += 56) {
      line(i, inicioChao + 6, i - 12, y + h);
    }
    noStroke();

    for (const movel of divisao.mobilia) {
      image(imgMoveis[movel.nome], movel.x, movel.y, movel.w, movel.h);
    }

    noFill();
    stroke(COR.fundoEscuro);
    strokeWeight(6);
    rect(x, y, w, h);
    noStroke();

    textSize(11);
    fill(30, 36, 44, 210);
    rect(x + 10, y + 10, textWidth(divisao.nome) + 14, 18);
    escrever(divisao.nome, x + 17, y + 23, 11, COR.branco, LEFT);
  }
}