import { getUserData } from "./utils/userData.js";
import { waitingPopUp } from "./utils/tournamentPlayUtils.js";
import { announceGame, readyStatus, winPopUp, ready } from "./utils/tournamentPlayUtils.js";
import { SetUpRound, emptyRound } from "./utils/roundDisplay.js";
import { getRound } from "./utils/roundDisplay.js";
import { matchHistory, nextBracket } from "./utils/tournamentMatchHistory.js";
import { initializeI18next } from "../../locales/translatei18n.js";

const hostname = window && window.location && window.location.hostname;
let status = "loading";

const tournamentName = window.location.pathname.split("/")[2];
const waiting_room_tournamentSocket = new WebSocket(
    "wss://" +
        hostname +
        ":8000/ws/waiting_room_tournament/" +
        tournamentName +
        "/"
);

waiting_room_tournamentSocket.onopen = function (e) {
    waiting_room_tournamentSocket.send(
        JSON.stringify({
            message: "connected",
        })
    );
};

let tournamentInfo = {
    name: tournamentName,
    password: "",
    maxPlayers: "",
    winPoints: "",
    winSets: "",
};

let player_list;
let NumberOfRounds;
let currentRound = 1;

waiting_room_tournamentSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    player_list = data.player_list;
    waitingListDisplay(data, false);
};

const tournament_startedSocket = new WebSocket(
    "wss://" + hostname + ":8000/ws/tournament_started/" + tournamentName + "/"
);

tournament_startedSocket.onopen = function (e) {
    tournament_startedSocket.send(
        JSON.stringify({
            message: "connected",
        })
    );
};

let user;
async function getUser() {
    user = await getUserData();
    user = user.user_data;
}

getUser();

window.onbeforeunload = function() {
    if (tournament_startedSocket && status !== 'game' && window.location.href === `https://${hostname}:8443/tournament/${tournamentName}`) {
        tournament_startedSocket.send(JSON.stringify({
            'type': 'leaving',
            'username': user.username,
        }));
        setTimeout(tournament_startedSocket.close(), 10);
    }
    setTimeout(() => {}, 25);
};

let gameSocketConnected = false;

async function startGame(bracket, round) {
    await getUser();
    let username = user.username;

    let match = 0;
    let i = 0;
    for (i; i < bracket.length; i++) {
        if (bracket[i].first_username === username ||
            bracket[i].second_username === username) {
            match = i;
            break;
        }
        if (bracket[i].odd_user === username) {
            match = i;
        }
    }
    status = "game";
    window.location.href = `https://${hostname}:8443/tournament/${tournamentName}/${tournamentName}round${round}match${match}`;
}

let winner = 0;

tournament_startedSocket.onmessage = async function (e) {
    waiting_room_tournamentSocket.close();
    const data = JSON.parse(e.data);
    if (data.event === "In progress") {
        document.querySelector(".tournament").innerHTML = "";
        await getPlayersInTournament();
        emptyRoundsSetUp(players.data.length, 0);
        readyStatus();
    }
    if (data.update_bracket) {
        generateBracket(data.player_list);
    }
    if (data.event === "You won the tournament") {
        winPopUp();
        await deploySmartContract();
        window.location.href = "https://" + hostname + ":8443/";
    }
};

let players = [];

async function getPlayersInTournament() {
    const csrfToken = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/tournament/get_players_in_tournament",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
        }
    )
        .then((res) => res.json())
        .then((data) => {
            players = data;
        })
}

async function getTournament(tournament) {
    const csrfToken = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/tournament/get_single_tournament",
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({
                tournament_name: tournament,
            }),
        }
    )
        .then((res) => res.json())
        .then((data) => {
            if (data.error) {
                document.querySelector(".tournament").style.display = "none";
                document.querySelector(".returnHome").style.display = "flex";
            }
            tournamentInfo = data;
        })
        .catch((err) => {});
}

function getNumberOfRounds(players) {
    if (players <= 2) return 1;
    if (players <= 4) return 2;
    else if (players <= 8) return 3;
    else if (players > 8) return 4;
}

function fillHistory(history) {
    emptyRoundsSetUp(establishHistoryGames(history[0]), 1);
    let incr = 0;
    for (let i = establishHistoryGames(history[0]); i > 0; i--) {
        let round = document.getElementById("round" + i);
        let odd = 0;
        for (let j = 0; j < round.children.length; j++) {
            let match = round.querySelector("#match" + j);
            let matchInfo = match.querySelector(".match__info");
            let matchInfo2 = match.querySelector(".match__info_2");
            if (history[incr] && history[incr].matches[j]) {
                matchInfo.querySelector(
                    ".match__name"
                ).innerHTML = `<p>${history[incr].matches[j].first_pseudo}</p>`;
                matchInfo
                    .querySelector("img")
                    .setAttribute(
                        "src",
                        history[incr].matches[j].first_picture
                    );
                matchInfo2.querySelector(
                    ".match__name"
                ).innerHTML = `<p>${history[incr].matches[j].second_pseudo}</p>`;
                match.querySelector(
                    ".match__score"
                ).innerHTML = `<p>${history[incr].matches[j].first_player_point} : ${history[incr].matches[j].second_player_point} </p>`;
                matchInfo2
                    .querySelector("img")
                    .setAttribute(
                        "src",
                        history[incr].matches[j].second_picture
                    );
            }
            if (history[incr] && !history[incr].matches[j] && history[incr].odd_players[odd]) {
                matchInfo.querySelector(
                    ".match__name"
                ).innerHTML = `<p>${history[incr].odd_players[odd].pseudo}</p>`;
                matchInfo
                    .querySelector("img")
                    .setAttribute(
                        "src",
                        history[incr].odd_players[odd].odd_picture
                    );
                match.querySelector(
                    ".match__score"
                ).innerHTML = `<p> 5 : 0 </p>`;
                matchInfo2.querySelector(
                    ".match__name"
                ).innerHTML = `<p> DQ </p>`;
                odd++;
            }
        }
        incr++;
    }
}

function scoreUpdate(match) {
    let scoreElement = document.querySelector(
        "#" + match.first_user + match.second_user
    );
    if (scoreElement) {
        scoreElement.innerHTML = `
        <p> ${match.first_player_point} : ${match.second_player_point} </p>`;
    }
}

function insertNextBracket(nextBracketTab) {
    let roundNum = Object.keys(nextBracketTab).length;
    if (roundNum > 4) roundNum = 4;
    else if (roundNum > 2) roundNum = 3;
    let roundElement = document.getElementById("round" + roundNum);
    for (let i = 0; i < roundElement.children.length; i++) {
        let match = roundElement.querySelector("#match" + i);
        let matchInfo = match.querySelector(".match__info");
        let matchInfo2 = match.querySelector(".match__info_2");
        if (nextBracketTab[i] && nextBracketTab[i].first_pseudo) {
            matchInfo.querySelector(
                ".match__name"
            ).innerHTML = `<p>${nextBracketTab[i].first_pseudo}</p>`;
            matchInfo
                .querySelector("img")
                .setAttribute(
                    "src",
                    nextBracketTab[i].first_picture
                );
            matchInfo2.querySelector(
                ".match__name"
            ).innerHTML = `<p>${nextBracketTab[i].second_pseudo}</p>`;
            matchInfo2
                .querySelector("img")
                .setAttribute(
                    "src",
                    nextBracketTab[i].second_picture
                );
            match.querySelector(".match__score").innerHTML = `<p> 0 : 0 </p>`;
            match
                .querySelector(".match__score")
                .setAttribute(
                    "id",
                    nextBracketTab[i].first_user + nextBracketTab[i].first_user
                );
        } else if (nextBracketTab[i] && nextBracketTab[i].odd_user) {
            matchInfo.querySelector(
                ".match__name"
            ).innerHTML = `<p>${nextBracketTab[i].odd_name}</p>`;
            matchInfo
                .querySelector("img")
                .setAttribute(
                    "src",
                    nextBracketTab[i].odd_picture
                );
            match.querySelector(".match__score").innerHTML = `<p> 5 : 0 </p>`;
            matchInfo2.querySelector(".match__name").innerHTML = `<p> DQ </p>`;
        }
    }
}

function establishHistoryGames(bracket) {
    let count =
        Object.keys(bracket.matches).length +
        Object.keys(bracket.odd_players).length;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
}

async function setUpTournament() {
    await getTournament(tournamentName);
    await getPlayersInTournament();
    const user = await getUserData();
    if (document.querySelector(".returnHome"))
        if (
            players.data === undefined ||
            document.querySelector(".returnHome").style.display === "flex"
        )
            return;
    NumberOfRounds = getNumberOfRounds(players.data.length);
    let player = players.data.find(
        (player) => player.username === user.user_data.username
    );
    if (players.data.length === 1 && tournamentInfo.data.status === "In progress") {
        setTimeout(() => {window.location.href = "https://" + hostname + ":8443/"}, 8000)
        return ;
    }
    else if (tournamentInfo.data.status === "In progress") {
        status = "waiting";
        const tournamentSetUp = document.querySelector(".tournament");
        if (tournamentSetUp) {
            tournamentSetUp.innerHTML = ``;
            let history = await  matchHistory();
            waiting_room_tournamentSocket.close();
            if (history)
                fillHistory(history.data);
            readyStatus();
        }
        return;
    }
    else {
        if (player.is_admin) {
            document.querySelector(".tournament__title").innerHTML = `
                    <span>${tournamentInfo.data.tournament_name}</span>
                    <div class="tournament__admin">
                        <button data-i18n="Start" class="tournament__start_admin"></button>
                        <button data-i18n="Leave" class="tournament__leave_button"></button>
                    </div>
                    `;
            document
                .querySelector(".tournament__start_admin")
                .addEventListener("click", async () => {
                    await startTournament();
                    waiting_room_tournamentSocket.close();
                });
        } else {
            document.querySelector(".tournament__title").innerHTML = `
            <span>${tournamentInfo.data.tournament_name}</span>
                <div class="tournament__leave">
                    <button data-i18n="Leave" class="tournament__leave_button"></button>
                </div>
            `;
        }
        document
            .querySelector(".tournament__leave_button")
            .addEventListener("click", async () => {
                await leaveTournament();
            });
        let dataTrad = "";
        if (localStorage.getItem('language'))
            dataTrad = localStorage.getItem('language').split('-')[1];
        else
            dataTrad = 'fr';
        initializeI18next(dataTrad);
        waitingListDisplay(players, true);
    }
}

setUpTournament();

function waitingListDisplay(players, setUp) {
    if (setUp) {
        let waitingList = document.createElement("div");
        waitingList.classList.add("waitingList");
        waitingList.innerHTML = `
            <div class="waitingList">
                <img src="../../static/assets/tourney/notourney.svg" alt="arrow">
                <div class="waitingList__players__list">
                    <h3 data-i18n="players_in_tournament"></h3>
                    <ul id="listWaiting">
                        ${players.data
                            .map((player) => {
                                return `<li class="list__players">
                                    <img src="${player.profile_picture}">
                                ${player.pseudo}
                                        </li>
                                `;
                            })
                            .join("")}
                    </ul>
                    <div class="waiting__loader">
                        <span data-i18n="waiting_message" style="padding: 10px;"></span>
                        <div class="loader"></div>
                    </div>
                </div>
            </div>
        `;
        let trad = "";
        if (localStorage.getItem('language'))
            trad = localStorage.getItem('language').split('-')[1];
        else
            trad = 'fr';
        initializeI18next(trad);
        document.querySelector(".tournament").appendChild(waitingList);
        if (document.querySelector("body").className === "dark")
            document.querySelector("#app").style.backgroundImage =
                'url("../../static/assets/darkblob.svg")';
        else
            document.querySelector("#app").style.backgroundImage =
                'url("../../static/assets/lightblob.svg")';
        document.querySelector("#app").style.backgroundSize = "cover";
        document.querySelector("#app").style.backgroundRepeat = "no-repeat";
        let dataTrad = "";
        if (localStorage.getItem('language'))
            dataTrad = localStorage.getItem('language').split('-')[1];
        else
            dataTrad = 'fr';
        initializeI18next(dataTrad);
    } else {
        let list = document.querySelector("#listWaiting");
        if (list) {
            list.innerHTML = "";
            players.player_list.forEach((element) => {
                let playerLi = document.createElement("li");
                playerLi.classList.add("list__players");
                playerLi.innerHTML = `
                    <img src="${element.profile_picture}">
                    ${element.pseudo}`;
                list.appendChild(playerLi);
            });
        }
    }
}
document.querySelector("body").addEventListener("click", (event) => {
    if (
        event.target.className === "bx bx-moon sun" &&
        tournamentInfo.data.status === "Waiting room"
    )
        document.querySelector("#app").style.backgroundImage =
            'url("../../static/assets/darkblob.svg")';
    else if (
        event.target.className === "bx bx-sun moon" &&
        tournamentInfo.data.status === "Waiting room"
    )
        document.querySelector("#app").style.backgroundImage =
            'url("../../static/assets/lightblob.svg")';
});

async function addPicturesAndOddPlayers(bracket) {
    await getPlayersInTournament();
    players.data.forEach((element) => {
        let is_playing = false;
        let i = 0;
        for (i; i < bracket.length; i++) {
            if (bracket[i].first_pseudo === element.pseudo) {
                bracket[i].first_picture = element.profile_picture;
                is_playing = true;
            } else if (bracket[i].second_pseudo === element.pseudo) {
                bracket[i].second_picture = element.profile_picture;
                is_playing = true;
            }
        }
        if (!is_playing) {
            bracket.push({
                odd_name: element.pseudo,
                odd_user: element.username,
                odd_picture: element.profile_picture,
            });
        }
    });
}

function establishGames(bracket) {
    let count = 0;
    bracket.forEach((game) => {
        if (game.first_username) count++;
        else if (game.odd_name) count++;
    });
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
}

async function generateBracket(bracket) {
    await addPicturesAndOddPlayers(bracket);
    insertNextBracket(bracket);
    let roundNum = Object.keys(bracket).length;
    startGame(bracket, roundNum);
}

function emptyRoundsSetUp(total, round) {
    const tournamentSetUp = document.querySelector(".tournament");
    if (round == 0) round = getNumberOfRounds(total);
    else round = total;
    for (let i = 1; i <= round; i++) {
        let round;
        let title = document.createElement("h2");
        title.classList.add("round__title");
        round = emptyRound(i, "TBD");
        if (i === 1) {
            title.innerHTML = "Final";
            round.style.display = "flex";
            round.style.justifyContent = "center";
            round.style.alignItems = "center";
            round.style.flexDirection = "row";
        } else title.innerHTML = `Round ${i}`;
        round.classList.add("round");
        tournamentSetUp.insertBefore(round, tournamentSetUp.firstChild);
        tournamentSetUp.insertBefore(title, tournamentSetUp.firstChild);
    }
}

function getCsrfToken() {
    return fetch(
        "https://" + hostname + ":8000/authentification/get-csrf-token/",
        {
            method: "GET",
            credentials: "include",
        }
    )
        .then((response) => response.json())
        .then((data) => {
            const csrfToken = data.csrfToken;
            return csrfToken;
        })
        .catch((error) => {
        });
}

export async function leaveTournament() {
    const user = await getUserData();
    const csrfToken = await getCsrfToken();
    let player = players.data.find(
        (player) => player.username === user.user_data.username
    );
    await fetch("https://" + hostname + ":8000/tournament/leave_tournament", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
            username: player.username,
            tournament_name: tournamentInfo.data.tournament_name,
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.status === "success") {
                window.location.href = "https://" + hostname + ":8443/";
            }
            if (data.error) {
                document.querySelector(".notify").style.opacity = "1";
                document.querySelector(".notify").innerHTML = data.error;
                setTimeout(removeNotify, 4000);
            }
        })
}

let match;

async function startTournament() {
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/start_tournament", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.error) {
                document.querySelector(".notify").style.opacity = "1";
                document.querySelector(".notify").innerHTML = data.error;
                setTimeout(removeNotify, 4000);
            }
            match = data.data;
        })
}

async function deploySmartContract() {
    const csrfToken = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/tournament/deploySmartContract",
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({"tournamentName":  window.location.pathname.split("/")[2]}),
        }
    )
        .then((res) => res.json())
        .then((data) => {
            return data;
        })
}

function removeNotify() {
    document.querySelector(".notify").style.opacity = "0";
}
