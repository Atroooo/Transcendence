const hostname = window && window.location && window.location.hostname;
const formElementLogin = document.getElementById('formLogin');

formElementLogin.addEventListener('submit', async (event) => {
    event.preventDefault();
    login();
});

const secondaryButton = document.querySelector('.secondaryButton');

secondaryButton.addEventListener('click', () => {
    window.location.href = "/register";
});

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
            throw error;
        });
}

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
            userData = data.user_data;
            return userData;
        })
        .catch((error) => {
        });
}

async function login() {
    const username = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    const csrfToken = await getCsrfToken();

    await fetch("https://" + hostname + ":8000/authentification/login/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                window.location.href = "/";
            }
            if (data.errors) {
                const errorElement = document.getElementById("error");
                errorElement.innerHTML = data.errors;
                errorElement.style.display = "flex";
            }
        })
        .catch((error) => {
        });
}

function getAuthorizationCode() {
    const authorizationUrl =
        "https://api.intra.42.fr/oauth/authorize";
    const clientId =
        "u-s4t2ud-2eb7a58d446ca29b150cc2840610be46c0af8353337ee8df58d31ada274426b4";
    const redirectUri = encodeURIComponent("https://" + hostname + ":8443/42auth/login");
    const responseType = "code";
    const url = `${authorizationUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}`;
    window.location.href = url;
}

document.getElementById("formButtonSecond42").addEventListener("click", (event) => {
    getAuthorizationCode();
});
