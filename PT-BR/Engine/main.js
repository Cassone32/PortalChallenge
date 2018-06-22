// RequestAnimFrame: Uma API do navegador para obter uma animação suave.
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

var canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d');

var width = 422,
  height = 552;

canvas.width = width;
canvas.height = height;

//Variáveis do jogo
var platforms = [],
  image = document.getElementById("sprite"),
  player, platformCount = 10,
  position = 0,
  gravity = 0.2,
  animloop,
  flag = 0,
  menuloop, broken = 0,
  dir, score = 0, firstRun = true;

//Base dos objetos
var Base = function() {
  this.height = 5;
  this.width = width;

  //Cortes na imagem de Sprite
  this.cx = 0;
  this.cy = 614;
  this.cwidth = 100;
  this.cheight = 5;

  this.moved = 0;

  this.x = 0;
  this.y = height - this.height;

  this.draw = function() {
    try {
      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };
};

var base = new Base();

//Objeto Jogador
var Player = function() {
  this.vy = 11;
  this.vx = 0;

  this.isMovingLeft = false;
  this.isMovingRight = false;
  this.isDead = false;

  this.width = 55;
  this.height = 40;

  //Corte na imagem de Sprite
  this.cx = 0;
  this.cy = 0;
  this.cwidth = 110;
  this.cheight = 80;

  this.dir = "left";

  this.x = width / 2 - this.width / 2;
  this.y = height;

  //Função para desenhar
  this.draw = function() {
    try {
      if (this.dir == "right") this.cy = 121;
      else if (this.dir == "left") this.cy = 201;
      else if (this.dir == "right_land") this.cy = 289;
      else if (this.dir == "left_land") this.cy = 371;

      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };

  this.jump = function() {
    this.vy = -8;
  };

  this.jumpHigh = function() {
    this.vy = -16;
  };

};

player = new Player();

//Classe da Plataforma

function Platform() {
  this.width = 70;
  this.height = 17;

  this.x = Math.random() * (width - this.width);
  this.y = position;

  position += (height / platformCount);

  this.flag = 0;
  this.state = 0;

  //Corte na imagem de Sprite
  this.cx = 0;
  this.cy = 0;
  this.cwidth = 105;
  this.cheight = 31;

  //Função para desenhar
  this.draw = function() {
    try {

      if (this.type == 1) this.cy = 0;
      else if (this.type == 2) this.cy = 61;
      else if (this.type == 3 && this.flag === 0) this.cy = 31;
      else if (this.type == 3 && this.flag == 1) this.cy = 1000;
      else if (this.type == 4 && this.state === 0) this.cy = 90;
      else if (this.type == 4 && this.state == 1) this.cy = 1000;

      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };

  //Tipos de plataformas
  //1: Plataforma Fixa.
  //2: Plataforma com Movimento.
  //3: Plataforma quebrável (Personagem cairá)
  //4: Plataforma "Apagável"
  //Definindo a probabilidade de surgir as plataformas de acordo com a pontuação que o jogador consegue chegar
  if (score >= 5000) this.types = [2, 3, 3, 3, 4, 4, 4, 4];
  else if (score >= 2000 && score < 5000) this.types = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
  else if (score >= 1000 && score < 2000) this.types = [2, 2, 2, 3, 3, 3, 3, 3];
  else if (score >= 500 && score < 1000) this.types = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
  else if (score >= 100 && score < 500) this.types = [1, 1, 1, 1, 2, 2];
  else this.types = [1];

  this.type = this.types[Math.floor(Math.random() * this.types.length)];

  //Verificação para impedir que duas plataformas quebráveis apareçam consecutivamente, impedindo o jogador de alcançar outra plataforma
  if (this.type == 3 && broken < 1) {
    broken++;
  } else if (this.type == 3 && broken >= 1) {
    this.type = 1;
    broken = 0;
  }

  this.moved = 0;
  this.vx = 1;
}

for (var i = 0; i < platformCount; i++) {
  platforms.push(new Platform());
}

//Objeto de plataforma quebrável
var Platform_broken_substitute = function() {
  this.height = 30;
  this.width = 70;

  this.x = 0;
  this.y = 0;

  //Corte na imagem do Sprite
  this.cx = 0;
  this.cy = 554;
  this.cwidth = 105;
  this.cheight = 60;

  this.appearance = false;

  this.draw = function() {
    try {
      if (this.appearance === true) ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
      else return;
    } catch (e) {}
  };
};

var platform_broken_substitute = new Platform_broken_substitute();

//Classe do objeto Mola
var spring = function() {
  this.x = 0;
  this.y = 0;

  this.width = 26;
  this.height = 30;

  //Corte na imagem do Sprite
  this.cx = 0;
  this.cy = 0;
  this.cwidth = 45;
  this.cheight = 53;

  this.state = 0;

  this.draw = function() {
    try {
      if (this.state === 0) this.cy = 445;
      else if (this.state == 1) this.cy = 501;

      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };
};

var Spring = new spring();

function init() {
  //Variáveis para o jogo
  //var somPartida = new Audio("Sound/DB.m4a");
  var dir = "left",
    jumpCount = 0;
  
  //somPartida.play();
  firstRun = false;

  //Função para limpar a tela após cada quadro atualizado

  function paintCanvas() {
    ctx.clearRect(0, 0, width, height);
  }

  //Calculos e funções relativas ao Jogador

  function playerCalc() {
    if (dir == "left") {
      player.dir = "left";
      if (player.vy < -7 && player.vy > -15) player.dir = "left_land";
    } else if (dir == "right") {
      player.dir = "right";
      if (player.vy < -7 && player.vy > -15) player.dir = "right_land";
    }

    //Adicionando controle do personagem através das setas
    document.onkeydown = function(e) {
      var key = e.keyCode;
      
      if (key == 37) {
        dir = "left";
        player.isMovingLeft = true;
      } else if (key == 39) {
        dir = "right";
        player.isMovingRight = true;
      }
      
      if(key == 32) {
        if(firstRun === true)
          init();
        else 
          reset();
      }
    };

    document.onkeyup = function(e) {
      var key = e.keyCode;
    
      if (key == 37) {
        dir = "left";
        player.isMovingLeft = false;
      } else if (key == 39) {
        dir = "right";
        player.isMovingRight = false;
      }
    };

    //Aceleração produzida quando o usuário segurar as setas
    if (player.isMovingLeft === true) {
      player.x += player.vx;
      player.vx -= 0.15;
    } else {
      player.x += player.vx;
      if (player.vx < 0) player.vx += 0.1;
    }

    if (player.isMovingRight === true) {
      player.x += player.vx;
      player.vx += 0.15;
    } else {
      player.x += player.vx;
      if (player.vx > 0) player.vx -= 0.1;
    }

    // Limite de aceleração (Velocidade)
    if(player.vx > 8)
      player.vx = 8;
    else if(player.vx < -8)
      player.vx = -8;

    //console.log(player.vx);
    
    //Fazer o personagem pular quando atingir uma plataforma
    if ((player.y + player.height) > base.y && base.y < height) player.jump();

    //Fim de jogo se o personagem atingir o fundo do cenário (Errar a plataforma e cair)
    if (base.y > height && (player.y + player.height) > height && player.isDead != "lol") player.isDead = true;

    //Se o personagem ir em direção a parede será "teletransportado" para o outro lado
    if (player.x > width) player.x = 0 - player.width;
    else if (player.x < 0 - player.width) player.x = width;

    //Movimento do jogador afetado pela gravidade
    if (player.y >= (height / 2) - (player.height / 2)) {
      player.y += player.vy;
      player.vy += gravity;
    }

    //Quando o jogador atinge determinada altura, move as plataformas para criar a ilusão de rolagem (A impressão de que o personagem está subindo), e recria as plataformas que estão fora do visor.
    else {
      platforms.forEach(function(p, i) {

        if (player.vy < 0) {
          p.y -= player.vy;
        }

        if (p.y > height) {
          platforms[i] = new Platform();
          platforms[i].y = p.y - height;
        }

      });

      base.y -= player.vy;
      player.vy += gravity;

      if (player.vy >= 0) {
        player.y += player.vy;
        player.vy += gravity;
      }

      score++;
    }

    //Faz o jogador pular quando colidir com uma plataforma
    collides();

    if (player.isDead === true) gameOver();
  }

  //Algoritmo para a Mola

  function springCalc() {
    var s = Spring;
    var p = platforms[0];

    if (p.type == 1 || p.type == 2) {
      s.x = p.x + p.width / 2 - s.width / 2;
      s.y = p.y - p.height - 10;

      if (s.y > height / 1.1) s.state = 0;

      s.draw();
    } else {
      s.x = 0 - s.width;
      s.y = 0 - s.height;
    }
  }

  //Movimento horizontal da plataforma (e a queda)

  function platformCalc() {
    var subs = platform_broken_substitute;

    platforms.forEach(function(p, i) {
      if (p.type == 2) {
        if (p.x < 0 || p.x + p.width > width) p.vx *= -1;

        p.x += p.vx;
      }

      if (p.flag == 1 && subs.appearance === false && jumpCount === 0) {
        subs.x = p.x;
        subs.y = p.y;
        subs.appearance = true;

        jumpCount++;
      }

      p.draw();
    });

    if (subs.appearance === true) {
      subs.draw();
      subs.y += 8;
    }

    if (subs.y > height) subs.appearance = false;
  }

  //Função de colisão
  function collides() {
    //Plataformas
    platforms.forEach(function(p, i) {
      if (player.vy > 0 && p.state === 0 && (player.x + 15 < p.x + p.width) && (player.x + player.width - 15 > p.x) && (player.y + player.height > p.y) && (player.y + player.height < p.y + p.height)) {

        if (p.type == 3 && p.flag === 0) {
          p.flag = 1;
          jumpCount = 0;
          return;
        } else if (p.type == 4 && p.state === 0) {
          player.jump();
          p.state = 1;
        } else if (p.flag == 1) return;
        else {
          player.jump();
        }
      }
    });

    //Molas
    var s = Spring;
    if (player.vy > 0 && (s.state === 0) && (player.x + 15 < s.x + s.width) && (player.x + player.width - 15 > s.x) && (player.y + player.height > s.y) && (player.y + player.height < s.y + s.height)) {
      s.state = 1;
      player.jumpHigh();
    }

  }

  //Função de atualização de pontuação
  function updateScore() {
    var scoreText = document.getElementById("score");
    scoreText.innerHTML = "Pontos: " + score;
  }

  //Função de fim de jogo
  function gameOver() {
    platforms.forEach(function(p, i) {
      p.y -= 12;
    });

    if(player.y > height/2 && flag === 0) {
      player.y -= 8;
      player.vy = 0;
    } 
    else if(player.y < height / 2) flag = 1;
    else if(player.y + player.height > height) {
      showGoMenu();
      hideScore();
      player.isDead = "lol";

      var tweet = document.getElementById("tweetBtn");
      tweet.href=' ' +score+ '';
    
      var facebook = document.getElementById("fbBtn");
      facebook.href='' +score+ '';

    }
  }

  //Função que atualiza tudo (Literalmente :v)

  function update() {
    paintCanvas();
    platformCalc();

    springCalc();

    playerCalc();
    player.draw();

    base.draw();

    updateScore();
  }

  menuLoop = function(){return;};
  animloop = function() {
    update();
    requestAnimFrame(animloop);
  };

  animloop();

  hideMenu();
  showScore();
}

//Função de resetar o jogo
function reset() {
  hideGoMenu();
  showScore();
  player.isDead = false;
  
  flag = 0;
  position = 0;
  score = 0;

  base = new Base();
  player = new Player();
  Spring = new spring();
  platform_broken_substitute = new Platform_broken_substitute();

  platforms = [];
  for (var i = 0; i < platformCount; i++) {
    platforms.push(new Platform());
  }
}

//Esconde o menu inicial
function hideMenu() {
  var menu = document.getElementById("mainMenu");
  menu.style.zIndex = -1;
}

//Exibe o menu de fim de jogo
function showGoMenu() {
  var menu = document.getElementById("gameOverMenu");
  menu.style.zIndex = 1;
  menu.style.visibility = "visible";

  var scoreText = document.getElementById("go_score");
  scoreText.innerHTML = "Parabens! Conseguiu " + score + " pontos";
}

//Esconde o menu de fim de jogo
function hideGoMenu() {
  var menu = document.getElementById("gameOverMenu");
  menu.style.zIndex = -1;
  menu.style.visibility = "hidden";
}

//Mostra a pontuação
function showScore() {
  var menu = document.getElementById("scoreBoard");
  menu.style.zIndex = 1;
}

//Esconde a pontuação
function hideScore() {
  var menu = document.getElementById("scoreBoard");
  menu.style.zIndex = -1;
}

//Função de pulo do personagem utilizando fatores do "mundo real" como a gravidade e a aceleração de acordo com a gravidade em uma queda
function playerJump() {
  player.y += player.vy;
  player.vy += gravity;

  if (player.vy > 0 && 
    (player.x + 15 < 260) && 
    (player.x + player.width - 15 > 155) && 
    (player.y + player.height > 475) && 
    (player.y + player.height < 500))
    player.jump();

  if (dir == "left") {
    player.dir = "left";
    if (player.vy < -7 && player.vy > -15) player.dir = "left_land";
  } else if (dir == "right") {
    player.dir = "right";
    if (player.vy < -7 && player.vy > -15) player.dir = "right_land";
  }

  //Adicionando controles ao jogo
  document.onkeydown = function(e) {
    var key = e.keyCode;

    if (key == 37) {
      dir = "left";
      player.isMovingLeft = true;
    } else if (key == 39) {
      dir = "right";
      player.isMovingRight = true;
    }
  
    if(key == 32) {
      if(firstRun === true) {
        init();
        firstRun = false;
      }
      else 
        reset();
    }
  };

  document.onkeyup = function(e) {
    var key = e.keyCode;

    if (key == 37) {
      dir = "left";
      player.isMovingLeft = false;
    } else if (key == 39) {
      dir = "right";
      player.isMovingRight = false;
    }
  };

  //Aceleração produzida quando o Jogador segurar pressionado as teclas de controle
  if (player.isMovingLeft === true) {
    player.x += player.vx;
    player.vx -= 0.15;
  } else {
    player.x += player.vx;
    if (player.vx < 0) player.vx += 0.1;
  }

  if (player.isMovingRight === true) {
    player.x += player.vx;
    player.vx += 0.15;
  } else {
    player.x += player.vx;
    if (player.vx > 0) player.vx -= 0.1;
  }

  //Faz o personagem pular quando atingir uma plataforma
  if ((player.y + player.height) > base.y && base.y < height) player.jump();

  //Se o personagem ir em direção a parede ele atravessará ela saindo do outro lado da tela (Como um teleporte)
  if (player.x > width) player.x = 0 - player.width;
  else if (player.x < 0 - player.width) player.x = width;

  player.draw();
}

function update() {
  ctx.clearRect(0, 0, width, height);
  playerJump();
}   

menuLoop = function() {
  update();
  requestAnimFrame(menuLoop);
};

menuLoop();