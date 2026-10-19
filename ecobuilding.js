// Eco Building — Eficiência energética num edifício | Sistemas Multimédia | ECGM | 2026/2027 | Paulo Monteiro 32441
// Controlo: rato (escolher a tipologia e clicar nos equipamentos ligados).

// ===== 1. CONFIGURAÇÃO =====
const W = 1024, H = 576, PASTA = 'assets/';
const C = { verdeEsc: '#2d6a4f', verde: '#52b788', verdeClaro: '#b7e4c7', escuro: '#1e242c', branco: '#f5f5f0', laranja: '#d98a3d',
  laranjaEsc: '#9a5a1a', amarelo: '#ffd54a', noite: '#0a1c16', cinza: '#8c94a0', vermelho: '#d64541' };

// Divisões: cores, peso no sorteio, equipamentos possíveis {tipo: peso} e mobília [sprite, lado, margem]
const DIV = {
  sala:    { nome: 'SALA', parede: '#f6e8cd', chao: '#a9774a', peso: 1.2, eq: { tv: 3, lamp: 3, ac: 2, computer: 1 }, mob: [['sofa', 'esq', 16], ['planta', 'dir', 14]] },
  estudio: { nome: 'ESTÚDIO', parede: '#f6e8cd', chao: '#a9774a', peso: 1.2, eq: { tv: 2, lamp: 3, ac: 2, computer: 2 }, mob: [['sofa', 'esq', 16], ['cama', 'dir', 16]] },
  quarto:  { nome: 'QUARTO', parede: '#cfe3f5', chao: '#7f95b5', peso: 1, eq: { lamp: 3, computer: 3, ac: 2, tv: 1 }, mob: [['cama', 'esq', 14], ['roupeiro', 'dir', 14]] },
  cozinha: { nome: 'COZINHA', parede: '#dfe5ea', chao: '#9aa3ad', peso: 0.8, eq: { lamp: 3, ac: 1 }, mob: [['bancada', 'esq', 10], ['frigorifico', 'dir', 12]] },
  wc:      { nome: 'WC', parede: '#d5f0e0', chao: '#7fb59a', peso: 0.4, eq: { lamp: 1 }, mob: [['sanita', 'esq', 14], ['lavatorio', 'dir', 12]] },
  hall:    { nome: 'HALL', parede: '#efe3d1', chao: '#a88c6a', peso: 0.4, eq: { lamp: 1 }, mob: [['planta', 'esq', 16], ['mesa', 'dir', 16]] },
};
// Tipologias: plantas numa grelha 12 x 8 [código, tipo, x, y, largura, altura]
const TIPOLOGIAS = [
  { id: 'T0', desc: 'Estúdio', n: 4, div: [['S/Q', 'estudio', 0, 0, 8, 8], ['C', 'cozinha', 8, 0, 4, 4], ['WC', 'wc', 8, 4, 4, 4]] },
  { id: 'T1', desc: '1 quarto', n: 6, div: [['Q', 'quarto', 0, 0, 5, 8], ['S', 'sala', 5, 0, 7, 5], ['C', 'cozinha', 5, 5, 4, 3], ['WC', 'wc', 9, 5, 3, 3]] },
  { id: 'T2', desc: '2 quartos', n: 8, div: [['Q1', 'quarto', 0, 0, 4, 4], ['Q2', 'quarto', 0, 4, 4, 4], ['S', 'sala', 4, 0, 5, 5], ['C', 'cozinha', 9, 0, 3, 4], ['WC', 'wc', 9, 4, 3, 4], ['H', 'hall', 4, 5, 5, 3]] },
  { id: 'T3', desc: '3 quartos', n: 10, div: [['Q1', 'quarto', 0, 0, 3, 4], ['Q2', 'quarto', 3, 0, 3, 4], ['Q3', 'quarto', 6, 0, 3, 4], ['WC', 'wc', 9, 0, 3, 4], ['S', 'sala', 0, 4, 5, 4], ['C', 'cozinha', 5, 4, 4, 4], ['WC', 'wc', 9, 4, 3, 4]] },
  { id: 'T4', desc: '4 quartos', n: 12, div: [['Q1', 'quarto', 0, 0, 3, 4], ['Q2', 'quarto', 3, 0, 3, 4], ['Q3', 'quarto', 6, 0, 3, 4], ['Q4', 'quarto', 9, 0, 3, 4], ['S', 'sala', 0, 4, 5, 4], ['C', 'cozinha', 5, 4, 3, 4], ['WC', 'wc', 8, 4, 2, 4], ['WC', 'wc', 10, 4, 2, 4]] },
].map((t) => ({ ...t, div: t.div.map(([cod, tipo, x, y, w, h]) => ({ cod, tipo, x, y, w, h })) }));

// Layout
const R = (x, y, w, h) => ({ x, y, w, h });
const CARD = { w: 150, h: 190, gap: 14, y: 132 };
const BT = { comecar: R(382, 352, 260, 56),
  voltar: R(412, 330, 200, 48),
};

// ===== 2. ESTADO =====
let estado = 'menu', sel = 1, tip = null, cliques = [], img = { disp: {}, mob: {} };

// ===== 3. p5 =====
function preload() {
  const L = (p) => loadImage(PASTA + p + '.png');
  img.ceu = L('backgrounds/bg_menu_sky'); img.folha = L('ui/icon_leaf');
  img.edif = ['apartamento', 'moradia', 'escritorio', 'escola'].map((n) => L('buildings/' + n));
}

function setup() {
  createCanvas(W, H).style('display', 'block');
  pixelDensity(1); noSmooth(); textFont('Courier New'); textStyle(BOLD);
}

function draw() {
  cliques = [];
  if (estado === 'jogo') ecraJogo();
  else {
    cenario();
    if (estado === 'menu') ecraMenu();
  }
  txt('Energy Efficiency in a Building', 16, H - 14, 14, C.branco, LEFT);
  txt('Paulo Monteiro | 32441 | ECGM', W - 16, H - 14, 14, C.branco, RIGHT);
  cursor(cliques.some((c) => dentro(c.r)) ? HAND : ARROW);
}

function mousePressed() {
  const c = cliques.find((c) => dentro(c.r));
  if (c) return c.acao();
}

// ===== 4. UTILITÁRIOS E DESENHO BASE =====
const dentro = (r) => mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h;

function txt(s, x, y, tam, cor, al = CENTER, contorno = false) {
  textSize(tam); textAlign(al, BASELINE);
  if (contorno) { stroke(C.escuro); strokeWeight(max(3, tam / 6)); } else noStroke();
  fill(cor); text(s, x, y); noStroke();
}
function titulo(s, x, y, tam) { const o = max(2, round(tam / 10)); txt(s, x + o, y + o, tam, C.verdeEsc); txt(s, x, y, tam, C.branco); }
function caixa(x, y, w, h, cor, borda, peso = 4) {
  noStroke(); fill(0, 0, 0, 120); rect(x + 6, y + 8, w, h);
  stroke(borda); strokeWeight(peso); fill(cor); rect(x, y, w, h); noStroke();
}
// Botão: desenha e regista a área clicável deste frame
function botao(r, label, acao, sec = false, tam = 22) {
  const sobre = dentro(r), off = sobre && mouseIsPressed ? 4 : 0;
  caixa(r.x, r.y + off, r.w, r.h, sec ? (sobre ? '#ffffff' : '#dfe8e2') : (sobre ? '#ffe27d' : C.amarelo), C.noite);
  fill(255, 255, 255, 120); rect(r.x + 5, r.y + off + 5, r.w - 10, 4);
  txt(label, r.x + r.w / 2, r.y + off + r.h / 2 + tam * 0.35, tam, C.escuro);
  cliques.push({ r, acao });
}
// Película escura em degradê para dar contraste à interface
function pelicula(a0, a1, a2, h) {
  const g = drawingContext.createLinearGradient(0, 0, 0, h);
  [a0, a1, a2].forEach((a, i) => g.addColorStop(i / 2, 'rgba(10,28,22,' + a + ')'));
  drawingContext.fillStyle = g; drawingContext.fillRect(0, 0, W, h);
}
function cenario() {
  image(img.ceu, 0, 0, W, H);
  img.edif.forEach((e, i) => image(e, i * 245, 232, 288, 288));
  pelicula(0.9, 0.72, 0.35, 512);
}

// ===== 8. LÓGICA DA RONDA =====
function iniciar() {
  tip = TIPOLOGIAS[sel];
  estado = 'jogo';
}

// ===== 9. ECRÃS: MENU, CALIBRAÇÃO E RESULTADO =====
function ecraMenu() {
  image(img.folha, W / 2 - 190, 14, 48, 48);
  titulo('ECO BUILDING', W / 2 + 25, 50, 40);
  txt('Eficiência energética num edifício', W / 2, 76, 14, C.verdeClaro);
  txt('ESCOLHE A TIPOLOGIA', W / 2, 118, 14, C.verdeClaro);
  TIPOLOGIAS.forEach(cartao);
  botao(BT.comecar, 'COMEÇAR', iniciar, false, 24);
  fill(10, 28, 22, 225); rect(W / 2 - 330, 464, 660, 26, 13);
  txt('Clica nos equipamentos ligados para os desligar antes que o tempo acabe', W / 2, 482, 13, C.branco);
}

// Cartão de uma tipologia com a planta desenhada
function cartao(t, i) {
  const r = R((W - 5 * CARD.w - 4 * CARD.gap) / 2 + i * (CARD.w + CARD.gap), CARD.y, CARD.w, CARD.h), ativo = i === sel, sobre = dentro(r);
  cliques.push({ r, acao: () => (sel = i) });
  push(); translate(r.x, r.y - (ativo ? 8 : sobre ? 4 : 0));
  caixa(0, 0, r.w, r.h, ativo ? '#ffffff' : '#dfe8e2', ativo ? C.amarelo : C.noite, ativo ? 5 : 3);
  fill(ativo ? C.laranja : C.verdeEsc); rect(3, 3, r.w - 6, 30);
  txt(t.id, r.w / 2, 27, 24, ativo ? C.escuro : C.branco);
  for (const d of t.div) {
    stroke(C.escuro); strokeWeight(2); fill(DIV[d.tipo].parede); rect(15 + d.x * 10, 44 + d.y * 10, d.w * 10, d.h * 10);
    txt(d.cod, 15 + (d.x + d.w / 2) * 10, 47 + (d.y + d.h / 2) * 10, 9, C.escuro);
  }
  txt(t.desc, r.w / 2, 148, 14, C.escuro);
  txt(t.div.length + ' divisões · ' + t.div.filter((d) => d.tipo === 'wc').length + ' WC', r.w / 2, 165, 11, C.escuro);
  txt(t.n + ' equipamentos', r.w / 2, 181, 11, C.laranjaEsc);
  if (!ativo && !sobre) { fill(10, 28, 22, 45); rect(0, 0, r.w, r.h); }
  pop();
}

// ===== 10. ECRÃ DE JOGO (provisório: o edifício entra na próxima etapa) =====
function ecraJogo() {
  cenario();
  caixa(262, 150, 500, 260, 'rgba(10,28,22,0.94)', C.amarelo);
  titulo(tip.id + ' · ' + tip.desc, W / 2, 210, 30);
  txt(tip.div.length + ' divisões · ' + tip.n + ' equipamentos', W / 2, 246, 15, C.verdeClaro);
  txt('Ronda de jogo em desenvolvimento', W / 2, 290, 15, C.branco);
  botao(BT.voltar, 'VOLTAR', () => (estado = 'menu'), true, 16);
}