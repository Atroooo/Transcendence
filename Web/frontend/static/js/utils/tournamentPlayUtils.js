import { getCsrfToken } from "../index.js";
import { getUserData } from "../utils/userData.js"
import { leaveTournament } from "../tournamentPlayScript.js"
import { initializeI18next } from "../../../locales/translatei18n.js";

const hostname = window && window.location && window.location.hostname;

export async function ready() {
    const csrfToken = getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/tournament/ready", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
    }) 
    .then((res) => res.json())
    .then((data) => {
        if (data.status !== "not everyone is ready") {
            document.querySelector(".tournament__announce").style.display = "none";
        }
    })
    .catch((err) => {});
}

export function waitingPopUp() {
    document.querySelector(".tournament__announce").style.display = "flex";
    document.querySelector(".tournament__announce").innerHTML = `
        <h2 class="tournament__announce_title">Waiting for the other players to finish</h2>
        <img class="tournament__announce_img" src="../../static/assets/tourney/wait.svg" alt="arrow">
    `;
    setTimeout(() => {
        document.querySelector(".tournament__announce").style.display = "none";
    }, 5000);
}

export function winPopUp() {
    document.querySelector(".tournament__announce").style.display = "flex";
    document.querySelector(".tournament__announce").innerHTML = `
        <h2 class="tournament__announce_title_win" data-i18n="tournament__win"></h2>
        <img class="tournament__announce_img" src="/static/assets/settings/trophy-tournament.svg" alt="arrow">
    `;
    let dataTrad = "";
    if (localStorage.getItem('language'))
        dataTrad = localStorage.getItem('language').split('-')[1];
    else
        dataTrad = 'fr';
    initializeI18next(dataTrad);
    setTimeout(() => {
        document.querySelector(".tournament__announce").style.display = "none";
    }, 8000);
}

export function announceGame() {
    setTimeout(() => {
            document.querySelector(".tournament__announce").style.display = "flex";
            document.querySelector(".tournament__announce").innerHTML = `
                <h2 class="tournament__announce_title">Get Ready!</h2>
                <img class="tournament__announce_img" src="../../static/assets/tourney/announce.svg" alt="arrow">
                <div class="countdown"> 5 </div>
            `;
            let countdown = 5;
            let interval = setInterval(() => {
                countdown--;
                document.querySelector(".countdown").innerHTML = countdown;
                if (countdown === 0) {
                    clearInterval(interval);
                    document.querySelector(".tournament__announce").style.display = "none";
                }
            }
            , 1000);
        }, 1000);
}

export async function readyStatus() {
    setTimeout(async () => {
            document.querySelector(".tournament__announce").innerHTML = `
                <h2 data-i18n="ready__title" class="tournament__announce_title"></h2>
                <img class="tournament__announce_img" src="/static/assets/tourney/announce.svg" alt="arrow">
                <button data-i18n="ready__button" class="tournament__start_admin" id="ready__button"></button>
                <div class="countdown"> 30 </div>
            `;
            document.querySelector(".tournament__announce").style.display = "flex";
            let countdown = 30;
            let interval = setInterval(async () => {
                countdown--;
                document.querySelector(".countdown").innerHTML = countdown;
                if (countdown === 0) {
                    clearInterval(interval);
                    document.querySelector(".tournament__announce").style.display = "none";
                }
            }
        , 1000);
        let dataTrad = "";
        if (localStorage.getItem('language'))
            dataTrad = localStorage.getItem('language').split('-')[1];
        else
            dataTrad = 'fr';
        initializeI18next(dataTrad);
        if (document.querySelector("#ready__button")) {
            document.querySelector("#ready__button").addEventListener('click', async () => {
                await ready();
                document.querySelector("#ready__button").style.display = "none";
                countdown = -1;
            })
        }
    }, 1000);
    setTimeout(async () => {await ready()}, 35000);
}
