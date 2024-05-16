import Dashboard from "./views/dashboard.js";
import Settings from "./views/settings.js";
import page404 from "./views/page404.js";
import Login from "./views/login.js";
import Register from "./views/register.js";
import forgotPassword from "./views/forgotPassword.js";
import resetPassword from "./views/resetPassword.js";
import Tournament from "./views/tournament.js";
import TournamentPlay from "./views/tournamentPlay.js";
import tournamentGame from "./views/tournamentGame.js";
import aiGame from "./views/aiGame.js";
import multiGame from "./views/multiGame.js";
import Activation from "./views/activation.js";
import { initializeI18next } from '../../locales/translatei18n.js';
import { getUserData } from "./utils/userData.js";

const hostname = window && window.location && window.location.hostname;

const pathToRegex = (path) =>
    new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "([^/]+)") + "$");

const getParams = (match) => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
        (result) => result[1]
    );

    return Object.fromEntries(
        keys.map((key, i) => {
            return [key, values[i]];
        })
    );
};

const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        {
            path: "/404",
            view: page404,
            template: "/static/templates/404.html",
            css: "/static/css/404.css",
            script: ["/static/js/404Script.js"],
        },
        {
            path: "/",
            view: Dashboard,
            template: [
                "/static/templates/dashboard.html",
                "/static/templates/nav.html",
                "/static/templates/footer.html",
            ],
            css: [
                "/static/css/dashboard.css",
                "/static/css/nav.css",
                "/static/css/footer.css",
            ],
            script: [
                "/static/js/navScript.js",
                "/static/js/footerScript.js",
                "/static/js/dashboardScript.js",
            ],
        },
        {
            path: "/login",
            view: Login,
            template: "/static/templates/login.html",
            css: "/static/css/login.css",
            script: ["/static/js/loginScript.js"],
        },
        {
            path: "/register",
            view: Register,
            template: "/static/templates/register.html",
            css: "/static/css/register.css",
            script: ["/static/js/registerScript.js"],
        },
        {
            path: "/42auth/login",
            view: Login,
            template: "/static/templates/login.html",
            css: "/static/css/login.css",
            script: ["/static/js/login.js"],
        },
        {
            path: "/42auth/register",
            view: Register,
            template: "/static/templates/register.html",
            css: "/static/css/register.css",
            script: ["/static/js/register.js"],
        },
        {
            path: "/activate",
            view: Activation,
            template: "/static/templates/activation.html",
            css: "/static/css/activation.css",
            script: ["/static/js/activationScript.js"],
        },
        {
            path: "/forgot-password", 
            view: forgotPassword,
            template: "/static/templates/forgotPassword.html",
            css: "/static/css/forgotPassword.css",
            script: ["/static/js/forgotPasswordScript.js"]
        },
        {
            path: "/reset-password", 
            view: resetPassword,
            template: "/static/templates/resetPassword.html",
            css: "/static/css/resetPassword.css",
            script: ["/static/js/resetPasswordScript.js"]
        },
        {
          path: "/settings", 
          view: Settings,
          template: ["/static/templates/settings.html", "/static/templates/nav.html", "/static/templates/footer.html"],
          css: ["/static/css/settings.css", "/static/css/nav.css", "/static/css/footer.css"],
          script: ["/static/js/settingsScript.js", "/static/js/navScript.js", "/static/js/footerScript.js"]
        },
        {
            path: "/tournament", 
            view: Tournament,
            template: ["/static/templates/tournament.html", "/static/templates/nav.html", "/static/templates/footer.html"],
            css: ["/static/css/tournament.css", "/static/css/nav.css", "/static/css/footer.css"],
            script: ["/static/js/tournamentScript.js", "/static/js/navScript.js", "/static/js/footerScript.js"]
        },
        {
            path: "/tournament/:name", 
            view: TournamentPlay,
            template: ["/static/templates/tournamentPlay.html", "/static/templates/nav.html"],
            css: ["/static/css/tournamentPlay.css", "/static/css/nav.css"],
            script: ["/static/js/tournamentPlayScript.js", "/static/js/navScript.js"]
        },
        {
            path: "/tournament/:name/:id",
            view: tournamentGame,
            template: ["/static/templates/tournamentGame.html"],
            css: ["/static/css/tournamentGame.css"],
            script: ["/static/js/tournamentGameScript.js"]
        },
        {
            path: "/ai-game", 
            view: aiGame,
            template: ["/static/templates/aiGame.html", "/static/templates/nav.html", "/static/templates/footer.html"],
            css: ["/static/css/aiGame.css", "/static/css/nav.css", "/static/css/footer.css"],
            script: ["/static/js/aiGameScript.js", "/static/js/navScript.js", "/static/js/footerScript.js"]
        },
        {
            path: "/multiplayer-game", 
            view: multiGame,
            template: ["/static/templates/multiGame.html", "/static/templates/nav.html", "/static/templates/footer.html"],
            css: ["/static/css/multiGame.css", "/static/css/nav.css", "/static/css/footer.css"],
            script: ["/static/js/navScript.js", "/static/js/footerScript.js", "/static/js/multiGameScript.js"]
        }
    ];

    const potentialMatches = routes.map((route) => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path)),
        };
    });

    let match = potentialMatches.find(
        (potentialMatch) => potentialMatch.result !== null
    );
    if (!match) {
        match = {
            route: routes[0],
            result: [location.pathname],
        };
    }
    const view = new match.route.view(getParams(match));
    view.getHtml(match.route.template);
    view.loadCSSFile(match.route.css);
    setTimeout(async () => {
        await view.executeViewScript(match.route.script);
        let lang;
        if (localStorage.getItem("language"))
            lang = localStorage.getItem("language").split("-")[1];
        if (!lang)
            lang = "fr";
        initializeI18next(lang);
    }, 300);
};

window.addEventListener("popstate", router);

export async function getCsrfToken() {
    return fetch("https://" + hostname + ":8000/authentification/get-csrf-token/", {
        method: "GET",
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
            let csrfToken = data.csrfToken;
            return csrfToken;
        })
        .catch((error) => {
        });
}

async function getCodeFromUrl() {
    const currentUrl = window.location.href;
    const array = currentUrl.split("code=");
    return array.pop();
}

async function getAuthenticationToken(page) {
    let code = await getCodeFromUrl();
    const csrfCookie = await getCsrfToken();
    return await fetch(
        "https://" + hostname + ":8000/authentification/get_auth_token_api",
        {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfCookie,
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                code: code,
                page: page,
            }),
        }
    )
        .then((response) => response.json())
        .then((tokenData) => {
            return tokenData.access_token;
        })
        .catch((error) => {
        });
}

async function loginAccount() {
    const access_token = await getAuthenticationToken("login");
    if (access_token === undefined || access_token === null) {
        return;
    }
    const csrfCookie = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/authentification/login_with_42_api/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfCookie,
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            access_token: access_token,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            return data;
        });
}

async function createAccount() {
    const access_token = await getAuthenticationToken("register");
    if (access_token === undefined || access_token === null) {
        return;
    }
    const csrfCookie = await getCsrfToken("register");
    fetch("https://" + hostname + ":8000/authentification/register_with_42_api/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfCookie,
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            access_token: access_token,
        }),
    })
        .then((response) => response.json())
        .then((tokenData) => {
            return tokenData;
        })
        .catch((error) => {
        });
}

function setLogoutFlag() {
    localStorage.setItem('logoutFlag', 'true');
}

function listenForAuthChanges() {
    window.addEventListener('storage', function(event) {
        if (event.key === 'logoutFlag') {
            if (event.newValue === 'true') {
                window.location.href = '/login';
            }
        }
    });
}

listenForAuthChanges();

async function handle42AuthLogin() {
    await loginAccount();
    setTimeout(() => {window.location.href = "/"}, 100);
}

async function handle42AuthRegister() {
    await createAccount();
    window.location.href = "/login";
}

function getInfoResetFromUrl() {
    localStorage.setItem("resetUrl", window.location.href);
}

async function handleResetPassword() {
    getInfoResetFromUrl();
    window.location.href = "/reset-password";
};

function handleActivateAccount() {
    localStorage.setItem("activateUrl", window.location.href);
    window.location.href = "/activate";
}

document.addEventListener("DOMContentLoaded", async () => {
    if (location.pathname === "/42auth/login")
        handle42AuthLogin();
    if (location.pathname === "/42auth/register")
        handle42AuthRegister();
    if (location.pathname.includes("/reset-password") && location.pathname !== "/reset-password")
        handleResetPassword();
    if (location.pathname.includes("/activate") && location.pathname !== "/activate") {
        handleActivateAccount();
    }
    const userData = await getUserData();
    if (userData.errors === "User is not login" 
        && location.pathname !== "/login" 
        && location.pathname !== "/register"
        && location.pathname !== "/forgot-password"
        && location.pathname !== "/reset-password"
        && location.pathname !== "/activate")
            navigateTo("/login"); 
    let currentRoute = null;
    if (userData.status === "success" && location.pathname === "/login") {
        navigateTo("/");
        return;
    }
    document.body.addEventListener("click", (e) => {
        if (e.target.matches("[data-link]")) {
            currentRoute = e.target.href;
            e.preventDefault();
            if (targetRoute !== currentRoute) {
                navigateTo(e.target.href);
                currentRoute = targetRoute;
            }
        }
    });
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", router);
    } else {
        router();
    }
});
