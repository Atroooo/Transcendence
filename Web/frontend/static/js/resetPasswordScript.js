const hostname = window && window.location && window.location.hostname;

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
        let csrfToken = data.csrfToken;
        return csrfToken;
    })
    .catch((error) => {
    });
}

async function handleResetPassword(data) {
    let CSRFToken = await getCsrfToken();
    let url = "https://" + hostname + ":8000/authentification/reset_password/";
    if (localStorage.getItem("resetUrl"))
        url += localStorage.getItem("resetUrl").split("reset-password/")[1];
    else
        url = "";
    let password = data.password;
    await fetch(
        url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": CSRFToken,
        },
        credentials: "include",
        body: JSON.stringify({ password: password })
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error === "Invalid reset link") {
            document.getElementById("invalidLink").style.display = "block";
            return;
        }
        if (data.status === "success") {
            document.querySelectorAll(".formError").forEach((element) => {
                element.style.display = "none";
            });
            document.getElementById("success").style.display = "block";
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
            return;
        }
    })
    .catch((error) => {
    });
};

function isValidPassword(password) {
    if (password.length < 8) {
        return false;
    }
    if (password.search(/[A-Z]/) == -1) return false;
    if (password.search(/[0-9]/) == -1) return false;
    return true;
}

const send = document.getElementById("send");

document.getElementById("confirmPassword").addEventListener('input', () => {
    send.style.backgroundColor = "var(--nav-color)";
})

send.addEventListener("click", (e) => {
    e.preventDefault();
    let data = {
        password: document.getElementById("password").value,
        password2: document.getElementById("confirmPassword").value,
    }
    if (!isValidPassword(data.password)) {
        document.getElementById("error").style.display = "none";
        document.getElementById("weak").style.display = "block";
        return;
    }
    if (data.password !== data.password2) {
        document.getElementById("weak").style.display = "none";
        document.getElementById("error").style.display = "block";
        return;
    }
    handleResetPassword(data);
});
