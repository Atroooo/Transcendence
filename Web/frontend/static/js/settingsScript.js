import { getCsrfToken } from "./index.js"

const hostname = window && window.location && window.location.hostname;

let tournamentStat;

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

function disappear() {
    document.querySelector('.notify').style.opacity = '0';
}

async function initializeSettingsPage() {
    try {
        const user_data = await getUserData();
        const settingsDisplayPicture = document.getElementById("profilePicture");
        settingsDisplayPicture.setAttribute("src", user_data.user_data["profile_picture"]);
        var settingsUsername = document.getElementById("name");
        settingsUsername.value = user_data.user_data["username"];
        var settingsEmail = document.getElementById("email");
        settingsEmail.value = user_data.user_data["email"];
        var bioUser = document.getElementById("bio");
        if (user_data.user_data["bio"] != "")
            bioUser.value = user_data.user_data["bio"];
        else
            bioUser.placeholder = i18next.t("placeholder.bio");
    } catch (error) {
    }
}

initializeSettingsPage();

const img = document.querySelectorAll('#profilePicture');
const file = document.getElementById('file-user__input');

file.addEventListener('change', function () {
    const choseFile = this.files[0];
    if (choseFile) {
        const pos = choseFile.name.lastIndexOf('.');
        const ext = choseFile.name.substring(pos + 1);
        if ((ext == 'jpg' || ext == 'jpeg' || ext == 'png') && choseFile.size < 1000000) {
            const reader = new FileReader();
            reader.addEventListener('load', function () {
                for (let i = 0; i < img.length; i++) {
                    img[i].setAttribute('src', reader.result);
                }
            });
            reader.readAsDataURL(choseFile);
            update_profile_picture(choseFile.name);
        }
    }
});
 
async function updateBio(bioValue) {
    const bio = document.getElementById("bio").value.trim();
    const csrfCookie = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/authentification/update_bio/",
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ bio: bio }),
        }
    )
    .then((response) => response.json())
    .then((tokenData) => {
        return tokenData;
    })
    .catch((error) => {
    });
};

document.getElementById("bio").addEventListener("input", function(event) {
    updateBio();
});

let username = "";

async function updateUsername() {
    if (username == "")
        return ;
    const csrfCookie = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/authentification/update_name/",
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: username }),
        }
    )
    .then((response) => response.json())
    .then((tokenData) => {
        if (tokenData.errors === "username already exist")
            document.querySelector('.uniqueUsername').style.display = "block";
        else {
            document.getElementById("name").textContent = username;
            document.querySelector('.uniqueUsername').style.display = "none";
            document.getElementById("name").style.backgroundColor = "var(--intense-green)";
            setTimeout(() => {document.getElementById("name").style.backgroundColor = "white"}, 1000);
        }
        return tokenData;
    })
    .catch((error) => {
    });
};

let email = "";

document.getElementById("email").addEventListener("input", async function(event) {
    if (event.target.value)
        email = event.target.value;
});


document.getElementById("name").addEventListener("input", async function(event) {
    if (event.target.value)
        username = event.target.value;
});

document.getElementById("validate_name").addEventListener("click", async () => {
    await updateUsername();
});


document.getElementById("validate_email").addEventListener("click", async () => {
    await updateEmail();
});

async function updateEmail() {
    const bio = document.getElementById("bio").value.trim();
    const csrfCookie = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/authentification/update_email/",
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email }),
        }
    )
    .then((response) => response.json())
    .then((tokenData) => {
        if (tokenData.errors) {
            document.getElementById("email").style.backgroundColor = "var(--intense-red)";
            setTimeout(() => {document.getElementById("email").style.backgroundColor = "white"}, 1000);
        } else {
            document.getElementById("email").style.backgroundColor = "var(--intense-green)";
            setTimeout(() => {document.getElementById("email").style.backgroundColor = "white"}, 1000);
        }

        return tokenData;
    })
    .catch((error) => {
    });
};


async function update_profile_picture(preloadedFile) {
    const csrfCookie = await getCsrfToken();
    const fileInput = document.getElementById('file-user__input');
    const formData = new FormData();
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }
    else if (preloadedFile) {
        const response = await fetch(preloadedFile);
        const blobData = await response.blob();
        formData.append('image', blobData, preloadedFile.split("/").pop());
    }
    await fetch(
        "https://" + hostname + ":8000/authentification/update_profile_picture/",
        {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfCookie,
            },
            body: formData,
        }
    )
    .then((response) => response.json())
    .then((tokenData) => {
        window.location.reload();
        return tokenData;
    })
    .catch((error) => {
    });
};

document.getElementById("file-user__input").addEventListener("change", function() {
   update_profile_picture();
});

let allMatchesStats = [];

async function getAllMatch() {
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/game/getAllMatch/",
        {    
            method: "GET",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfToken,
            }
        }
    )
    .then((response) => response.json())
    .then((data) => {
        allMatchesStats = data;
    })
}

async function getTournamentStat() {
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/getTournamentStat",
        {
            method: "GET",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfToken,
            }
        }
    )
    .then((response) => response.json())
    .then((data) => {
        tournamentStat = data;
    })
    .catch((error) => {});
}

function createHistoryGameElement(id) {
    let historyElement = document.createElement('li');
        historyElement.setAttribute("class", "game");
        historyElement.innerHTML = `
            <div class="date">
                <img src="/static/assets/settings/history.svg" alt="">
                <span class="tournament__date"></span>
            </div>
            <div class="players">
                <span class="players__name" id="game${id}player1"></span>
                <div class="history__score" id="game${id}score"></div>
                <span class="players__name" id="game${id}player2"></span>
                <div class="progress_bar">
                </div>
            </div>
            <div class="result" id="game${id}result"></div>`;
    return historyElement;
}

function putScoresPlayersWinInElement(game, id, myUsername) {
    let dateSplit = game.date.split('-');
    let date = dateSplit[1] + "-" + dateSplit[2].split('T')[0];
    document.getElementById("game" + id + "player1").textContent =`${game.first_user.username}`;
    document.getElementById("game" + id + "player2").textContent = `${game.second_user.username}`;
    document.querySelector(".tournament__date").textContent = `${date}`
    let score = game.first_player_point + " : " + game.second_player_point;
    document.getElementById("game" + id + "score").textContent = score;
    let result = document.getElementById("game" + id + "result");
    if (myUsername.user_data.username === game.victory_user.username) {
        result.style.backgroundColor = 'var(--intense-green)';
        winStreakCounter++;
        wins++;
    }
    else {
        result.style.backgroundColor = 'var(--intense-red)';
        winStreakCounter = 0;
    }
}

function getPointsScored(game, myUsername) {
    if (game.first_user.username === myUsername.user_data.username) {
        pointsScored += game.first_player_point;
        pointConceded += game.second_player_point;
    }
    else {
        pointsScored += game.second_player_point;
        pointConceded += game.first_player_point;
    }
}

function getOpponent(myUsername, game) {
    let isFirstUser = false;
    if (myUsername.user_data.username === game.first_user.username)
            isFirstUser = true;
    return isFirstUser;
}

let opponentsTab = [];
function fillOponentTab(isFirstUser, game, id) {
    if (isFirstUser) {
        opponentsTab.push(game.second_user.username);
    }
    else {
        opponentsTab.push(game.first_user.username);
    }
}

let winTab = [];

function fillWinTab(game, myUsername, opponent) {
    if (game.victory_user.username === myUsername.user_data.username)
        winTab.push(opponent);
}

function getMaxOccurenceOfArray(arr) {
    const counts = {};
    for (let value of arr) { 
        counts[value] = (counts[value] || 0) + 1; 
    }
    const maxCount =
        Math.max(...Object.values(counts)); 
    const mostFrequent =  
        Object.keys(counts).find(key =>  
            counts[key] === maxCount);
    return mostFrequent;
}

let winStreakCounter = 0;
let wins = 0;
let gamesPlayed = 0;
let pointsScored = 0;
let pointConceded = 0;
let gameLength = 0;
let scoringTimesTab = [];
let scatterChart;

let scoreTime = [
    {
        "p1": [4500, 8000, 12000, 25000, 35000],
        "p2": [4700, 9500, 12000, 23000]
    }
]

function getRatio(scoreTiming, gameLength) {
    if (scoreTiming > gameLength)
        scoreTiming === gameLength;
    return (scoreTiming * 100) / gameLength;
}

function createyouScore(ratio) {
    let youScore = document.createElement("img");
    youScore.setAttribute("src", "/static/assets/pong/ball_you.svg");
    if (ratio >= 95)
        ratio = 93;
    youScore.style.left = ratio + "%";
    return youScore;
}

function createoppScore(ratio) {
    let youScore = document.createElement("img");
    youScore.setAttribute("src", "/static/assets/pong/ball_enemy.svg");
    if (ratio >= 95)
        ratio = 93;
    youScore.style.left = ratio + "%";
    return youScore;
}

function gameProgressBar(isFirstUser, gameLength, scoreTimeP1, scoreTimeP2) {
    let progressBar = document.querySelector('.progress_bar');
    if (progressBar === undefined)
        return;
    let winTrophy = document.createElement("img");
    winTrophy.setAttribute("src", "/static/assets/pong/win.svg");
    winTrophy.style.left = "95%";

    let youScore = document.createElement("img");
    youScore.setAttribute("src", "/static/assets/pong/ball_you.svg");
    let oppScore = document.createElement("img");
    oppScore.setAttribute("src", "/static/assets/pong/ball_enemy.svg");

    let ratio;
    if (isFirstUser == true) {
        if (scoreTimeP1.length === 5) {
            for (let i = 0; i < scoreTimeP1.length - 1; i++) {
                scoringTimesTab += parseInt(scoreTimeP1[i].scoreTime).toFixed(2) + ',';
                ratio = getRatio(scoreTimeP1[i].scoreTime, gameLength);
                if (ratio <= 95) {
                    let newScore = createyouScore(ratio);
                    progressBar.appendChild(newScore);
                }
            }
            scoringTimesTab += parseInt(scoreTimeP1[scoreTimeP1.length - 1].scoreTime).toFixed(2) + ',';
            for (let i = 0; i < scoreTimeP2.length; i++) {
                ratio = getRatio(scoreTimeP2[i].scoreTime, gameLength);
                if (ratio >= 95)
                    ratio = 90;
                let newScore = createoppScore(ratio);
                progressBar.appendChild(newScore);
            }
            progressBar.appendChild(winTrophy);
        } else {
            for (let i = 0; i < scoreTimeP1.length; i++) {
                scoringTimesTab += parseInt(scoreTimeP1[i].scoreTime).toFixed(2)  + ',';
                ratio = getRatio(scoreTimeP1[i].scoreTime, gameLength);
                let newScore = createyouScore(ratio);
                if (ratio >= 95)
                    ratio = 90;
                progressBar.appendChild(newScore);
            }
            for (let i = 0; i <  scoreTimeP2.length; i++) {
                ratio = getRatio(scoreTimeP2[i].scoreTime, gameLength);
                if (ratio >= 98)
                    ratio = 95;
                let newScore = createoppScore(ratio);
                progressBar.appendChild(newScore);
            }
        }
    } else {
        if (scoreTimeP2.length === 5) {
            for (let i = 0; i < scoreTimeP2.length - 1; i++) {
                scoringTimesTab += parseInt(scoreTimeP2[i].scoreTime).toFixed(2)  + ',';
                ratio = getRatio(scoreTimeP2[i].scoreTime, gameLength);
                if (ratio <= 95) {
                    let newScore = createyouScore(ratio);
                    progressBar.appendChild(newScore);
                }
            }
            scoringTimesTab += parseInt(scoreTimeP2[scoreTimeP2.length - 1].scoreTime).toFixed(2)  + ',';
            for (let i = 0; i < scoreTimeP1.length; i++) {
                ratio = getRatio(scoreTimeP1[i].scoreTime, gameLength);
                if (ratio >= 100)
                    ratio = 95;
                let newScore = createoppScore(ratio);
                progressBar.appendChild(newScore);
            }
            progressBar.appendChild(winTrophy);
        } else {
            for (let i = 0; i < scoreTimeP2.length; i++) {
                scoringTimesTab += parseInt(scoreTimeP2[i].scoreTime).toFixed(2)  + ',';
                ratio = getRatio(scoreTimeP2[i].scoreTime, gameLength);
                if (ratio >= 95)
                    ratio = 90;
                let newScore = createyouScore(ratio);
                progressBar.appendChild(newScore);
            }
            for (let i = 0; i < scoreTimeP1.length; i++) {
                ratio = getRatio(scoreTimeP1[i].scoreTime, gameLength);
                let newScore = createoppScore(ratio);
                if (ratio >= 98)
                    ratio = 95;
                progressBar.appendChild(newScore);
            }
        }
    }
}

function checkAllGamesTournament(matchs) {
    let count = 0;
    matchs.matches.forEach(game => {
        if (game.tournament)
            count++;
    });
    if (count == matchs.length)
        return true
    return false
}

async function historySetUp(matchStat) {
    let myUsername = await getUserData();
    let historyContainer = document.querySelector('.history');
    let id = 0;
    if (!matchStat.matches || checkAllGamesTournament(matchStat)) {
        document.querySelector(".no__history").style.display = "flex";    
        document.getElementById("most__win").textContent = "...";
        document.getElementById("most__played").textContent = "...";
        return ;
    }
    gamesPlayed = matchStat.matches.length;
    matchStat.matches.forEach(game => {
        if (game.tournament == null) {
            let isFirstUser = getOpponent(myUsername, game);
            fillOponentTab(isFirstUser, game, id);
            fillWinTab(game, myUsername, opponentsTab[id]);
            let historyElement = createHistoryGameElement(id);
            historyElement.classList.add('hidden');
            historyContainer.insertBefore(historyElement, historyContainer.firstChild);
            putScoresPlayersWinInElement(game, id, myUsername);
            getPointsScored(game, myUsername);
            setTimeout(() => {
                historyElement.classList.remove('hidden');
            }, id * 100);
            id++;
            gameProgressBar(isFirstUser, game.game_length, game.score_time_p1, game.score_time_p2);
            gameLength += game.game_length;
        }
    });
    scatterPlotData();
    let mostFrequent = getMaxOccurenceOfArray(opponentsTab);
    if (mostFrequent === "")
        mostFrequent = "...";
    document.getElementById("most__played").textContent = mostFrequent;
    let mostWin = getMaxOccurenceOfArray(winTab);
    if (mostWin === "" || mostWin === undefined)
        mostWin = "...";
    document.getElementById("most__win").textContent = mostWin;
}

function getWinRate() {
    if (gamesPlayed !== 0) {
        const winRate = (wins / gamesPlayed) * 100;
        return Math.round(winRate * 100) / 100;
    } else {
        return 0;
    }
}

let offense = 0;
let defense = 0;
let efficiency = 0;

function calculateEfficiency(secondsPlayed) {
    if (secondsPlayed === 0) {
        return 0;
    }
    const averageSecondsPerGoal = secondsPlayed / pointsScored;
    const maxSecondsPerGoal = 50;
    const minSecondsPerGoal = 10;

    let normalizedScore;

    if (averageSecondsPerGoal <= minSecondsPerGoal) {
        normalizedScore = 10;
    } else if (averageSecondsPerGoal >= maxSecondsPerGoal) {
        normalizedScore = 0;
    } else {
        normalizedScore = 10 - ((averageSecondsPerGoal - minSecondsPerGoal) / (maxSecondsPerGoal - minSecondsPerGoal)) * 10;
    }
    return normalizedScore;
}

async function setUpStats() {
    await getAllMatch();
    for (const key in allMatchesStats) {
        if (Array.isArray(allMatchesStats[key])) {
            allMatchesStats[key] = allMatchesStats[key].filter(match => match.victory_user !== null
                                                                        && match.first_user !== null
                                                                        && match.second_user !== null
                                                                        && match.game_length !== null);
        }
    }
    await historySetUp(allMatchesStats);
    await getTournamentStat();
    let winRate = getWinRate();
    drawCircle(winRate);
    document.getElementById("games__count").style.setProperty('--to', gamesPlayed);
    document.getElementById("winStreak__count").style.setProperty('--to', winStreakCounter);
    document.getElementById("points__scored").style.setProperty('--to', pointsScored);
    offense = (pointsScored / gamesPlayed) * 2;
    defense = (pointConceded / gamesPlayed) * 2;
    defense = Math.abs(10 - defense);
    if (winStreakCounter > 10)
        winStreakCounter = 10;
    let tournamentWin = tournamentStat.win;
    let tournament = (tournamentWin / tournamentStat.participation) * 10;
    document.getElementById("tournament_won").style.setProperty('--to', tournamentWin);
    efficiency = calculateEfficiency(gameLength);
    var ctxPolar = document.getElementById('charts__polar_radar');
    var radarChart = new Chart(ctxPolar, {
        type: 'radar',
        data: {
            labels:  label,
            datasets: [{
                label: 'Player Performance',
                data: [offense, defense, efficiency, winStreakCounter, tournament],
                backgroundColor: '#4299e1',
                borderColor: '#2b6cb0',
                pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                pointBorderColor: '#2b6cb0',
                pointHoverBackgroundColor: '#fff',
                borderWidth: 2,
            }]
        },
        options: chartOptions
    });
}

function drawCircle(percent) {
    const svg = document.getElementById('progress-circle');
    const radius = 50; // Adjust radius as needed
    const circumference = 2 * Math.PI * radius;

    const backgroundCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    backgroundCircle.setAttribute("cx", "100");
    backgroundCircle.setAttribute("cy", "100");
    backgroundCircle.setAttribute("r", radius);
    backgroundCircle.setAttribute("fill", "transparent");
    backgroundCircle.setAttribute("stroke", "lightgray");
    backgroundCircle.setAttribute("stroke-width", "20");

    // Draw the progress circle
    const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progressCircle.setAttribute("cx", "100");
    progressCircle.setAttribute("cy", "100");
    progressCircle.setAttribute("r", radius);
    progressCircle.setAttribute("fill", "transparent");
    progressCircle.setAttribute("stroke", "var(--intense-green)");
    progressCircle.setAttribute("stroke-width", "20");
    progressCircle.setAttribute("stroke-dasharray", circumference);
    progressCircle.setAttribute("stroke-dashoffset", circumference - (percent / 100) * circumference);

    svg.appendChild(backgroundCircle);
    svg.appendChild(progressCircle);

    const percentage = document.createElementNS("http://www.w3.org/2000/svg", "text");
    percentage.setAttribute("x", "100");
    percentage.setAttribute("y", "100");
    percentage.setAttribute("text-anchor", "middle");
    percentage.setAttribute("dominant-baseline", "central");
    percentage.setAttribute("font-size", "20");
    percentage.setAttribute("fill", "white");
    percentage.textContent = `${percent}%`;
    svg.appendChild(percentage);
}

setUpStats();

function computeDataScoringEfficiency() {
    let dataObj = [];
    if (scoringTimesTab.length > 0) {
        dataObj = scoringTimesTab.split(',');
        
        const counts = {};
        for (let value of dataObj) { 
            counts[value] = (counts[value] || 0) + 1; 
        }
        const result = Object.entries(counts)
            .filter(([key, _]) => key !== "")
            .map(([x, y]) => ({ x: parseInt(x), y }));
        return result;
    }
    return 0;
}

function scatterPlotData() {
    if (scatterChart) {
        scatterChart.destroy();
    }

    let dataTrad;
    if (localStorage.getItem('language'))
        dataTrad = localStorage.getItem('language').split('-')[1];
    else
        dataTrad = 'fr';
    let xTitle = "";
    let yTitle = "";
    let title

    if (dataTrad === 'es') {
        xTitle = "Hora de puntuar (ss)";
        yTitle = "Puntos obtenidos contra el cronometraje";
        title = "Rendimiento goleador";
    }
    else if (dataTrad === 'fr') {
        xTitle = "Délai de réalisation du score (ss)";
        yTitle = "Performance de but selon le temps";
        title = "Analyse offensive";
    }
    else {
        xTitle = "Time of Scoring (ss)";
        yTitle = "Points Scored against Timing";
        title = "Scoring Performance";
    }
    let dataObj = computeDataScoringEfficiency();
    const data = {
        datasets: [{
            label: 'Scatter Dataset',
            data: dataObj,
            backgroundColor: 'rgba(255, 99, 132, 1)',
            borderColor: 'rgb(255, 99, 132)',
        }]
    };

    const config = {
        type: 'scatter',
        data: data,
        options: {
            plugins: {
                title: {
                    display: true,
                    align: "center",
                    text: title,
                    color: "white"
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    time: {
                        parser: 'ss',
                        tooltipFormat: 'ss',
                    },
                    title: {
                        display: true,
                        text: xTitle,
                        color: "white"
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yTitle,
                        color: "white"
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)',
                    }
                }
            }
        }
    };
    scatterChart = new Chart(
        document.getElementById('charts__scatterChart'),
        config
    );
}

let dataTrad;
if (localStorage.getItem('language'))
    dataTrad = localStorage.getItem('language').split('-')[1];
else
    dataTrad = 'fr';
let label = [];
let perfTitle = "";

if (dataTrad === 'es') {
    label = ["Ataque", "Defensa", "Eficacia", "Racha de victorias", "Torneo%"];
    perfTitle = "Rendimiento del jugador";
}
else if (dataTrad === 'fr') {
    label = ['Attaque', 'Defense', 'Efficacite', 'Serie de Victore', 'Tournoi%'];
    perfTitle = "Performance du joueur";
}
else {
    label = ['Offense', 'Defense', 'Efficiency', 'Win Streak', 'Tournament%'];
    perfTitle = "Player Performance";
}

var chartOptions = {
    plugins: {
        title: {
            display: true,
            align: "center",
            text: perfTitle,
            color: "white"
        },
        legend: {
            display: false
        }
    },
    scales: {
        r: {
            pointLabels: {
                font: {
                    size: 10,
                    color: "white"
                }
            },
            grid: {
                color: "white",
            },
            angleLines: {
                color: "white",
            },
            ticks: {
                display: false,
            },
            min: 0,
            max: 10,
        }
    }
};
