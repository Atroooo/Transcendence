import { getCsrfToken } from "../index.js";

const hostname = window && window.location && window.location.hostname;

export async function get_tournament_matchs() {
    const csrfToken = await getCsrfToken();
    return fetch("https://" + hostname + ":8000/tournament/get_tournament_matchs", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        credentials: "include",
    });
}

export async function matchHistory() {
    try {
        const response = await get_tournament_matchs();
        if (!response.ok) {
            return null
        }
        const data = await response.json();
        return data;
    } catch (error) {
    }
}

export async function next_bracket() {
    const csrfToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/tournament/next_bracket", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
            return data;
        })
        .catch((error) => {
        });
}

export async function nextBracket() {
    return await next_bracket();
}