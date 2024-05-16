const hostname = window && window.location && window.location.hostname;

let tournamentInfo = {
    tournament_name: "",
    pseudo: "",
    number_max_of_players: 0,
};

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
            throw error;
        });
}

function checkPseudo(pseudo) {
    const pseudoRegex = /^[a-zA-Z0-9_]*$/;
    return pseudoRegex.test(pseudo);
}

document.querySelectorAll(".tournament__option_button_players")
    .forEach((button) => {
        button.classList.add("tournament__option_button");
        button.addEventListener("click", (e) => {
            tournamentInfo.number_max_of_players = e.target.innerHTML;
        });
});

async function createTournament() {
    if (!checkPseudo(tournamentInfo.pseudo) || tournamentInfo.pseudo === "") {
        document.querySelector(".notify").style.opacity = "1";
        document.querySelector(".notify").innerHTML = "Please input a correct pseudo"
        setTimeout(removeNotify, 4000);
        return ;
    }
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/create_tournament", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(tournamentInfo),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.status === "success")
                window.location.href = `/tournament/${tournamentInfo.tournament_name}`;
            if (data.error !== undefined) {
                document.querySelector(".notify").style.opacity = "1";
                document.querySelector(".notify").innerHTML = data.error;
                setTimeout(removeNotify, 4000);
            }
        })
}

function removeNotify() {
    document.querySelector(".notify").style.opacity = "0";
}

async function joinTournament(publicBool) {
    if (joinTournamentInfo.pseudo === "" || !checkPseudo(joinTournamentInfo.pseudo )) {
        document.querySelector(".notify").style.opacity = "1";
        document.querySelector(".notify").innerHTML = "Please input or correct your pseudo"
        setTimeout(removeNotify, 4000);
        return ;
    }
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/join_tournament", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(joinTournamentInfo),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.status === "success") {
                window.location.href = `/tournament/${joinTournamentInfo.tournament_name}`;
            }
            if (
                data.error === "Missing or empty tournament name" ||
                data.error === "Tournament name already exist" ||
                data.error === "Tournament does not exist"
            ) {
                document.querySelector(".notify").style.opacity = "1";
                document.querySelector(".notify").innerHTML = data.error;
                setTimeout(removeNotify, 4000);
            } else if (data.error === "User is already in the tournament") {
                window.location.href = `/tournament/${joinTournamentInfo.tournament_name}`;
            } else if (data.error !== undefined && publicBool === false) {
                document.querySelector(".notify").style.opacity = "1";
                document.querySelector(".notify").innerHTML = data.error;
                setTimeout(removeNotify, 4000);
            } else if (data.error !== undefined && publicBool === true) {
                document.querySelector(".notify").style.opacity = "1";
                document.querySelector(".notify").innerHTML = data.error;
                setTimeout(removeNotify, 4000);
            }
        })
}

function getCsrfToken() {
    return fetch("https://" + hostname + ":8000/authentification/get-csrf-token/", {
        method: "GET",
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
            const csrfToken = data.csrfToken;
            return csrfToken;
        })
        .catch((error) => {
            throw error;
        });
}

let joinTournamentInfo = {
    tournament_name: "",
    pseudo: "",
};

document.querySelectorAll(".tournament__input").forEach((input) => {
    input.addEventListener("input", (event) => {
        if (input.id === "name")
            tournamentInfo.tournament_name = event.target.value;
        if (input.id === "pseudo") tournamentInfo.pseudo = event.target.value;
        if (input.id === "joinName")
            joinTournamentInfo.tournament_name = event.target.value;
        if (input.id === "joinPseudo")
            joinTournamentInfo.pseudo = event.target.value;
    });
});

var currentOptionPlayer = null;
document
    .querySelectorAll(".tournament__option_button_players")
    .forEach((button) => {
        button.addEventListener("click", () => {
            if (currentOptionPlayer != null && currentOptionPlayer != button) {
                currentOptionPlayer.style.backgroundColor =
                    "var(--toggle-color)";
                currentOptionPlayer.style.color = "var(--primary-color)";
            }
            if (currentOptionPlayer == button) {
                button.style.backgroundColor = "var(--toggle-color)";
                currentOptionPlayer.style.color = "var(--primary-color)";
                currentOptionPlayer = null;
                return;
            }
            button.style.backgroundColor = "var(--primary-color)";
            button.style.color = "var(--toggle-color)";
            currentOptionPlayer = button;
        });
    });

var currentOptionPoints = null;
document
    .querySelectorAll(".tournament__option_button_points")
    .forEach((button) => {
        button.addEventListener("click", () => {
            if (currentOptionPoints != null && currentOptionPoints != button) {
                currentOptionPoints.style.backgroundColor =
                    "var(--toggle-color)";
                currentOptionPoints.style.color = "var(--primary-color)";
            }
            if (currentOptionPoints == button) {
                button.style.backgroundColor = "var(--toggle-color)";
                currentOptionPoints.style.color = "var(--primary-color)";
                currentOptionPoints = null;
                return;
            }
            button.style.backgroundColor = "var(--primary-color)";
            button.style.color = "var(--toggle-color)";
            currentOptionPoints = button;
        });
    });

var currentOptionSets = null;
document
    .querySelectorAll(".tournament__option_button_sets")
    .forEach((button) => {
        button.addEventListener("click", () => {
            if (currentOptionSets != null && currentOptionSets != button) {
                currentOptionSets.style.backgroundColor = "var(--toggle-color)";
                currentOptionSets.style.color = "var(--primary-color)";
            }
            if (currentOptionSets == button) {
                button.style.backgroundColor = "var(--toggle-color)";
                currentOptionSets.style.color = "var(--primary-color)";
                currentOptionSets = null;
                return;
            }
            button.style.backgroundColor = "var(--primary-color)";
            button.style.color = "var(--toggle-color)";
            currentOptionSets = button;
        });
    });

document.querySelectorAll(".tournament__create").forEach((button) => {
    button.addEventListener("click", async () => {
        if (button.id === "createTournament") {
            await createTournament();
        }
        if (button.id === "joinTournament") await joinTournament(false);
    });
});

let creation_step = 0;
let joinStep = 0;

const containers = document.querySelectorAll(".container");
containers.forEach((container) => {
    container.addEventListener("click", () => {
        containers.forEach((c) => c.classList.remove("active"));
        container.classList.add("active");
        if (container.id !== "step") {
            creation_step = 0;
            document.querySelector(".left").style.display = "none";
            document.querySelector(".left_next").style.display = "none";
            document.getElementById("arrow-next").style.display = "none";
            document.getElementById("arrow-left").style.display = "none";
            document.getElementById("tournament__svg").style.display = "none";
            document.querySelector(".tournament__p_create").style.display ="none";
        } else {
            if (creation_step !== 1)
                document.getElementById("arrow-next").style.display = "flex";
                document.getElementById("tournament__svg").style.display = "flex";
                document.querySelector(".tournament__p_create").style.display = "flex";
        }
        if (container.id !== "joinStep") {
            document.querySelector(".top").style.display = "none";
            document.querySelector(".top_public").style.display = "none";
            document.querySelector(".info").style.display = "none";
            document.getElementById("arrow-nextJoin").style.display = "none"
            document.getElementById("arrow-leftJoin").style.display = "none"
        } else if (container.id === "joinStep") {
            if (joinStep == 1) {
                document.getElementById("arrow-leftJoin").style.display = "flex";
                document.querySelector(".top_public").style.display = "flex";
            } else {
                document.querySelector(".top").style.display = "flex";
                document.getElementById("arrow-nextJoin").style.display = "flex";
                document.querySelector(".info").style.display = "flex";
            }
        }
    });
});

const arrow = document.getElementById("arrow-next");
const arrow_left = document.getElementById("arrow-left");
if (arrow) {
    arrow.addEventListener("click", () => {
        if (creation_step === 0) {
            document.getElementById("tournament__svg").style.display = "none";
            document.querySelector(".tournament__p_create").style.display = "none";
            document.querySelector(".left").style.display = "flex";
            creation_step = 1;
        } else if (creation_step === 1) {
            document.querySelector(".left").style.display = "none";
            document.getElementById("arrow-next").style.display = "none";
            document.querySelector(".left_next").style.display = "flex";
            document.querySelector("#arrow-left").style.display = 'block';
        }
    });
}
if (arrow_left) {
    arrow_left.addEventListener("click", () => {
        document.getElementById("tournament__svg").style.display = "none";
        document.querySelector(".tournament__p_create").style.display = "none";
        document.querySelector(".left").style.display = "flex";
        document.getElementById("arrow-next").style.display = "flex";
        document.getElementById("arrow-left").style.display = "none";
        document.querySelector(".left_next").style.display = "none";
        creation_step = 1;
    });
}

let tournamentsHistory;

async function getAllTournamentAdress() {
    const csrfToken = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/tournament/getAllTournamentAddress",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
        })
        .then((res) => res.json())
        .then((data) => {
            tournamentsHistory = data;
        })
}

function createHistoryGameElement(id, tournament) {
    let historyElement = document.createElement('li');
        historyElement.innerHTML = `
            <img src="/static/assets/tourney/battle.png" alt="">
            <div class="tournament__name" id="${id}">
                <a href="https://sepolia.etherscan.io/address/${tournament.contractAddress}/" target=”_blank” style="text-decoration: none;">
                    <span>${tournament.tournament_name}</span>
                    <i class='bx bx-link-external'></i>
                </a>
            </div>
            <div class="tournament__winner" id="${id}">
                <span>${tournament.winner}</span>
                <img src="/static/assets/settings/trophy-tournament.svg">
            </div>
            <div class="tournament__hash">
                <img src="/static/assets/tourney/ether.svg" alt="">
                <span>${tournament.contractAddress}</span>
            </div>
        `;
    return historyElement;
}

async function historySetUp() {
    await getAllTournamentAdress();
    let myUsername = await getUserData();
    let historyContainer = document.querySelector('#ether__tournament');
    let historyDiv = document.createElement('div');
    let id = 0;
    if (tournamentsHistory.data.length === 0) {
        return ;
    }
    document.querySelector('.no__history_ether').style.display = 'none';
    historyDiv.setAttribute('class', 'history');
    historyContainer.appendChild(historyDiv);
    tournamentsHistory.data.forEach(tournament => {
        let tournamentElement = createHistoryGameElement(id, tournament);
        tournamentElement.classList.add('hidden');
        historyDiv.insertBefore(tournamentElement, historyDiv.firstChild);
        setTimeout(() => {
            tournamentElement.classList.remove('hidden');
        }, id * 100);
        id++;
    });
}

historySetUp();

const arrowJoin = document.getElementById("arrow-nextJoin");
const arrow_leftJoin = document.getElementById("arrow-leftJoin");

if (arrowJoin) {
    arrowJoin.addEventListener("click", () => {
        if (joinStep === 0) {
            document.querySelector(".top").style.display = "none";
            document.getElementById("arrow-nextJoin").style.display = "none";
            document.querySelector(".info").style.display = "none";
            document.querySelector(".top_public").style.display = "flex";
            document.getElementById("arrow-leftJoin").style.display = "block";
            joinStep = 1;
        }
    });
}


if (arrow_leftJoin) {
    arrow_leftJoin.addEventListener("click", () => {
        document.querySelector(".top_public").style.display = "none";
        document.getElementById("arrow-leftJoin").style.display = "none";
        document.querySelector(".info").style.display = "flex";
        document.getElementById("arrow-nextJoin").style.display = "flex"
        document.querySelector(".top").style.display = "flex";
        joinStep = 0;
    });
}

let getTournamentWs = new WebSocket("wss://" + hostname + ":8000/ws/get_tournament/")
let tournaments;

getTournamentWs.onopen = () => {
    getTournamentWs.send(
        JSON.stringify({
            type: "connected",
        })
    );
};

getTournamentWs.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.message == "new tournament created") {
        let tourney = createJoinGameElement(data);
        if (document.querySelector("#history_join") == undefined || document.querySelector("#history_join").style.display !== "none") {
            if (document.querySelector(".no__history")) {
                document.querySelector(".no__history").style.display = "none";
                let container = document.querySelector(".top_public");
                let historyDiv = document.createElement('div');
                historyDiv.setAttribute('class', 'history');
                historyDiv.setAttribute('id', 'history_join');
                container.appendChild(historyDiv);
                document.querySelector("#history_join").insertBefore(tourney, historyDiv.firstChild);
            }
        } else if (document.querySelector("#history_join").style.display === "none") {
            document.querySelector(".no__history").style.display = "none";
            document.querySelector("#history_join").style.display = "flex";
            document.querySelector("#history_join").insertBefore(tourney, document.querySelector("#history_join").firstChild);
        } else {
            document.querySelector("#history_join").style.display = "flex";
            document.querySelector("#history_join").insertBefore(tourney, document.querySelector("#history_join").firstChild);
        }
    } else if (data.message == "tournament deleted") {
        if (document.querySelector("#" + data.tournament_name_to_delete))
            document.querySelector("#" + data.tournament_name_to_delete).remove();
        if (document.querySelector("#history_join").firstChild === null) {
            document.querySelector(".no__history").style.display = "flex";
            document.querySelector("#history_join").style.display = "none";
        }
    }
}

async function getTournament() {
    const csrfToken = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/tournament/get_tournaments", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
    })
        .then((res) => res.json())
        .then((data) => {
            tournaments = data;
        })
        .catch((error) => {})
}

function createJoinGameElement(tournament) {
    let historyElement = document.createElement('li');
    historyElement.setAttribute("id", tournament.tournament_name);
    historyElement.setAttribute("class",  "join");
        historyElement.innerHTML = `
            <img src="/static/assets/settings/trophy-tournament.svg" alt="">
            <div class="tournament__name" id="${tournament.tournament_name}">
                <span>${tournament.tournament_name}</span>
            </div>
            <div class="tournament__hash">
                <img src="/static/assets/tourney/ether.svg" alt="">
            </div>
        `;
    return historyElement;
}

async function setUpTournamentJoin() {
    await getTournament();
    if (tournaments.data.length !== 0) {
        document.querySelector(".no__history").style.display = "none";
        let container = document.querySelector(".top_public");
        let historyDiv = document.createElement('div');
        historyDiv.setAttribute('class', 'history');
        historyDiv.setAttribute('id', 'history_join');
        container.appendChild(historyDiv);
        tournaments.data.forEach((tournament) => {
            if (tournament.tournament_name !== undefined && tournament.status != "Finished") {
                let tourney = createJoinGameElement(tournament);
                historyDiv.insertBefore(tourney, historyDiv.firstChild);
            }
        })
    }
}

setUpTournamentJoin();
