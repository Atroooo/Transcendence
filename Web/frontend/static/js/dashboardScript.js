import { getUserData } from "./utils/userData.js";

const hostname = window && window.location && window.location.hostname;

'use strict';

var canvas;
var game;
var anim;

var gameStarted = false;

let localGame = {
    winningScore: 0,
    players:  []
}

var WINNING_SCORE = 0;
canvas = document.getElementById('canvas');
var container = document.querySelector('.game-container');
container.style.left = (window.innerWidth - container.offsetWidth) / 2 + 'px';

canvas.width = container.offsetWidth;
canvas.height = container.offsetHeight;
const WIDTH = container.offsetWidth;
const HEIGHT = container.offsetHeight;

window.addEventListener('resize', () => {
    container.style.left = (window.innerWidth - container.offsetWidth) / 2 + 'px';
});


const PLAYER_HEIGHT = HEIGHT / 5;
const PLAYER_WIDTH = HEIGHT / 100;
const PLAYER_START_X = 10;

const MAX_SPEED = 15;
const SPEED_INCREMENT = 1.5;

const MOUVEMENT_SPEED = 15;

let player1;

async function getPlayer1() {
    player1 = await getUserData();
    player1 = player1.user_data.username;
}

getPlayer1();

async function draw() {
    var context = canvas.getContext('2d');

    // Draw field
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw middle line
    context.strokeStyle = 'white';
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.stroke();

    // Draw players
    context.fillStyle = 'white';
    context.fillRect(PLAYER_START_X, game.player1.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    context.fillRect(canvas.width - PLAYER_WIDTH - PLAYER_START_X, game.player2.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    // Draw ball
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(game.ball.x, game.ball.y, game.ball.r, 0, Math.PI * 2, false);
    context.fill();

    let pixelWidth = "";
    if (HEIGHT < 500) {
        pixelWidth = "20px";
    } else if (HEIGHT < 1000) {
        pixelWidth = "30px";
    } else if (HEIGHT < 1200) {
        pixelWidth = "50px";
    } else {
        pixelWidth = "70px";
    }
    context.font = pixelWidth + " Comfortaa";
    context.fillText("pong", canvas.width / 2 - context.measureText("pong").width / 2, HEIGHT - 50);

    // Draw score
    if (gameStarted === true) {
        context.font = pixelWidth + " pixel";
        const player1ScoreX = canvas.width / 4;
        
        // Calculate the positions for player 2 score and name
        const player2ScoreX = (canvas.width / 4) * 3;
        
        // Draw player 1 score and name
        context.fillText(game.player1.score, player1ScoreX, 100);
        
        // Draw player 2 score and name
        context.fillText(game.player2.score, player2ScoreX, 100);
    }
}

let keyPressed = {
    "w": {pressed: false, func: player1Down},
    "s": {pressed: false, func: player1Up},
    "W": {pressed: false, func: player1Down},
    "S": {pressed: false, func: player1Up},
    "ArrowUp": {pressed: false, func: player2Up},
    "ArrowDown": {pressed: false, func: player2Down},
}
function playerMove(event) {
    if (event.keyCode == 83) {
        if (game.player1.y < canvas.height - PLAYER_HEIGHT)
            game.player1.y += MOUVEMENT_SPEED;
    } else if (event.kextyCode == 87) {
        if (game.player1.y > 0)
            game.player1.y -= MOUVEMENT_SPEED;
    }
}

const executeMoves = () => {
    Object.keys(keyPressed).forEach(key=> {
      keyPressed[key].pressed && keyPressed[key].func()
    })
}

function player1Up() {
    if (game.player1.y < canvas.height - PLAYER_HEIGHT)
        game.player1.y += MOUVEMENT_SPEED;
}

function player1Down() {
    if (game.player1.y > 0)
        game.player1.y -= MOUVEMENT_SPEED;
}

function player2Up() {
    if (game.player2.y > 0)
        game.player2.y -= MOUVEMENT_SPEED;
}

function player2Down() {
    if (game.player2.y < canvas.height - PLAYER_HEIGHT)
        game.player2.y += MOUVEMENT_SPEED;
}

function updateScore(player, WINNING_SCORE) {
    if (player == "p1")
        game.player1.score++;
    else 
        game.player2.score++;
    document.querySelector('#player1-score').textContent = game.player1.score;
    document.querySelector('#player2-score').textContent = game.player2.score;
    if (game.player1.score == WINNING_SCORE || game.player2.score == WINNING_SCORE) {
        gameStarted = false;
        stop();
        document.querySelector('.stop__local_game').style.display = 'none';
        if (game.player1.score == WINNING_SCORE) {
            document.querySelector('.player-lost').style.display = 'flex';
        } else {
            document.querySelector('.player-win').style.display = 'flex';
        }
    }
    else
        reset();
}

function changeDirection(playerPosition) {
    let side = 0;
    if (playerPosition + PLAYER_HEIGHT / 2 < game.ball.y)
        side = 1;
    else
        side = -1;
    
    var impact = game.ball.y - playerPosition - PLAYER_HEIGHT / 2;
    if (impact > -5 && impact < 5) {
        if (Math.random() > 0.5) 
            impact = 20;
        else
            impact = -20;
    }
    var ratio = 100 / (PLAYER_HEIGHT / 2);
    game.ball.speed.y = impact * ratio / 20;
    if (side == 1 && game.ball.speed.y < 0 || side == -1 && game.ball.speed.y > 0)
        game.ball.speed.y *= -1;
    game.ball.speed.x *= - 1;
}

function handleCollisions() {
    
    if (game.ball.y >= canvas.height || game.ball.y <= 0)
        game.ball.speed.y *= -1;


    if (game.ball.speed.x < 0) {
        if (game.ball.x - game.ball.r <= PLAYER_START_X + PLAYER_WIDTH * 1.2 && 
            game.ball.y >= game.player1.y && game.ball.y <= game.player1.y + PLAYER_HEIGHT) {
            
            if (game.ball.speed.x < -MAX_SPEED)
                game.ball.speed.x -= SPEED_INCREMENT;
            changeDirection(game.player1.y);
        }
    }
    if (game.ball.speed.x > 0) {
        if (game.ball.x + game.ball.r >= WIDTH - PLAYER_START_X - PLAYER_WIDTH * 1.2 && 
            game.ball.y >= game.player2.y && game.ball.y <= game.player2.y + PLAYER_HEIGHT) {
            
            if (game.ball.speed.x < MAX_SPEED)
                game.ball.speed.x += SPEED_INCREMENT;
            changeDirection(game.player2.y);
        }
    }
}

function ballMove() {
    handleCollisions();
    game.ball.x += game.ball.speed.x;
    game.ball.y += game.ball.speed.y;

}

function handleScore(WINNING_SCORE) {
    if (game.ball.x < 0)
        updateScore("p2", WINNING_SCORE);
    if (game.ball.x > WIDTH)
        updateScore("p1", WINNING_SCORE);
}

async function play() {
    const WINNING_SCORE = localGame.winningScore;
    draw();

    executeMoves();
    
    ballMove();
    handleScore(WINNING_SCORE)

    anim = requestAnimationFrame(play);
}

function reset() {
    // Set ball and players to the center
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    game.player1.y = canvas.height / 2 - PLAYER_HEIGHT / 2;
    game.player2.y = canvas.height / 2 - PLAYER_HEIGHT / 2;

    // Reset speed
    if (Math.random() > 0.5)
        game.ball.speed.x = -7.5;
    else
        game.ball.speed.x = 7.5;
    game.ball.speed.y = 0;
}

function stop() {
    cancelAnimationFrame(anim);
    reset();

    game.player2.score = 0;
    game.player1.score = 0;

    document.querySelector('#player2-score').textContent = game.player2.score;
    document.querySelector('#player1-score').textContent = game.player1.score;

    draw();
}

game = {
    player1: {
        score: 0
    },
    player2: {
        score: 0,
    },
    ball: {
        r: HEIGHT / 100,
        speed: {}
    },
};
reset();

draw();

document.addEventListener("keydown", (e) => {
    if(keyPressed[e.key]){
        keyPressed[e.key].pressed = true
    }
})
document.addEventListener("keyup", (e) => {
    if(keyPressed[e.key]){
        keyPressed[e.key].pressed = false
    }
})

document.querySelectorAll('.local__values_players').forEach((button) => {
    button.addEventListener('click', () => {
        localGame.players = button.value;
        document.querySelector('.selectPlayers').style.display = 'none';
        document.querySelector('.selectPoints').style.display = 'flex';
    });
});

document.querySelectorAll('.local__values_points').forEach((button) => {
    button.addEventListener('click', async (event) => {
        localGame.winningScore = event.target.value;
        gameStarted = true;
        document.querySelector('.selectPoints').style.display = 'none';
        document.getElementById('stop-game').style.display = 'block';
        getPlayer1();
        play();
    });
});

document.querySelector('#stop-game').addEventListener('click', () => {
    gameStarted = false;
    document.getElementById('stop-game').style.display = 'none';
    document.querySelector('.selectPlayers').style.display = 'flex';
    localGame.players = [];
    localGame.winningScore = 0;
    stop();
});

document.addEventListener('click', function(event) {
    if (event.target.id === 'closeLoseWindow') {
        gameStarted = false;
        document.querySelector('.player-lost').style.display = 'none';
        document.getElementById('stop-game').style.display = 'none';
        document.querySelector('.selectPlayers').style.display = 'flex';
        localGame.players = [];
        localGame.winningScore = 0;
        stop();
    } else if (event.target.id === 'closeWinWindow') {
        gameStarted = false;
        document.querySelector('.player-win').style.display = 'none';
        document.getElementById('stop-game').style.display = 'none';
        document.querySelector('.selectPlayers').style.display = 'flex';
        localGame.players = [];
        localGame.winningScore = 0;
        stop();
    } else if (event.target.id === 'play-again') {
        gameStarted = true;
        game.player2.score = 0;
        game.player1.score = 0;
        document.querySelector('#player1-score').textContent = game.player1.score;
        document.querySelector('#player2-score').textContent = game.player2.score;
        document.querySelector('.player-win').style.display = 'none';
        document.querySelector('.player-lost').style.display = 'none';
        document.querySelector('.selectPlayers').style.display = 'none';
        stop();
        reset();
        play();
    }
});

if (gameStarted == false) {
    document.querySelector('.selectPlayers').style.display = 'flex';
    document.getElementById('stop-game').style.display = 'none';
}