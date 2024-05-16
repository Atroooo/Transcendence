const hostname = window && window.location && window.location.hostname;

export async function getUserData() {
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