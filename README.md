# Eco Building

Jogo em p5.js sobre eficiência energética num edifício.
Sistemas Multimédia | ECGM | 2026/2027 | Paulo Monteiro (32441)

O jogador escolhe a tipologia da casa (T0 a T4) e tem de desligar os equipamentos que estão a gastar energia sem necessidade antes de o tempo acabar.

## Controlos
- **Rato:** apontar e clicar nos equipamentos ligados.
- **Microfone:** um som curto (ex.: palma) lança o Eco-Pulso a partir do cursor.

## Como executar
O jogo carrega imagens, por isso tem de ser aberto através de um servidor local (por exemplo, a extensão Live Server do VS Code ou o XAMPP), e não com duplo clique no `index.html`.

## Estrutura
```
index.html              página que carrega o p5 e os scripts
ecoBuilding.js          ficheiro principal: configuração, estados, ronda e ecrãs
classes/Equipamento.js  classe Equipamento: ligado/desligado e desenho
classes/Edificio.js     classe Edificio: divisões, mobília e sorteio dos equipamentos
classes/Microfone.js    classe Microfone: autorização, calibração e histerese
classes/EcoPulso.js     classe EcoPulso: pulso lançado pelo som e colisões
p5/                     p5.js e p5.sound.js
assets/                 imagens em pixel art
```

## Progresso
- [x] Etapa 1: Estrutura inicial e menu com escolha da tipologia (T0 a T4)
- [x] Etapa 2: Classes Edificio e Equipamento; edifício gerado por tipologia, equipamentos em locais lógicos e ronda de 60 s com o rato
- [x] Etapa 3: Classes Microfone e EcoPulso; permissão, calibração do ruído, histerese e Eco-Pulso com colisões
- [x] Etapa 4: Áudio sintetizado com p5.sound e efeitos visuais de feedback
- [ ] Etapa 5: Dificuldade crescente, pausa e ecrã de resultado com sugestão de poupança