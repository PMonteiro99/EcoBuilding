# Eco Building

Jogo em p5.js sobre eficiência energética num edifício.
Sistemas Multimédia | ECGM | 2026/2027 | Paulo Monteiro (32441)

O jogador escolhe a tipologia da casa (T0 a T4) e tem de desligar os equipamentos que estão a gastar energia sem necessidade antes de o tempo acabar.

## Controlos
- **Rato:** escolher a tipologia, começar e clicar nos equipamentos ligados para os desligar.

## Como executar
O jogo carrega imagens, por isso tem de ser aberto através de um servidor local (por exemplo, a extensão Live Server do VS Code ou o XAMPP), e não com duplo clique no `index.html`.

## Estrutura
```
index.html        página que carrega o p5 e os scripts
classes/Equipamento.jsclasse Equipamento: estado ligado/desligado e desenho
classes/Edificio.jsclasse Edificio: divisões, mobília e sorteio lógico dos equipamentos
ecoBuilding.js    ficheiro principal: dados, estados, ronda, sons e ecrãs
p5/               p5.js e p5.sound.js
assets/           imagens em pixel art
```

## Progresso
- [x] Etapa 1: Estrutura inicial e menu com escolha da tipologia (T0 a T4)
- [x] Etapa 2: Classes essenciais (Edificio, Equipamento); edifício por tipologia, equipamentos em locais lógicos e ronda de 60 s com o rato
- [ ] Etapa 3: Microfone: permissão, calibração do ruído, histerese e Eco-Pulso com colisões
- [ ] Etapa 4: Áudio sintetizado com p5.sound e efeitos visuais de feedback
- [ ] Etapa 5: Dificuldade crescente, pausa e ecrã de resultado com sugestão de poupança