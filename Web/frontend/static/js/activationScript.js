const hostname = window && window.location && window.location.hostname;

if (localStorage.getItem("activateUrl")) {
    let url = localStorage.getItem("activateUrl");
    const token = url.split("/")[5];
    const iud = url.split("/")[4];

    async function activateAccount() {
    await fetch("https://" + hostname + ":8000/authentification/activate_account/" + iud + "/" + token + "/", {
            method: "GET",
            credentials: "include",
            headers: {
            "Content-Type": "application/json",
            },
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                    document.querySelector(".activation").innerHTML = `
                        <h1>Account activated successfully</h1>
                        <img src="/static/assets/settings/success.svg" alt="success">
                        <p>You will be redirected to the login page in 5 seconds</p>
                        `;
                        setTimeout(() => {
                            window.location.href = "/login";
                        }, 5000);
            } else {
                document.querySelector(".activation").innerHTML = `
                <h1>Account activation failed</h1>
                <img src="/static/assets/settings/error.svg" alt="error">
                <p>You will be redirected to the register page in 5 seconds</p>
                `;
                setTimeout(() => {
                    window.location.href = "/register";
                }, 5000);
            }
        })
        .catch((error) => {
        });
    }

    activateAccount();
}

localStorage.removeItem("activateUrl");
