const hostname = window && window.location && window.location.hostname;

let user = {
    name: "",
    mail: "",
    password: ""
};

function isValidName(name) {
    if (name == "") {
        return false;
    }
    return true;
}

const inputName = document.getElementById('name');
const iconCheck = document.getElementById('nIcon');
let nameUser = "";

inputName.addEventListener('input', (event) => {
    const nameError = document.getElementById('nameError');
    nameUser = event.target.value;
    nameError.style.display = 'none';
    iconCheck.style.display = 'block';
    user.name = nameUser;
});

function isValidMail(mail) {
    var lastAtPos = mail.lastIndexOf('@');
    var lastDotPos = mail.lastIndexOf('.');
    return (lastAtPos < lastDotPos && lastAtPos > 0 && mail.indexOf('@@') == -1 && lastDotPos > 2 && (mail.length - lastDotPos) > 2);
};


const inputMail = document.getElementById('email');
const iconCheckMail = document.getElementById('mIcon');
let userMailInput = "";

inputMail.addEventListener('input', (event) => {
    const userMail = document.getElementById('mailForm');
    userMailInput = event.target.value;
    if (!isValidMail(userMailInput)) {
        iconCheckMail.style.display = 'none';
        userMail.style.display = 'block';
    }
    else {
        userMail.style.display = 'none';
        iconCheckMail.style.display = 'block';
    }
    user.mail = userMailInput;
});

function isValidPassword (password) {
    if (password.length < 8) {
        return false;
    }
    if (password.search(/[A-Z]/) == -1) return false;
    if (password.search(/[0-9]/) == -1) return false;
    return true;
}

const inputPass = document.getElementById('password');
const iconCheckPass = document.getElementById('pIcon');
let userPassword = "";

inputPass.addEventListener('input', (event) => {
    const userPassError = document.getElementById("passError");
    userPassword = event.target.value;
    if (!isValidPassword(userPassword)) {
        iconCheckPass.style.display = 'none';
        userPassError.style.display = 'block';
    }
    else {
        userPassError.style.display = 'none';
        iconCheckPass.style.display = 'block';
    }
    user.password = userPassword;
    if (user.password !== passCheck.value && passCheck.value !== "") {
        iconPassCheck.style.display = 'none';
        nameError.style.display = 'block';
    }
    else if (user.password === passCheck.value && passCheck.value !== "") {
        nameError.style.display = 'none';
        iconPassCheck.style.display = 'block';
    }
});

const passCheck = document.getElementById('passwordCheck');
const iconPassCheck = document.getElementById('pIconCheck');
const nameError = document.getElementById('passNotMatch');

passCheck.addEventListener('input', (event) => {
    if (event.target.value != user.password) {
        iconPassCheck.style.display = 'none';
        nameError.style.display = 'block';
    }
    else {
        nameError.style.display = 'none';
        iconPassCheck.style.display = 'block';
    }
});

const formButton = document.getElementById('formButtonMain');

formButton.addEventListener('mouseover', (event) => {
    if (isValidName(nameUser) && isValidMail(userMailInput) && isValidPassword(userPassword)) {
        formButton.classList.add("formButtonMainValid");
    }
});

formButton.addEventListener('mouseout', (event) => {
    if (!isValidName(nameUser) || isValidMail(userMailInput) || isValidPassword(userPassword)) {
        formButton.classList.remove("formButtonMainValid");
    }
});

const form = document.getElementById('formRegister');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isValidName(nameUser) && isValidMail(userMailInput) && isValidPassword(userPassword)) {
        register();
    }
});

function isValidPasswordConnexion(password) {
    if (password.length < 8) {
        return false;
    }
    if (password.search(/[A-Z]/) == -1) return false;
    if (password.search(/[0-9]/) == -1) return false;
    return true;
};


const loginRedirect = document.querySelector('.secondaryButton');

loginRedirect.addEventListener('click', () => {
    window.location.href = "/login";
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

async function register() {
    const username = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password1 = document.getElementById("password").value;
    const password2 = document.getElementById("passwordCheck").value;

    const userData = {
        username: username,
        email: email,
        password1: password1,
        password2: password2,
    };

    const csrfToken = await getCsrfToken();

    await fetch("https://" + hostname + ":8000/authentification/register/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
            userData,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                window.location.href = "/login";
            }
            if (data.errors) {
                const errorElement = document.getElementById("error");
                errorElement.innerHTML = data.errors;
                errorElement.style.display = "flex";
            }
            else if (data.form_errors) {
                const errorElement = document.getElementById("error");
                if (data.form_errors.password2 || data.form_errors.password1) {
                    errorElement.innerHTML = "Invalid password";
                    errorElement.style.display = "flex";
                } else if (data.form_errors.email || data.form_errors.username) {
                    errorElement.innerHTML = "Invalid email or username";
                    errorElement.style.display = "flex";
                }
            }
        })
        .catch((error) => {
        });
}

function getAuthorizationCode() {
    const authorizationUrl =
        "https://api.intra.42.fr/oauth/authorize";
    const clientId = "u-s4t2ud-2eb7a58d446ca29b150cc2840610be46c0af8353337ee8df58d31ada274426b4";
    const redirectUri = encodeURIComponent("https://" + hostname + ":8443/42auth/register");
    const responseType = "code";
    const url = `${authorizationUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}`;
    window.location.href = url;
}

document.getElementById("formButtonSecond42").addEventListener("click", (event) => {
    getAuthorizationCode();
});
