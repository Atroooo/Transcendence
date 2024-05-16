import { getCsrfToken } from "./index.js";

const hostname = window && window.location && window.location.hostname;
const gameSocket = new WebSocket("wss://" + hostname + ":8000/ws/gamePVP/");

async function getUserData() {
    return await fetch(
    "https://" + hostname + ":8000/authentification/get_user_data/",
    {
        method: "GET",
        credentials: "include",
    }
    )
    .then((response) => response.json())
    .then((data) => {
        return data;
    })
    .catch((error) => {
    });
}

let user = {};
let picture = "";

async function getUser() {
    user = await getUserData();
    user = user.user_data;
    picture = user.profile_picture;
}

let username = "";

gameSocket.onopen = async function(e) {
    await getUser();
    username = user.username;
    gameSocket.send(JSON.stringify({
        'type': 'join_room',
        'username': username,
    }));
};

let gameState = 'start';

window.onbeforeunload = function() {
    if (gameSocket && gameState == 'play') {
        gameSocket.send(JSON.stringify({
            'type': 'leaving',
            'username': username,
        }));
        setTimeout(gameSocket.close(), 10);
    }
};

var counterElement = document.getElementById('waiting-time');
if (counterElement) {
    var counter = 0;
    function updateCounter() {
        counter++;
        counterElement.textContent = counter + "s";
    }
    setInterval(updateCounter, 1000);
}

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

let score_1 = document.querySelector('.player_1_score');
let score_2 = document.querySelector('.player_2_score');

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

async function printInstructions(room_name) {
    let token = await getCsrfToken();
    console.log("To go up run :");
    console.log('await fetch("https://127.0.0.1:8000/game/playerUp/", {method: "POST", credentials: "include", headers: { "X-CSRFToken": "' + token + '","Content-Type": "application/json",}, body: JSON.stringify({ room_name: "' + room_name + '", nb_request: 1 }),})');
    console.log("To go down run :");
    console.log('await fetch("https://127.0.0.1:8000/game/playerDown/", {method: "POST", credentials: "include", headers: { "X-CSRFToken": "' + token + '","Content-Type": "application/json",}, body: JSON.stringify({ room_name: "' + room_name + '", nb_request: 1 }),})');
}


gameSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);

    if (data.type == 'user_list') {
        document.querySelector(".player-waiting").style.display = "none";
        player1 = data.message[0].username; 
        player2 = data.message[1].username;
        if (username == player1) {
            document.querySelector('.player1_picture').setAttribute('src', data.message[0].profile_pic_url);
            document.querySelector('.player2_picture').setAttribute('src', data.message[1].profile_pic_url);
        } else {
            document.querySelector('.player1_picture').setAttribute('src', data.message[1].profile_pic_url);
            document.querySelector('.player2_picture').setAttribute('src', data.message[0].profile_pic_url);
        }
        gameState = 'play';
        ball_coord = ball.getBoundingClientRect(); 
        interval = setInterval(moveBall, 1000/60);
        printInstructions(data.room_name);
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

    if (data.type == "player_moveAPI") {
        if (data.message === "APIup") {
            if (username === data.username){
                for (let i = 0; i < data.nb; i++) {
                    paddle_1.style.top = Math.max(board_coord.top, paddle_1_coord.top - window.innerHeight * MOUVEMENT_SPEED) + 'px';
                    paddle_1_coord = paddle_1.getBoundingClientRect();
    
                    gameSocket.send(JSON.stringify({
                        'type': 'player_move',
                        'message': 'up',
                        'username': username,
                    }));
                }
            } 
        }
        else if (data.message === "APIdown") {
            if (username === data.username){
                for (let i = 0; i < data.nb; i++) {
                    paddle_1.style.top = Math.min(board_coord.bottom - paddle_common.height, paddle_1_coord.top + window.innerHeight * MOUVEMENT_SPEED) + 'px';
                    paddle_1_coord = paddle_1.getBoundingClientRect();
    
                    gameSocket.send(JSON.stringify({
                        'type': 'player_move',
                        'message': 'down',
                        'username': username,
                    }));
                }
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
        } else {
            document.querySelector('.player-lost').style.display = 'flex';
        }
    }

    if (data.type == "reset") {
        reset();
    }

    if (data.type == "error") {
        setTimeout(gameSocket.close(), 10);
        setTimeout(window.location.href = "https://" + hostname + ":8443/", 15);
    }
}


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
    

document.addEventListener('click', function(event) {
    if (event.target.id === 'closeLoseWindow') {
         window.location.href = "https://" + hostname + ":8443/";
    } else if (event.target.id === 'closeWinWindow') {
        window.location.href = "https://" + hostname + ":8443/";
    } else if (event.target.id === 'play-again') {
        location.reload();
    }
});