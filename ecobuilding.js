// =====================================================================
// Eco Building — Eficiência energética num edifício
// Sistemas Multimédia | ECGM | 2026/2027 | Paulo Monteiro (32441)
//
// Etapa 1: estrutura inicial e menu.
// O jogador escolhe a tipologia da casa (T0 a T4) e carrega em COMEÇAR.
// A ronda de jogo ainda não existe; aparece um ecrã provisório.
// =====================================================================


// ---------------------------------------------------------------------
// 1. CONFIGURAÇÃO
// ---------------------------------------------------------------------

const LARGURA = 1024;
const ALTURA = 576;
const PASTA_IMAGENS = 'assets/';

// Paleta de cores usada em toda a interface
const COR = {
  verdeEscuro: '#2d6a4f',
  verde: '#52b788',
  verdeClaro: '#b7e4c7',
  escuro: '#1e242c',
  branco: '#f5f5f0',
  laranja: '#d98a3d',
  laranjaEscuro: '#9a5a1a',
  amarelo: '#ffd54a',
  fundoEscuro: '#0a1c16',
};

// Cor da parede de cada tipo de divisão (usada na planta dos cartões)
const COR_DIVISAO = {
  sala: '#f6e8cd',
  estudio: '#f6e8cd',
  quarto: '#cfe3f5',
  cozinha: '#dfe5ea',
  wc: '#d5f0e0',
  hall: '#efe3d1',
};

// Cada tipologia tem uma planta desenhada numa grelha de 12 x 8 quadrados.
// Cada divisão é: [código, tipo, coluna, linha, largura, altura]
const TIPOLOGIAS = [
  {
    id: 'T0', descricao: 'Estúdio', equipamentos: 4,
    divisoes: [['S/Q', 'estudio', 0, 0, 8, 8], ['C', 'cozinha', 8, 0, 4, 4], ['WC', 'wc', 8, 4, 4, 4]],
  },
  {
    id: 'T1', descricao: '1 quarto', equipamentos: 6,
    divisoes: [['Q', 'quarto', 0, 0, 5, 8], ['S', 'sala', 5, 0, 7, 5], ['C', 'cozinha', 5, 5, 4, 3], ['WC', 'wc', 9, 5, 3, 3]],
  },
  {
    id: 'T2', descricao: '2 quartos', equipamentos: 8,
    divisoes: [['Q1', 'quarto', 0, 0, 4, 4], ['Q2', 'quarto', 0, 4, 4, 4], ['S', 'sala', 4, 0, 5, 5],
               ['C', 'cozinha', 9, 0, 3, 4], ['WC', 'wc', 9, 4, 3, 4], ['H', 'hall', 4, 5, 5, 3]],
  },
  {
    id: 'T3', descricao: '3 quartos', equipamentos: 10,
    divisoes: [['Q1', 'quarto', 0, 0, 3, 4], ['Q2', 'quarto', 3, 0, 3, 4], ['Q3', 'quarto', 6, 0, 3, 4], ['WC', 'wc', 9, 0, 3, 4],
               ['S', 'sala', 0, 4, 5, 4], ['C', 'cozinha', 5, 4, 4, 4], ['WC', 'wc', 9, 4, 3, 4]],
  },
  {
    id: 'T4', descricao: '4 quartos', equipamentos: 12,
    divisoes: [['Q1', 'quarto', 0, 0, 3, 4], ['Q2', 'quarto', 3, 0, 3, 4], ['Q3', 'quarto', 6, 0, 3, 4], ['Q4', 'quarto', 9, 0, 3, 4],
               ['S', 'sala', 0, 4, 5, 4], ['C', 'cozinha', 5, 4, 3, 4], ['WC', 'wc', 8, 4, 2, 4], ['WC', 'wc', 10, 4, 2, 4]],
  },
];

// Tamanho e posição dos cartões das tipologias no menu
const CARTAO_LARGURA = 150;
const CARTAO_ALTURA = 190;
const CARTAO_ESPACO = 14;
const CARTAO_Y = 132;

// Botões (posição x, y, largura e altura)
const BOTAO_COMECAR = { x: 382, y: 352, w: 260, h: 56 };
const BOTAO_VOLTAR = { x: 412, y: 330, w: 200, h: 48 };


// ---------------------------------------------------------------------
// 2. ESTADO DO JOGO
// ---------------------------------------------------------------------

let estado = 'menu';          // 'menu' ou 'jogo'
let tipologiaEscolhida = 1;   // índice em TIPOLOGIAS (começa no T1)
let areasClicaveis = [];      // botões e cartões desenhados no frame atual

let imgCeu, imgFolha;
let imgEdificios = [];


// ---------------------------------------------------------------------
// 3. FUNÇÕES DO p5
// ---------------------------------------------------------------------

function preload() {
  imgCeu = loadImage(PASTA_IMAGENS + 'backgrounds/bg_menu_sky.png');
  imgFolha = loadImage(PASTA_IMAGENS + 'ui/icon_leaf.png');

  const nomes = ['apartamento', 'moradia', 'escritorio', 'escola'];
  for (const nome of nomes) {
    imgEdificios.push(loadImage(PASTA_IMAGENS + 'buildings/' + nome + '.png'));
  }
}

function setup() {
  createCanvas(LARGURA, ALTURA);
  pixelDensity(1);
  noSmooth(); // mantém o pixel art nítido quando as imagens são ampliadas
  textFont('Courier New');
  textStyle(BOLD);
}

function draw() {
  // As áreas clicáveis são registadas de novo em cada frame, ao desenhar os botões
  areasClicaveis = [];

  desenharCenario();
  if (estado === 'menu') {
    desenharMenu();
  } else if (estado === 'jogo') {
    desenharJogoProvisorio();
  }
  desenharRodape();

  // Mostra a "mãozinha" quando o rato está por cima de algo clicável
  if (ratoSobreAlgoClicavel()) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function mousePressed() {
  for (const area of areasClicaveis) {
    if (ratoDentro(area.retangulo)) {
      area.acao();
      return;
    }
  }
}


// ---------------------------------------------------------------------
// 4. FUNÇÕES DE APOIO À INTERFACE
// ---------------------------------------------------------------------

function ratoDentro(r) {
  return mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h;
}

function ratoSobreAlgoClicavel() {
  return areasClicaveis.some((area) => ratoDentro(area.retangulo));
}

// Escreve um texto com tamanho, cor e alinhamento
function escrever(texto, x, y, tamanho, cor, alinhamento = CENTER) {
  noStroke();
  fill(cor);
  textSize(tamanho);
  textAlign(alinhamento, BASELINE);
  text(texto, x, y);
}

// Título com uma sombra verde por trás, para se destacar do fundo
function escreverTitulo(texto, x, y, tamanho) {
  const sombra = max(2, round(tamanho / 10));
  escrever(texto, x + sombra, y + sombra, tamanho, COR.verdeEscuro);
  escrever(texto, x, y, tamanho, COR.branco);
}

// Retângulo com borda e uma sombra escura ligeiramente deslocada
function desenharCaixa(x, y, w, h, corFundo, corBorda, espessura = 4) {
  noStroke();
  fill(0, 0, 0, 120);
  rect(x + 6, y + 8, w, h);

  stroke(corBorda);
  strokeWeight(espessura);
  fill(corFundo);
  rect(x, y, w, h);
  noStroke();
}

// Desenha um botão e regista a área para o clique.
// Os botões principais são amarelos; os secundários são claros.
function desenharBotao(r, texto, acao, secundario = false, tamanhoTexto = 22) {
  const ratoPorCima = ratoDentro(r);
  const descer = ratoPorCima && mouseIsPressed ? 4 : 0; // efeito de "carregar" no botão

  let corFundo;
  if (secundario) {
    corFundo = ratoPorCima ? '#ffffff' : '#dfe8e2';
  } else {
    corFundo = ratoPorCima ? '#ffe27d' : COR.amarelo;
  }

  desenharCaixa(r.x, r.y + descer, r.w, r.h, corFundo, COR.fundoEscuro);

  // pequeno brilho no topo do botão
  fill(255, 255, 255, 120);
  rect(r.x + 5, r.y + descer + 5, r.w - 10, 4);

  escrever(texto, r.x + r.w / 2, r.y + descer + r.h / 2 + tamanhoTexto * 0.35, tamanhoTexto, COR.escuro);

  areasClicaveis.push({ retangulo: r, acao: acao });
}

// Fundo: céu, os quatro edifícios e uma camada escura por cima.
// A camada escura (mais forte em cima) dá contraste aos botões e ao texto.
function desenharCenario() {
  image(imgCeu, 0, 0, LARGURA, ALTURA);
  for (let i = 0; i < imgEdificios.length; i++) {
    image(imgEdificios[i], i * 245, 232, 288, 288);
  }

  const degrade = drawingContext.createLinearGradient(0, 0, 0, 512);
  degrade.addColorStop(0, 'rgba(10, 28, 22, 0.9)');
  degrade.addColorStop(0.5, 'rgba(10, 28, 22, 0.72)');
  degrade.addColorStop(1, 'rgba(10, 28, 22, 0.35)');
  drawingContext.fillStyle = degrade;
  drawingContext.fillRect(0, 0, LARGURA, 512);
}

// Tema no canto inferior esquerdo e dados do aluno no canto inferior direito (pedido no enunciado)
function desenharRodape() {
  escrever('Energy Efficiency in a Building', 16, ALTURA - 14, 14, COR.branco, LEFT);
  escrever('Paulo Monteiro | 32441 | ECGM', LARGURA - 16, ALTURA - 14, 14, COR.branco, RIGHT);
}


// ---------------------------------------------------------------------
// 5. ECRÃ DO MENU
// ---------------------------------------------------------------------

function desenharMenu() {
  image(imgFolha, LARGURA / 2 - 190, 14, 48, 48);
  escreverTitulo('ECO BUILDING', LARGURA / 2 + 25, 50, 40);
  escrever('Eficiência energética num edifício', LARGURA / 2, 76, 14, COR.verdeClaro);
  escrever('ESCOLHE A TIPOLOGIA', LARGURA / 2, 118, 14, COR.verdeClaro);

  for (let i = 0; i < TIPOLOGIAS.length; i++) {
    desenharCartao(TIPOLOGIAS[i], i);
  }

  desenharBotao(BOTAO_COMECAR, 'COMEÇAR', comecar, false, 24);

  // faixa com a instrução principal do jogo
  fill(10, 28, 22, 225);
  rect(LARGURA / 2 - 330, 464, 660, 26, 13);
  escrever('Clica nos equipamentos ligados para os desligar antes que o tempo acabe', LARGURA / 2, 482, 13, COR.branco);
}

// Cartão de uma tipologia: nome, planta das divisões e resumo.
// O cartão escolhido fica branco, com borda amarela e ligeiramente levantado.
function desenharCartao(tipologia, indice) {
  const larguraTotal = 5 * CARTAO_LARGURA + 4 * CARTAO_ESPACO;
  const x = (LARGURA - larguraTotal) / 2 + indice * (CARTAO_LARGURA + CARTAO_ESPACO);
  const area = { x: x, y: CARTAO_Y, w: CARTAO_LARGURA, h: CARTAO_ALTURA };

  const escolhido = indice === tipologiaEscolhida;
  const ratoPorCima = ratoDentro(area);
  areasClicaveis.push({ retangulo: area, acao: () => (tipologiaEscolhida = indice) });

  let subir = 0;
  if (escolhido) subir = 8;
  else if (ratoPorCima) subir = 4;

  push();
  translate(area.x, area.y - subir);

  // fundo e cabeçalho
  if (escolhido) {
    desenharCaixa(0, 0, area.w, area.h, '#ffffff', COR.amarelo, 5);
    fill(COR.laranja);
  } else {
    desenharCaixa(0, 0, area.w, area.h, '#dfe8e2', COR.fundoEscuro, 3);
    fill(COR.verdeEscuro);
  }
  rect(3, 3, area.w - 6, 30);
  escrever(tipologia.id, area.w / 2, 27, 24, escolhido ? COR.escuro : COR.branco);

  // planta: cada quadrado da grelha mede 10 px dentro do cartão
  for (const [codigo, tipo, coluna, linha, largura, altura] of tipologia.divisoes) {
    stroke(COR.escuro);
    strokeWeight(2);
    fill(COR_DIVISAO[tipo]);
    rect(15 + coluna * 10, 44 + linha * 10, largura * 10, altura * 10);
    escrever(codigo, 15 + (coluna + largura / 2) * 10, 47 + (linha + altura / 2) * 10, 9, COR.escuro);
  }

  // resumo
  const numeroWC = tipologia.divisoes.filter((d) => d[1] === 'wc').length;
  escrever(tipologia.descricao, area.w / 2, 148, 14, COR.escuro);
  escrever(tipologia.divisoes.length + ' divisões · ' + numeroWC + ' WC', area.w / 2, 165, 11, COR.escuro);
  escrever(tipologia.equipamentos + ' equipamentos', area.w / 2, 181, 11, COR.laranjaEscuro);

  // os cartões não escolhidos ficam um pouco mais escuros
  if (!escolhido && !ratoPorCima) {
    fill(10, 28, 22, 45);
    rect(0, 0, area.w, area.h);
  }
  pop();
}

function comecar() {
  estado = 'jogo';
}


// ---------------------------------------------------------------------
// 6. ECRÃ DE JOGO (PROVISÓRIO)
// O edifício e os equipamentos entram na próxima etapa.
// ---------------------------------------------------------------------

function desenharJogoProvisorio() {
  const tipologia = TIPOLOGIAS[tipologiaEscolhida];

  desenharCaixa(262, 150, 500, 260, 'rgba(10, 28, 22, 0.94)', COR.amarelo);
  escreverTitulo(tipologia.id + ' · ' + tipologia.descricao, LARGURA / 2, 210, 30);
  escrever(tipologia.divisoes.length + ' divisões · ' + tipologia.equipamentos + ' equipamentos', LARGURA / 2, 246, 15, COR.verdeClaro);
  escrever('Ronda de jogo em desenvolvimento', LARGURA / 2, 290, 15, COR.branco);

  desenharBotao(BOTAO_VOLTAR, 'VOLTAR', () => (estado = 'menu'), true, 16);
}