import { getCsrfToken } from "./index.js";
import { getUserData } from "./utils/userData.js"
import { leaveTournament } from "./tournamentPlayScript.js"

const hostname = window && window.location && window.location.hostname;

let user = {};
let players;
let tournamentInfo;



async function getPlayersInTournament() {
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/get_players_in_tournament", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
    })
    .then((res) => res.json())
    .then((data) => {
        players = data;
    })
}

async function getTournament(tournament) {
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/get_single_tournament", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
            tournament_name: tournament,
        }),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.error) {
                window.location.href = "https://" + hostname + ":8443/";
            }
            tournamentInfo = data;
        })
}
    
async function getUser() {
    user = await getUserData();
    user = user.user_data;
    await getPlayersInTournament();
}

await getUser();

let you = "";
let username = user.username;
const gameId = window.location.pathname.split("/")[3];
const tournamentName = gameId.split('round')[0]
const gameSocket = new WebSocket("wss://" + hostname + ":8000/ws/gameCustom/" + gameId + "/");

let x;
var gameSocketConnected = false;
gameSocket.onopen = function(e) {
    gameSocket.send(JSON.stringify({
        'type': 'start_game',
        'username': username,
    }));
    gameSocketConnected = true;
    x = performance.now();
};

setTimeout(() => {
    if (x > 500) {
        gameSocket.send(JSON.stringify({
            'type': 'missing_opponent',
            'username': username,
    }));
    }
}, 5000);

let gameState = 'start';
let score_1 = document.querySelector('.player_1_score');
let score_2 = document.querySelector('.player_2_score');


window.onbeforeunload = function() {
    if (gameSocket && gameState == 'play') {
        gameSocket.send(JSON.stringify({
            'type': 'leaving',
            'username': username,
        }));
        setTimeout(gameSocket.close(), 10);
    }
};

gameSocket.onclose = function(e) {
    gameSocketConnected = false;
};

let paddle_1 = document.querySelector('.paddle_1');
let paddle_2 = document.querySelector('.paddle_2');
let paddle_common = document.querySelector('.paddle').getBoundingClientRect();
let paddle_1_coord = paddle_1.getBoundingClientRect();
let initial_paddle1_coord = paddle_1.getBoundingClientRect();
let paddle_2_coord = paddle_2.getBoundingClientRect();
let initial_paddle2_coord = paddle_2.getBoundingClientRect();

let board = document.querySelector('.board');
let board_coord = board.getBoundingClientRect();


let initial_ball = document.querySelector('.ball');
let ball = document.querySelector('.ball');

let initial_ball_coord = ball.getBoundingClientRect(); 
let ball_coord = initial_ball_coord; 

const GAME_WIDTH = 640
const GAME_HEIGTH = 480

const MOUVEMENT_SPEED = 0.005;

let keyPressed = {
    "w": {pressed: false, func: player1Up},
    "s": {pressed: false, func: player1Down},
    "W": {pressed: false, func: player1Down},
    "S": {pressed: false, func: player1Up},
}

const executeMoves = () => {
    Object.keys(keyPressed).forEach(key=> {
      keyPressed[key].pressed && keyPressed[key].func()
    })
}

function player1Up() {
    if (gameState == 'play') {
        paddle_1.style.top = Math.max(board_coord.top, paddle_1_coord.top - window.innerHeight * MOUVEMENT_SPEED) + 'px';
        paddle_1_coord = paddle_1.getBoundingClientRect();

        gameSocket.send(JSON.stringify({
            'type': 'player_move',
            'message': 'up',
            'username': username,
        }));
    }
}

function player1Down() {
    if (gameState == 'play') {
        paddle_1.style.top = Math.min(board_coord.bottom - paddle_common.height, paddle_1_coord.top + window.innerHeight * MOUVEMENT_SPEED) + 'px';
        paddle_1_coord = paddle_1.getBoundingClientRect();

        gameSocket.send(JSON.stringify({
            'type': 'player_move',
            'message': 'down',
            'username': username,
        }));
    }
}

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

var player1 = '';
var player2 = '';
let interval = 0;

function updateScore(data) {
    if (username == player1) {
        score_1.innerHTML = data.scoreP1;
        score_2.innerHTML = data.scoreP2;
    }
    else {
        score_1.innerHTML = data.scoreP2;
        score_2.innerHTML = data.scoreP1;
    }
}

gameSocket.onmessage = async function(e) {
    const data = JSON.parse(e.data);

    if (data.type == 'user_list') {
        x = 0;
        player1 = data.message[0].username;
        player2 = data.message[1].username;

        if (username == player1)
            you = 1;
        else
            you = 2;
        let pseudo1 = data.pseudo[0];
        let pseudo2 = data.pseudo[1];
        document.getElementById('pp1').setAttribute('src', data.message[0].profile_pic_url);
        document.getElementById('pp2').setAttribute('src', data.message[1].profile_pic_url);
        document.getElementById('player1').textContent = pseudo1;
        document.getElementById('player2').textContent = pseudo2;
        gameState = 'play';
        ball_coord = ball.getBoundingClientRect(); 
        interval = setInterval(moveBall, 1000/60);
    }

    if (data.type == "error_too_much_player") {
        if (player1 == '' || player2 == '') {
            setTimeout(gameSocket.close(), 10);
            setTimeout(window.location.href = "https://" + hostname + ":8443/", 15);
        }
    }

    if (data.type == 'player_move') {
        if (username != data.username) {
            if (data.message === 'up') {
                paddle_2.style.top = Math.max(board_coord.top, paddle_2_coord.top - window.innerHeight * MOUVEMENT_SPEED) + 'px';
                paddle_2_coord = paddle_2.getBoundingClientRect();
            } 
            else if (data.message === 'down') {
                paddle_2.style.top = Math.min(board_coord.bottom - paddle_common.height, paddle_2_coord.top + window.innerHeight * MOUVEMENT_SPEED) + 'px';
                paddle_2_coord = paddle_2.getBoundingClientRect();
            }
        }
    }

    if (data.type == 'get_ball_position') {
        let BOARD_WIDTH = board.offsetWidth;
        let BOARD_HEIGHT = board.offsetHeight;
        let PAGE_WIDTH = window.innerWidth;
        let PAGE_HEIGHT = window.innerHeight;

        let speedX = (data.x * BOARD_WIDTH / GAME_WIDTH) - ball_coord.left;
        let speedY = (data.y * BOARD_HEIGHT / GAME_HEIGTH) - ball_coord.top;
        if (username == player2) {
            ball.style.left = ball_coord.left + speedX + (PAGE_WIDTH / 10) + 'px';
            ball.style.top = ball_coord.top + speedY + ((PAGE_HEIGHT / 10) - ball.offsetHeight * 2) + 'px';
        }
        else {
            ball.style.left = BOARD_WIDTH - (ball_coord.left + speedX - (PAGE_WIDTH / 10)) + 'px';
            ball.style.top = ball_coord.top + speedY + ((PAGE_HEIGHT / 10) - ball.offsetHeight * 2) + 'px';
        }
        ball_coord = ball.getBoundingClientRect();
    }

    if (data.type == "score") {
        updateScore(data);
    }

    if (data.type == "game_over") {
        gameState = 'stop';
        updateScore(data);
        clearInterval(interval);
        gameSocket.close();
        if (score_1.innerHTML == "5") {
            document.querySelector('.player-win').style.display = 'flex';
            setTimeout(() => {
                window.location.href = "https://" + hostname + ":8443/tournament/" + tournamentName;
            }, 3000);
        } else {
            document.querySelector('.player-lost').style.display = 'flex';
            await leaveTournament();
            setTimeout(() => {
                window.location.href = "https://" + hostname + ":8443/";
            }, 5000);
        }
    }

    if (data.type == "reset") {
        reset();
    }
};


function moveBall() {
    gameSocket.send(JSON.stringify({
        'type':'get_ball_position',
        'username': username,
    }));
    executeMoves();
}

function reset() {
    paddle_1.style.top = initial_paddle1_coord.top + 'px';
    paddle_1_coord = initial_paddle1_coord;
    paddle_2.style.top = initial_paddle2_coord.top + 'px';
    paddle_2_coord = initial_paddle2_coord;
}

