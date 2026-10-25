// =====================================================================
// Eco Building — Eficiência energética num edifício
// Sistemas Multimédia | ECGM | 2026/2027 | Paulo Monteiro (32441)
//
// Etapa 5: dificuldade crescente, pausa e resultado.
// Os equipamentos ligam-se cada vez mais depressa (4 níveis), há pausa
// e o resultado mostra o consumo evitado e uma sugestão de poupança.
//
// Classes (pasta classes/):
//   Edificio    — cria as divisões e decide onde fica cada equipamento
//   Equipamento — um equipamento ligado ou desligado
//   Microfone   — autorização, calibração e deteção de sons curtos
//   EcoPulso    — o círculo lançado pelo som e as colisões
// =====================================================================


// ---------------------------------------------------------------------
// 1. CONFIGURAÇÃO
// ---------------------------------------------------------------------

const LARGURA = 1024;
const ALTURA = 576;
const PASTA_IMAGENS = 'assets/';

// Regras da ronda
const DURACAO_RONDA = 60;            // segundos
const PONTOS_POR_EQUIPAMENTO = 10;
const CONTAGEM_INICIAL = 3;          // segundos de "3, 2, 1" antes de começar
const RAIO_CLIQUE = 30;              // distância (px) ao centro do equipamento que conta como clique

// Equipamentos que se ligam sozinhos durante a ronda
const FRACAO_LIGADOS_INICIO = 0.4;   // 40% começam ligados
const FRACAO_LIGADOS_MAXIMO = 0.7;   // nunca mais de 70% ligados ao mesmo tempo
const INTERVALO_LIGAR = [1.6, 3.0];  // segundos entre cada equipamento que se liga

// Dificuldade crescente: no fim da ronda os equipamentos ligam-se 2,5 vezes mais depressa
// e podem estar até 90% ligados. O nível sobe a cada 15 segundos (4 níveis).
const ACELERACAO_FINAL = 2.5;
const FRACAO_LIGADOS_FIM = 0.9;
const NIVEIS = 4;

// Microfone (valores do relatório: dispara acima de 0,18 e só rearma abaixo de 0,10)
const CALIBRACAO_MS = 2000;          // tempo de silêncio para medir o ruído da sala
const MARGEM_INICIAL = 0.18;         // quanto acima do ruído da sala tem de estar o som
const FOLGA_HISTERESE = 0.08;        // diferença entre o limite de disparo e o de rearme
const MARGEM_MINIMA = 0.10;
const MARGEM_MAXIMA = 0.40;

// Eco-Pulso
const PULSO_DURACAO = 0.55;          // segundos até atingir o tamanho máximo
const PULSO_RAIO_MINIMO = 45;        // px, com um som fraco
const PULSO_RAIO_MAXIMO = 110;       // px, com um som forte

// Posição da planta da casa no ecrã: cada quadrado da grelha 12 x 8 mede 80 x 54 px
const PLANTA_X = 32;
const PLANTA_Y = 72;
const QUADRADO_LARGURA = 80;
const QUADRADO_ALTURA = 54;

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
  vermelho: '#d64541',
  cinza: '#8c94a0',
};

// Tipos de divisão.
//   peso: divisões com mais peso recebem mais equipamentos no sorteio
//   equipamentos: que equipamentos podem aparecer lá e com que probabilidade relativa
//   mobilia: móveis fixos [imagem, lado ('esq' ou 'dir'), distância à parede em px]
const TIPOS_DIVISAO = {
  sala: {
    nome: 'SALA', parede: '#f6e8cd', chao: '#a9774a', peso: 1.2,
    equipamentos: { tv: 3, lamp: 3, ac: 2, computer: 1 },
    mobilia: [['sofa', 'esq', 16], ['planta', 'dir', 14]],
  },
  estudio: {
    nome: 'ESTÚDIO', parede: '#f6e8cd', chao: '#a9774a', peso: 1.2,
    equipamentos: { tv: 2, lamp: 3, ac: 2, computer: 2 },
    mobilia: [['sofa', 'esq', 16], ['cama', 'dir', 16]],
  },
  quarto: {
    nome: 'QUARTO', parede: '#cfe3f5', chao: '#7f95b5', peso: 1,
    equipamentos: { lamp: 3, computer: 3, ac: 2, tv: 1 },
    mobilia: [['cama', 'esq', 14], ['roupeiro', 'dir', 14]],
  },
  cozinha: {
    nome: 'COZINHA', parede: '#dfe5ea', chao: '#9aa3ad', peso: 0.8,
    equipamentos: { lamp: 3, ac: 1 },
    mobilia: [['bancada', 'esq', 10], ['frigorifico', 'dir', 12]],
  },
  wc: {
    nome: 'WC', parede: '#d5f0e0', chao: '#7fb59a', peso: 0.4,
    equipamentos: { lamp: 1 },
    mobilia: [['sanita', 'esq', 14], ['lavatorio', 'dir', 12]],
  },
  hall: {
    nome: 'HALL', parede: '#efe3d1', chao: '#a88c6a', peso: 0.4,
    equipamentos: { lamp: 1 },
    mobilia: [['planta', 'esq', 16], ['mesa', 'dir', 16]],
  },
};

// Equipamentos.
//   potencia: consumo simulado em kW (valores ilustrativos)
//   local: 'teto' (lâmpada pendurada), 'parede' (no alto) ou 'chao' (em cima de um móvel)
//   maximo: quantos deste tipo pode haver na mesma divisão
//   caixa: parte visível da imagem em relação ao centro [esquerda, cima, direita, baixo]
//   dica: sugestão de poupança mostrada no fim da ronda
const EQUIPAMENTOS = {
  lamp: {
    nome: 'Lâmpada', potencia: 0.06, local: 'teto', maximo: 2, caixa: [-16, -30, 16, 26],
    dica: 'Desliga as luzes das divisões vazias.',
  },
  ac: {
    nome: 'Ar condicionado', potencia: 1.2, local: 'parede', maximo: 1, caixa: [-28, -24, 28, 30],
    dica: 'Desliga o ar condicionado ao sair e mantém-no nos 24 ºC.',
  },
  tv: {
    nome: 'Televisão', potencia: 0.15, local: 'chao', movel: 'movel_tv', maximo: 1, caixa: [-28, -30, 28, 24],
    dica: 'Desliga a televisão em vez de a deixar em standby.',
  },
  computer: {
    nome: 'Computador', potencia: 0.2, local: 'chao', movel: 'secretaria', maximo: 1, caixa: [-26, -26, 26, 30],
    dica: 'Põe o computador em suspensão ou desliga-o quando sais.',
  },
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
const BOTAO_JOGAR_NOVAMENTE = { x: 262, y: 430, w: 280, h: 52 };
const BOTAO_MENU = { x: 562, y: 430, w: 200, h: 52 };
const BOTAO_COMECAR_RONDA = { x: 362, y: 400, w: 300, h: 48 };
const BOTAO_RECALIBRAR = { x: 232, y: 460, w: 200, h: 34 };    // também usado para "SÓ COM O RATO"
const BOTAO_VOLTAR = { x: 592, y: 460, w: 200, h: 34 };
const BOTAO_MENOS = { x: 612, y: 326, w: 34, h: 26 };
const BOTAO_MAIS = { x: 654, y: 326, w: 34, h: 26 };
const BOTAO_PAUSA = { x: 916, y: 517, w: 92, h: 24 };
const BOTAO_CONTINUAR = { x: 362, y: 320, w: 300, h: 52 };
const BOTAO_SAIR = { x: 412, y: 392, w: 200, h: 40 };
const BOTAO_ECRA_INTEIRO = { x: 838, y: 16, w: 170, h: 30 };


// ---------------------------------------------------------------------
// 2. ESTADO DO JOGO
// ---------------------------------------------------------------------

let estado = 'menu';          // 'menu', 'calibracao', 'jogo' ou 'resultado'
let tipologiaEscolhida = 1;   // índice em TIPOLOGIAS (começa no T1)
let areasClicaveis = [];      // botões e cartões desenhados no frame atual
let ratoMexeu = false;        // a mira só aparece depois de o rato se mexer
let tela;                     // o canvas do p5 (é ampliado para ocupar a janela)

// Imagens
let imgCeu, imgFolha, imgAlerta;
let imgFaiscas;
let imgEdificios = [];
let imgEquipamentos = {};     // ex.: imgEquipamentos['lamp_on']
let imgMoveis = {};           // ex.: imgMoveis['sofa']
let framesFaisca = [];        // as 4 imagens da animação das faíscas

// Dados da ronda atual
let edificio = null;
let equipamentos = [];
let tempoRestante = DURACAO_RONDA;
let contagem = 0;
let tempoAteProximo = 0;      // segundos até se ligar mais um equipamento
let pontos = 0;
let totalDesligados = 0;
let totalLigados = 0;
let pulsos = [];              // Eco-Pulsos ativos
let efeitos = [];             // faíscas, "+10", anéis e avisos ativos
let pausado = false;
let nivelAtual = 1;
let consumoLigado = 0;        // soma dos kW de todos os equipamentos que se ligaram
let consumoEvitado = 0;       // soma dos kW dos equipamentos desligados pelo jogador
let desperdicio = {};         // kW x segundos que cada tipo de equipamento esteve ligado
let resultado = null;         // dados calculados no fim da ronda
let recordes = {};            // melhor pontuação de cada tipologia (guardada no navegador)

const microfone = new Microfone();
let oscilador, envelope;      // criados no primeiro som (o navegador só deixa tocar depois de um clique)


// ---------------------------------------------------------------------
// 3. FUNÇÕES DO p5
// ---------------------------------------------------------------------

function preload() {
  imgCeu = loadImage(PASTA_IMAGENS + 'backgrounds/bg_menu_sky.png');
  imgFolha = loadImage(PASTA_IMAGENS + 'ui/icon_leaf.png');
  imgAlerta = loadImage(PASTA_IMAGENS + 'devices/alert_badge.png');
  imgFaiscas = loadImage(PASTA_IMAGENS + 'fx/spark_sheet_4x32.png');

  for (const nome of ['apartamento', 'moradia', 'escritorio', 'escola']) {
    imgEdificios.push(loadImage(PASTA_IMAGENS + 'buildings/' + nome + '.png'));
  }

  // cada equipamento tem uma imagem ligado (_on) e outra desligado (_off)
  for (const tipo in EQUIPAMENTOS) {
    imgEquipamentos[tipo + '_on'] = loadImage(PASTA_IMAGENS + 'devices/' + tipo + '_on.png');
    imgEquipamentos[tipo + '_off'] = loadImage(PASTA_IMAGENS + 'devices/' + tipo + '_off.png');
  }

  const moveis = ['cama', 'sofa', 'roupeiro', 'bancada', 'frigorifico', 'sanita', 'lavatorio', 'mesa', 'planta', 'movel_tv', 'secretaria'];
  for (const nome of moveis) {
    imgMoveis[nome] = loadImage(PASTA_IMAGENS + 'furniture/' + nome + '.png');
  }
}

function setup() {
  tela = createCanvas(LARGURA, ALTURA);
  pixelDensity(1);
  ajustarAoEcra(); // depois do pixelDensity, que repõe o tamanho original do canvas
  noSmooth(); // mantém o pixel art nítido quando as imagens são ampliadas
  textFont('Courier New');
  textStyle(BOLD);

  // a imagem das faíscas tem 4 quadros lado a lado, de 32 x 32 px
  for (let i = 0; i < 4; i++) {
    framesFaisca.push(imgFaiscas.get(i * 32, 0, 32, 32));
  }

  // recordes guardados em jogos anteriores (se o navegador o permitir)
  try {
    recordes = JSON.parse(localStorage.getItem('ecoBuilding_recordes')) || {};
  } catch (erro) {
    recordes = {};
  }

  // se a janela perder o foco a meio da ronda, o jogo fica em pausa
  window.addEventListener('blur', () => {
    if (estado === 'jogo' && contagem <= 0) pausado = true;
  });
}

function draw() {
  // tempo desde o último frame, em segundos (limitado para não dar saltos se a janela perder o foco)
  const dt = min(deltaTime / 1000, 0.1);
  microfone.lerNivel(dt);

  // As áreas clicáveis são registadas de novo em cada frame, ao desenhar os botões
  areasClicaveis = [];

  if (estado === 'jogo') {
    atualizarRonda(dt);
    desenharRonda();
  } else {
    if (estado === 'calibracao') microfone.atualizarCalibracao(dt);
    desenharCenario();
    if (estado === 'menu') desenharMenu();
    if (estado === 'calibracao') desenharCalibracao();
    if (estado === 'resultado') desenharResultado();
  }
  desenharRodape();

  // o botão de ecrã inteiro aparece fora da ronda e na pausa (durante a ronda o painel ocupa esse canto)
  if (estado !== 'jogo' || pausado) {
    const texto = fullscreen() ? 'SAIR DE ECRÃ INTEIRO' : 'ECRÃ INTEIRO';
    desenharBotao(BOTAO_ECRA_INTEIRO, texto, alternarEcraInteiro, true, 12);
  }

  // Durante a ronda o cursor normal é escondido e substituído pela mira
  if (estado === 'jogo' && !pausado && mouseY < 512) {
    noCursor();
  } else if (ratoSobreAlgoClicavel()) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

// O jogo é desenhado sempre a 1024 x 576 e depois ampliado pelo navegador para ocupar a janela,
// mantendo a proporção (sobram margens escuras se o ecrã tiver outro formato).
// O p5 converte sozinho a posição do rato para as coordenadas do jogo.
function ajustarAoEcra() {
  const escala = min(windowWidth / LARGURA, windowHeight / ALTURA);
  tela.style('width', floor(LARGURA * escala) + 'px');
  tela.style('height', floor(ALTURA * escala) + 'px');
}

// chamada pelo p5 sempre que a janela muda de tamanho (incluindo ao entrar e sair do ecrã inteiro)
function windowResized() {
  ajustarAoEcra();
}

// o navegador só deixa entrar em ecrã inteiro depois de um clique, por isso é um botão
function alternarEcraInteiro() {
  fullscreen(!fullscreen());
}

function mouseMoved() {
  ratoMexeu = true;
}

function mousePressed() {
  ratoMexeu = true;
  userStartAudio(); // o navegador só deixa usar o som e o microfone depois de um clique

  // primeiro os botões
  for (const area of areasClicaveis) {
    if (ratoDentro(area.retangulo)) {
      area.acao();
      return;
    }
  }

  // depois, durante a ronda, o clique num equipamento ligado desliga-o
  if (estado === 'jogo' && contagem <= 0 && !pausado) {
    const alvo = equipamentoSobORato();
    if (alvo) desligarEquipamento(alvo);
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

// Equipamento ligado que está debaixo do rato (ou null)
function equipamentoSobORato() {
  return equipamentos.find((eq) => eq.ligado && eq.estaSobORato()) || null;
}

function formatarKW(valor) {
  return valor.toFixed(2).replace('.', ',') + ' kW';
}

function formatarNumero(valor) {
  return valor.toFixed(2).replace('.', ',');
}

// Escreve um texto com tamanho, cor e alinhamento
function escrever(texto, x, y, tamanho, cor, alinhamento = CENTER) {
  noStroke();
  fill(cor);
  textSize(tamanho);
  textAlign(alinhamento, BASELINE);
  text(texto, x, y);
}

// Texto com contorno escuro, para se ler por cima de qualquer cor (usado no "+10")
function escreverComContorno(texto, x, y, tamanho, cor) {
  stroke(COR.escuro);
  strokeWeight(max(3, tamanho / 6));
  fill(cor);
  textSize(tamanho);
  textAlign(CENTER, BASELINE);
  text(texto, x, y);
  noStroke();
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

// Camada escura em degradê por cima do fundo, para dar contraste ao texto e aos botões
function escurecerFundo(opacidadeCima, opacidadeMeio, opacidadeBaixo, altura) {
  const degrade = drawingContext.createLinearGradient(0, 0, 0, altura);
  degrade.addColorStop(0, 'rgba(10, 28, 22, ' + opacidadeCima + ')');
  degrade.addColorStop(0.5, 'rgba(10, 28, 22, ' + opacidadeMeio + ')');
  degrade.addColorStop(1, 'rgba(10, 28, 22, ' + opacidadeBaixo + ')');
  drawingContext.fillStyle = degrade;
  drawingContext.fillRect(0, 0, LARGURA, altura);
}

// Fundo dos menus: céu, os quatro edifícios e a camada escura
function desenharCenario() {
  image(imgCeu, 0, 0, LARGURA, ALTURA);
  for (let i = 0; i < imgEdificios.length; i++) {
    image(imgEdificios[i], i * 245, 232, 288, 288);
  }
  escurecerFundo(0.9, 0.72, 0.35, 512);
}

// Tema no canto inferior esquerdo e dados do aluno no canto inferior direito (pedido no enunciado)
function desenharRodape() {
  escrever('Energy Efficiency in a Building', 16, ALTURA - 14, 14, COR.branco, LEFT);
  escrever('Paulo Monteiro | 32441 | ECGM', LARGURA - 16, ALTURA - 14, 14, COR.branco, RIGHT);
}


// ---------------------------------------------------------------------
// 5. RONDA
// ---------------------------------------------------------------------

function comecar() {
  // antes da ronda, o microfone tem de ser autorizado e calibrado
  estado = 'calibracao';
  microfone.pedirAcesso();
}

function novaRonda() {
  const tipologia = TIPOLOGIAS[tipologiaEscolhida];
  edificio = new Edificio(tipologia);
  equipamentos = edificio.equipamentos;

  tempoRestante = DURACAO_RONDA;
  contagem = CONTAGEM_INICIAL;
  tempoAteProximo = random(1.2, 2.4);
  pontos = 0;
  totalDesligados = 0;
  totalLigados = 0;
  pulsos = [];
  pausado = false;
  nivelAtual = 1;
  consumoLigado = 0;
  consumoEvitado = 0;
  desperdicio = { lamp: 0, ac: 0, tv: 0, computer: 0 };

  // alguns equipamentos já começam ligados, escolhidos ao acaso
  const quantos = max(2, round(equipamentos.length * FRACAO_LIGADOS_INICIO));
  const baralhados = shuffle(equipamentos.slice());
  for (let i = 0; i < quantos; i++) {
    ligarEquipamento(baralhados[i]);
  }
  efeitos = []; // os anéis dos equipamentos que já começam ligados não aparecem

  estado = 'jogo';
}

function ligarEquipamento(eq) {
  eq.ligado = true;
  eq.animacao = 1;
  totalLigados++;
  consumoLigado += eq.potencia;
  efeitos.push({ tipo: 'anel', x: eq.x, y: eq.y, tempo: 0 });
}

// acertoNoPulso: 0 para o primeiro equipamento apanhado por um pulso, 1 para o segundo, ...
function desligarEquipamento(eq, acertoNoPulso = 0) {
  eq.ligado = false;
  eq.animacao = 1;
  pontos += PONTOS_POR_EQUIPAMENTO;
  totalDesligados++;
  consumoEvitado += eq.potencia;

  efeitos.push({ tipo: 'faisca', x: eq.x, y: eq.y, tempo: 0 });
  efeitos.push({ tipo: 'texto', x: eq.x, y: eq.y - 30, tempo: 0 });
  somAcerto(acertoNoPulso);
}

function atualizarRonda(dt) {
  if (pausado) return;

  for (const eq of equipamentos) {
    eq.atualizar(dt);
  }
  atualizarEfeitos(dt);

  // contagem "3, 2, 1" antes de o tempo começar a contar
  if (contagem > 0) {
    contagem -= dt;
    microfone.armado = false; // um som durante a contagem não deve lançar um pulso logo no início
    return;
  }

  tempoRestante -= dt;

  // regista o desperdício de cada tipo de equipamento (para a sugestão no fim)
  for (const eq of equipamentos) {
    if (eq.ligado) desperdicio[eq.tipo] += eq.potencia * dt;
  }

  // nível de 1 a 4, conforme o tempo que já passou
  const progresso = 1 - tempoRestante / DURACAO_RONDA;
  const novoNivel = 1 + min(NIVEIS - 1, floor(progresso * NIVEIS));
  if (novoNivel > nivelAtual) {
    nivelAtual = novoNivel;
    efeitos.push({ tipo: 'nivel', tempo: 0 });
    somNivel();
  }

  // de vez em quando liga-se mais um equipamento que estava desligado
  tempoAteProximo -= dt;
  if (tempoAteProximo <= 0) {
    const desligados = equipamentos.filter((eq) => !eq.ligado);
    const ligadosAgora = equipamentos.length - desligados.length;
    const limite = ceil(equipamentos.length * lerp(FRACAO_LIGADOS_MAXIMO, FRACAO_LIGADOS_FIM, progresso));

    if (ligadosAgora < limite && desligados.length > 0) {
      ligarEquipamento(random(desligados));
    }

    // casas com mais equipamentos ligam-nos mais depressa
    // casas com mais equipamentos ligam-nos mais depressa, e o ritmo aumenta ao longo da ronda
    tempoAteProximo = random(INTERVALO_LIGAR[0], INTERVALO_LIGAR[1]) * sqrt(4 / equipamentos.length) / ritmoAtual();
  }

  // um som curto lança um Eco-Pulso a partir do cursor
  if (microfone.detetouSom()) {
    pulsos.push(new EcoPulso(mouseX, mouseY, microfone.nivel));
  }
  for (const pulso of pulsos) {
    pulso.atualizar(dt, equipamentos, desligarEquipamento);
  }
  pulsos = pulsos.filter((pulso) => pulso.ativo);

  if (tempoRestante <= 0) {
    terminarRonda();
  }
}

// Ritmo a que os equipamentos se ligam: 1x no início da ronda, 2,5x no fim
function ritmoAtual() {
  const progresso = constrain(1 - tempoRestante / DURACAO_RONDA, 0, 1);
  return lerp(1, ACELERACAO_FINAL, progresso);
}

// Calcula o resultado, guarda o recorde e escolhe a sugestão de poupança
function terminarRonda() {
  const tipologia = TIPOLOGIAS[tipologiaEscolhida];
  const taxa = totalLigados > 0 ? totalDesligados / totalLigados : 0;

  // o tipo de equipamento que mais energia desperdiçou dá a dica
  let maiorDesperdicio = 'lamp';
  for (const tipo in desperdicio) {
    if (desperdicio[tipo] > desperdicio[maiorDesperdicio]) maiorDesperdicio = tipo;
  }

  const recordeAnterior = recordes[tipologia.id] || 0;
  const novoRecorde = pontos > recordeAnterior;
  if (novoRecorde) {
    recordes[tipologia.id] = pontos;
    try {
      localStorage.setItem('ecoBuilding_recordes', JSON.stringify(recordes));
    } catch (erro) {
      // sem acesso ao armazenamento do navegador: o recorde só fica até fechar a página
    }
  }

  let frase;
  if (taxa < 0.3 && totalDesligados < 3) frase = 'Poucos equipamentos desligados. ';
  else if (taxa >= 0.85) frase = 'Excelente reação! ';
  else if (taxa >= 0.6) frase = 'Bom ritmo, mas ficaram equipamentos a gastar. ';
  else frase = 'Muitos equipamentos ficaram ligados sem necessidade. ';

  resultado = {
    taxa: taxa,
    maiorDesperdicio: maiorDesperdicio,
    novoRecorde: novoRecorde,
    recorde: max(pontos, recordeAnterior),
    sugestao: frase + EQUIPAMENTOS[maiorDesperdicio].dica,
  };

  somFimRonda();
  estado = 'resultado';
}


// ---------------------------------------------------------------------
// 6. ECRÃ DO MENU
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

  // estado do microfone, com um ponto verde (pronto), vermelho (sem permissão) ou amarelo (por calibrar)
  stroke(COR.verde);
  strokeWeight(2);
  fill(10, 28, 22, 235);
  rect(LARGURA / 2 - 150, 426, 300, 28, 14);
  noStroke();

  let corEstado = COR.amarelo;
  if (microfone.estadoTexto === 'pronto' || microfone.estadoTexto === 'calibrado') corEstado = COR.verde;
  if (microfone.estadoTexto === 'sem permissão') corEstado = COR.vermelho;
  fill(corEstado);
  circle(LARGURA / 2 - 132, 440, 10);
  escrever('Microfone: ' + microfone.estadoTexto, LARGURA / 2 - 114, 445, 13, COR.branco, LEFT);

  // faixa com a instrução principal do jogo
  fill(10, 28, 22, 225);
  rect(LARGURA / 2 - 330, 464, 660, 26, 13);
  escrever('Clica nos equipamentos ligados ou faz uma palma para lançar o Eco-Pulso', LARGURA / 2, 482, 13, COR.branco);
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
    fill(TIPOS_DIVISAO[tipo].parede);
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


// ---------------------------------------------------------------------
// 7. ECRÃ DA RONDA
// ---------------------------------------------------------------------

function desenharRonda() {
  image(imgCeu, 0, 0, LARGURA, ALTURA);
  escurecerFundo(0.92, 0.85, 0.7, 546);

  edificio.desenhar();
  for (const pulso of pulsos) pulso.desenhar();
  desenharEfeitos();
  desenharPainel();
  if (!pausado) desenharMira();

  // contagem inicial por cima de tudo
  if (contagem > 0) {
    fill(10, 28, 22, 150);
    rect(0, 0, LARGURA, 512);
    escreverTitulo(String(ceil(contagem)), LARGURA / 2, 300, 140);
    escrever('Prepara-te!  Clica nos equipamentos ligados ou faz uma palma', LARGURA / 2, 350, 18, COR.branco);
    escrever('Desliga tudo o que tiver o alerta vermelho', LARGURA / 2, 378, 15, COR.verdeClaro);
  }

  // ecrã de pausa
  if (pausado) {
    fill(10, 28, 22, 210);
    rect(0, 0, LARGURA, 546);
    escreverTitulo('PAUSA', LARGURA / 2, 270, 70);
    desenharBotao(BOTAO_CONTINUAR, 'CONTINUAR', () => (pausado = false));
    desenharBotao(BOTAO_SAIR, 'SAIR PARA O MENU', () => (estado = 'menu'), true, 14);
  }
}

// Mira no lugar do cursor: amarela por cima de um equipamento ligado,
// verde quando o Eco-Pulso está pronto e vermelha enquanto recarrega
function desenharMira() {
  if (!ratoMexeu || mouseY > 512) return;

  const temAlvo = contagem <= 0 && equipamentoSobORato() !== null;
  let cor = COR.vermelho;
  if (temAlvo) cor = COR.amarelo;
  else if (microfone.armado || microfone.desligado || contagem > 0) cor = COR.verde;
  const diametro = temAlvo ? 36 : 30;

  noFill();
  // primeiro um contorno escuro e grosso, depois a cor por cima, para se ver em qualquer parede
  for (const [corTraco, espessura] of [[COR.fundoEscuro, 6], [cor, 3]]) {
    stroke(corTraco);
    strokeWeight(espessura);
    circle(mouseX, mouseY, diametro);
    line(mouseX - 22, mouseY, mouseX - 8, mouseY);
    line(mouseX + 8, mouseY, mouseX + 22, mouseY);
    line(mouseX, mouseY - 22, mouseX, mouseY - 8);
    line(mouseX, mouseY + 8, mouseX, mouseY + 22);
  }
  noStroke();
}

// Barra pequena com fundo transparente (tempo e consumo)
function desenharBarra(x, largura, fracao, cor) {
  fill(255, 255, 255, 30);
  rect(x, 38, largura, 10);
  fill(cor);
  rect(x, 38, largura * constrain(fracao, 0, 1), 10);
}

// Painel de cima (tempo, pontos, ligados, consumo) e faixa de baixo
function desenharPainel() {
  const ligados = equipamentos.filter((eq) => eq.ligado);
  const consumoAgora = ligados.reduce((soma, eq) => soma + eq.potencia, 0);
  const consumoMaximo = equipamentos.reduce((soma, eq) => soma + eq.potencia, 0);
  const fracaoConsumo = consumoAgora / consumoMaximo;
  const tempoCritico = tempoRestante <= 10 && contagem <= 0;

  fill(10, 28, 22, 245);
  rect(0, 0, LARGURA, 64);
  fill(COR.amarelo);
  rect(0, 62, LARGURA, 3);

  // tempo: nos últimos 10 segundos pisca entre laranja e vermelho
  let corTempo = COR.branco;
  if (tempoCritico) {
    corTempo = floor(millis() / 250) % 2 ? COR.laranja : COR.vermelho;
  }
  escrever('TEMPO', 24, 22, 12, COR.verdeClaro, LEFT);
  escrever(ceil(max(0, tempoRestante)) + 's', 24, 52, 34, corTempo, LEFT);
  desenharBarra(110, 120, tempoRestante / DURACAO_RONDA, tempoCritico ? COR.vermelho : COR.verde);

  escrever('PONTOS', 270, 22, 12, COR.verdeClaro, LEFT);
  escrever(String(pontos), 270, 52, 34, COR.amarelo, LEFT);

  escrever('LIGADOS', 430, 22, 12, COR.verdeClaro, LEFT);
  escrever(ligados.length + '/' + equipamentos.length, 430, 52, 34, ligados.length > 0 ? COR.laranja : COR.verde, LEFT);

  // consumo: a barra fica laranja acima de 30% e vermelha acima de 60%
  let corConsumo = COR.verde;
  if (fracaoConsumo > 0.6) corConsumo = COR.vermelho;
  else if (fracaoConsumo > 0.3) corConsumo = COR.laranja;
  escrever('CONSUMO SIMULADO', 600, 22, 12, COR.verdeClaro, LEFT);
  escrever(formatarKW(consumoAgora), 600, 52, 28, COR.branco, LEFT);
  desenharBarra(790, 210, fracaoConsumo, corConsumo);

  // faixa de baixo
  fill(10, 28, 22, 245);
  rect(0, 512, LARGURA, 34);

  // nível do som, estado do Eco-Pulso
  escrever('SOM', 32, 534, 13, COR.verdeClaro, LEFT);
  microfone.desenharBarra(80, 522, 420, 14);

  const pronto = microfone.armado && contagem <= 0;
  let corPulso = pronto ? COR.verde : COR.vermelho;
  let textoPulso = pronto ? 'ECO-PULSO PRONTO' : 'A RECARREGAR…';
  if (microfone.desligado) {
    corPulso = COR.cinza;
    textoPulso = 'MICROFONE DESLIGADO';
  }
  fill(corPulso);
  circle(530, 529, 10);
  escrever(textoPulso, 544, 534, 13, corPulso, LEFT);

  // nível atual, ritmo e botão de pausa
  escrever('NÍVEL ' + nivelAtual + '  ·  x' + ritmoAtual().toFixed(1).replace('.', ','), 760, 534, 13, COR.amarelo, LEFT);
  if (contagem <= 0 && !pausado) {
    desenharBotao(BOTAO_PAUSA, 'PAUSA', () => (pausado = true), true, 12);
  }
}


// ---------------------------------------------------------------------
// 8. ECRÃ DE RESULTADO
// ---------------------------------------------------------------------

function desenharResultado() {
  const tipologia = TIPOLOGIAS[tipologiaEscolhida];
  const centro = LARGURA / 2;

  desenharCaixa(212, 76, 600, 424, 'rgba(10, 28, 22, 0.94)', COR.amarelo);
  escreverTitulo('RONDA TERMINADA', centro, 124, 30);
  escrever(tipologia.id + ' · ' + tipologia.descricao, centro, 148, 14, COR.verdeClaro);

  escrever('PONTUAÇÃO', centro, 184, 13, COR.verdeClaro);
  escrever(String(pontos), centro, 232, 52, COR.amarelo);

  if (resultado.novoRecorde && pontos > 0) {
    escrever('NOVO RECORDE!', centro, 252, 14, COR.laranja);
  } else {
    escrever('Melhor em ' + tipologia.id + ': ' + resultado.recorde, centro, 252, 13, COR.cinza);
  }

  const percentagem = round(resultado.taxa * 100);
  const reducao = consumoLigado > 0 ? round((100 * consumoEvitado) / consumoLigado) : 0;
  escrever('Equipamentos desligados: ' + totalDesligados + ' de ' + totalLigados + ' (' + percentagem + '%)', centro, 286, 15, COR.branco);
  escrever('Consumo simulado evitado: ' + formatarKW(consumoEvitado) + '  (' + reducao + '% do que esteve ligado)', centro, 310, 15, COR.branco);
  escrever('Maior desperdício: ' + EQUIPAMENTOS[resultado.maiorDesperdicio].nome, centro, 334, 15, COR.branco);

  // sugestão de poupança, numa caixa com quebra de linha automática
  fill(45, 106, 79, 200);
  rect(252, 352, 520, 62);
  fill(COR.branco);
  textSize(14);
  textAlign(CENTER, CENTER);
  text('Sugestão: ' + resultado.sugestao, 262, 354, 500, 58);

  desenharBotao(BOTAO_JOGAR_NOVAMENTE, 'JOGAR NOVAMENTE', novaRonda);
  desenharBotao(BOTAO_MENU, 'MENU', () => (estado = 'menu'), true, 16);
}


// ---------------------------------------------------------------------
// 9. ECRÃ DE CALIBRAÇÃO DO MICROFONE
// ---------------------------------------------------------------------

function desenharCalibracao() {
  const tipologia = TIPOLOGIAS[tipologiaEscolhida];
  const centro = LARGURA / 2;

  desenharCaixa(212, 96, 600, 408, 'rgba(10, 28, 22, 0.94)', COR.amarelo);
  escreverTitulo('CALIBRAÇÃO DO MICROFONE', centro, 140, 26);
  escrever(tipologia.id + ' · ' + tipologia.descricao + ' · ' + tipologia.equipamentos + ' equipamentos', centro, 166, 14, COR.verdeClaro);

  if (microfone.fase === 'pedir') {
    // à espera que o jogador aceite o pedido do navegador
    escrever('Autoriza o microfone no navegador', centro, 250, 20, COR.branco);
    escrever('(aparece um pedido junto à barra de endereço)', centro, 278, 13, COR.verdeClaro);
  } else if (microfone.fase === 'medir') {
    // 2 segundos de silêncio, com contagem e barra de progresso
    const segundosQueFaltam = max(1, ceil((CALIBRACAO_MS - microfone.tempoMedicao) / 1000));
    escrever('Fica em silêncio…', centro, 222, 22, COR.amarelo);
    escrever('A medir o ruído ambiente', centro, 248, 13, COR.verdeClaro);
    escrever(String(segundosQueFaltam), centro, 330, 64, COR.branco);

    fill(255, 255, 255, 30);
    rect(272, 352, 480, 12);
    fill(COR.verde);
    rect(272, 352, 480 * min(1, microfone.tempoMedicao / CALIBRACAO_MS), 12);
    microfone.desenharBarra(272, 388, 480, 16);
  } else if (microfone.fase === 'pronta') {
    // calibração feita: o jogador pode testar uma palma e ajustar a sensibilidade
    escrever('Calibração concluída', centro, 206, 20, COR.verde);
    escrever('Faz uma palma para testar', centro, 230, 15, COR.branco);

    microfone.desenharBarra(272, 246, 480, 22);
    if (microfone.brilhoTeste > 0) {
      fill(82, 183, 136, 255 * microfone.brilhoTeste);
      rect(272, 246, 480, 22);
    }
    escrever('amarelo = dispara', 272, 290, 12, COR.amarelo, LEFT);
    escrever('verde = rearma', 752, 290, 12, COR.verdeClaro, RIGHT);

    const valores = 'Ruído: ' + formatarNumero(microfone.ruidoBase) +
      '  ·  Dispara: ' + formatarNumero(microfone.limiteDisparo) +
      '  ·  Rearma: ' + formatarNumero(microfone.limiteRearme);
    escrever(valores, centro, 314, 13, COR.branco);

    escrever('Sensibilidade: ' + microfone.sensibilidade + ' / 16', 600, 345, 15, COR.verdeClaro, RIGHT);
    desenharBotao(BOTAO_MENOS, '−', () => microfone.ajustarSensibilidade(-1), true, 18);
    desenharBotao(BOTAO_MAIS, '+', () => microfone.ajustarSensibilidade(1), true, 18);

    if (microfone.palmasDetetadas > 0) {
      escrever('Palma detetada ✓  (' + microfone.palmasDetetadas + ')', centro, 382, 13, COR.verde);
    } else {
      escrever('Ainda sem palmas', centro, 382, 13, COR.cinza);
    }

    desenharBotao(BOTAO_COMECAR_RONDA, 'COMEÇAR RONDA', novaRonda);
    desenharBotao(BOTAO_RECALIBRAR, 'RECALIBRAR', () => microfone.comecarMedicao(), true, 14);
  } else {
    // o jogador recusou o microfone: pode tentar outra vez ou jogar só com o rato
    escrever('Microfone sem permissão', centro, 236, 24, COR.vermelho);
    escrever('Sem microfone não é possível lançar o Eco-Pulso.', centro, 272, 15, COR.branco);
    escrever('Permite o acesso (ícone junto ao endereço) e tenta de novo,', centro, 296, 15, COR.branco);
    escrever('ou joga só com o rato, clicando nos equipamentos.', centro, 320, 15, COR.branco);

    desenharBotao(BOTAO_COMECAR_RONDA, 'TENTAR DE NOVO', () => microfone.pedirAcesso());
    desenharBotao(BOTAO_RECALIBRAR, 'SÓ COM O RATO', () => {
      microfone.desligado = true;
      novaRonda();
    }, true, 14);
  }

  if (microfone.fase !== 'medir') {
    desenharBotao(BOTAO_VOLTAR, 'VOLTAR', () => (estado = 'menu'), true, 14);
  }
}


// ---------------------------------------------------------------------
// 10. SONS E EFEITOS VISUAIS
// ---------------------------------------------------------------------

// Toca uma sequência de notas [frequência em Hz, atraso em ms] com um oscilador do p5.sound
function tocarNotas(notas) {
  if (!oscilador) {
    oscilador = new p5.Oscillator('triangle');
    envelope = new p5.Envelope();
    envelope.setADSR(0.005, 0.12, 0, 0.05); // ataque rápido, som curto
    envelope.setRange(0.22, 0);              // volume baixo
    oscilador.amp(envelope);
    oscilador.start();
  }

  // enquanto o som toca, o microfone é ignorado (senão o próprio jogo lançava pulsos)
  const duracao = notas[notas.length - 1][1] + 450;
  microfone.bloquearDurante(duracao);

  for (const [frequencia, atraso] of notas) {
    setTimeout(() => {
      oscilador.freq(frequencia);
      envelope.play();
    }, atraso);
  }
}

// Acerto: duas notas a subir; cada acerto seguido do mesmo pulso soa um pouco mais agudo
function somAcerto(acertoNoPulso) {
  const subida = pow(1.12, acertoNoPulso);
  tocarNotas([[660 * subida, 0], [990 * subida, 70]]);
}

// Fim da ronda: quatro notas a descer
function somFimRonda() {
  tocarNotas([[784, 0], [659, 150], [523, 300], [392, 450]]);
}

// Subida de nível: três notas a subir
function somNivel() {
  tocarNotas([[523, 0], [659, 90], [784, 180]]);
}

// Cada efeito dura 1 segundo (o aviso de nível dura 1,8 s)
function atualizarEfeitos(dt) {
  for (const efeito of efeitos) {
    efeito.tempo += dt;
  }
  efeitos = efeitos.filter((efeito) => efeito.tempo < (efeito.tipo === 'nivel' ? 1.8 : 1));
}

function desenharEfeitos() {
  for (const efeito of efeitos) {
    const { x, y, tempo } = efeito;

    if (efeito.tipo === 'faisca' && tempo < 0.5) {
      // muda de quadro a cada 0,12 s
      const quadro = min(3, floor(tempo / 0.12));
      image(framesFaisca[quadro], x - 48, y - 48, 96, 96);
    }

    if (efeito.tipo === 'texto') {
      // "+10" que sobe e desaparece
      escreverComContorno('+' + PONTOS_POR_EQUIPAMENTO, x, y - tempo * 40, 26, color(255, 213, 74, 255 * (1 - tempo)));
    }

    if (efeito.tipo === 'anel') {
      // anel vermelho que cresce quando um equipamento se liga
      noFill();
      stroke(214, 69, 65, 255 * (1 - tempo));
      strokeWeight(4);
      circle(x, y, 40 + tempo * 80);
      noStroke();
    }

    if (efeito.tipo === 'nivel') {
      // aviso de subida de nível, que desaparece nos últimos 0,6 s
      const opacidade = 255 * constrain((1.8 - tempo) / 0.6, 0, 1);
      fill(10, 28, 22, opacidade * 0.9);
      stroke(255, 213, 74, opacidade);
      strokeWeight(3);
      rect(LARGURA / 2 - 200, 250, 400, 64);
      noStroke();
      escrever('NÍVEL ' + nivelAtual, LARGURA / 2, 280, 26, color(255, 213, 74, opacidade));
      escrever('Os equipamentos ligam-se mais depressa!', LARGURA / 2, 302, 13, color(245, 245, 240, opacidade));
    }
  }
}