const hostname = window && window.location && window.location.hostname;

async function getCsrfToken() {
    return await fetch(
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

async function forgotPassword(mail) {
    const crsfToken = await getCsrfToken();
    await fetch(
        "https://" + hostname + ":8000/authentification/forgot_password/", {
        method: 'POST',
        credentials: "include",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': crsfToken,
        },
        body: JSON.stringify({ email: mail })
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error)
            return ;
        document.querySelector('.email-sent').style.display = 'block';
    })
    .catch((error) => {
    });
}

document.getElementById('email').addEventListener('input', (e) => {
    document.querySelector('.btn').style.backgroundColor = 'var(--nav-color)';
});

const submitBtn = document.getElementById('send');

submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    await forgotPassword(email);
});

document.getElementById('email').addEventListener('input', () => {
    document.querySelector('.email-sent').style.display = 'none';
});
