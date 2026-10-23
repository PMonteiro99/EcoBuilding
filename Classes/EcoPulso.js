// O Eco-Pulso: um círculo que nasce no cursor quando o microfone deteta um som curto.
// Cresce durante meio segundo e desliga os equipamentos ligados em que toca.
// Quanto mais forte o som, maior o círculo.
class EcoPulso {
  constructor(x, y, nivelSom) {
    this.x = x;
    this.y = y;
    this.tempo = 0;
    this.raio = 0;
    this.acertos = 0;

    // um som no limite de disparo dá o raio mínimo; 0,4 acima disso dá o raio máximo
    const forca = constrain((nivelSom - microfone.limiteDisparo) / 0.4, 0, 1);
    this.raioMaximo = lerp(PULSO_RAIO_MINIMO, PULSO_RAIO_MAXIMO, forca);
  }

  get ativo() {
    return this.tempo < PULSO_DURACAO;
  }

  // Faz crescer o pulso e verifica a colisão círculo com círculo com cada equipamento ligado.
  // aoAcertar(equipamento, numeroDoAcerto) é chamada para cada equipamento atingido.
  atualizar(dt, equipamentos, aoAcertar) {
    this.tempo += dt;
    const progresso = min(1, this.tempo / PULSO_DURACAO);
    this.raio = this.raioMaximo * (1 - pow(1 - progresso, 3)); // cresce depressa no início e abranda no fim

    for (const eq of equipamentos) {
      const distancia = dist(this.x, this.y, eq.x, eq.y);
      if (eq.ligado && distancia <= this.raio + RAIO_CLIQUE) {
        aoAcertar(eq, this.acertos);
        this.acertos++;
      }
    }
  }

  desenhar() {
    const progresso = this.tempo / PULSO_DURACAO;
    const opacidade = 255 * (1 - progresso * 0.8);
    const diametro = this.raio * 2;

    noStroke();
    fill(82, 183, 136, 55 * (1 - progresso));
    circle(this.x, this.y, diametro);

    noFill();
    stroke(45, 106, 79, opacidade);
    strokeWeight(8);
    circle(this.x, this.y, diametro);
    stroke(183, 228, 199, opacidade);
    strokeWeight(3);
    circle(this.x, this.y, diametro);
    noStroke();
  }
}