const hostname = window && window.location && window.location.hostname;
let friendTab = [];

const socket = new WebSocket("wss://" + hostname + ":8000/ws/connected-list/");
socket.onopen = () => {
    socket.send(
        JSON.stringify({
            type: "connected",
        })
    );
};

export const waitForOpenConnection = (socket) => {
    return new Promise((resolve, reject) => {
        const maxNumberOfAttempts = 10;
        const intervalTime = 200; //ms

        let currentAttempt = 0;
        const interval = setInterval(() => {
            if (currentAttempt > maxNumberOfAttempts - 1) {
                clearInterval(interval);
                reject(new Error("Maximum number of attempts exceeded"));
            } else if (socket.readyState === socket.OPEN) {
                clearInterval(interval);
                resolve();
            }
            currentAttempt++;
        }, intervalTime);
    });
};

export const sendMessage = async (socket, msg) => {
    if (socket.readyState !== socket.OPEN) {
        try {
            await waitForOpenConnection(socket);
            socket.send(msg);
        } catch (err) {
        }
    } else {
        socket.send(msg);
    }
};

const notifySocket = new WebSocket("wss://" + hostname + ":8000/ws/notify/");
notifySocket.onopen = () => {
    notifySocket.send(
        JSON.stringify({
            type: "connected",
        })
    );
};

socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "user_status_update") {
        setUpFriendList();
    }
    if (data.type === "check") {
        updateFriendList(data);
    }
};

notifySocket.addEventListener("message", async (event) => {
    const data = JSON.parse(event.data);
    if (data.message === 'new friend request') {
        setUpFriendRequestList();
        document.getElementById("friend__notification").style.display = "block";
    }
    if (data.message === "friend request sent accepted") {
        setUpFriendList();
    }
    if (data.message === "friend removed you") {
        setUpFriendList();
    }
});

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

async function initializeNavPage() {
    try {
        const user_data = await getUserData();
        if (user_data) {
            const settingsDisplayPicture =
                document.getElementById("profilePictureNav");
            settingsDisplayPicture.setAttribute(
                "src",
                user_data.user_data["profile_picture"]
            );
            const settingsDisplayPictureToggle = document.getElementById("ProfilePictureToggle");
            settingsDisplayPictureToggle.setAttribute(
                "src", user_data.user_data["profile_picture"]
            );
        }
    } catch (error) {
    }
}

initializeNavPage();

const body = document.querySelector("body"),
    nav = document.querySelector("nav"),
    modeToggle = document.querySelector(".dark-light"),
    sidebarOpen = document.querySelector(".sidebarOpen");

let getMode = localStorage.getItem("mode");
if (getMode && getMode === "dark-mode") {
    body.classList.add("dark");
}

if (modeToggle) {
    modeToggle.addEventListener("click", () => {
        modeToggle.classList.toggle("active");
        body.classList.toggle("dark");
        if (!body.classList.contains("dark")) {
            localStorage.setItem("mode", "light-mode");
        } else {
            localStorage.setItem("mode", "dark-mode");
        }
    });
}

body.addEventListener("click", (e) => {
    let clickedElm = e.target;

    if (
        !clickedElm.classList.contains("sidebarOpen") &&
        !clickedElm.classList.contains("menu")
    ) {
        nav.classList.remove("active");
    }
});

const logout = document.querySelector(".logout");

logout.addEventListener("click", () => {
    fetch("https://" + hostname + ":8000/authentification/logout/", {
        method: "GET",
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                window.location.href = "/login";
            }
        });
});

const logoutMobile = document.querySelector(".logout-toggle");

logoutMobile.addEventListener("click", () => {
    fetch("https://" + hostname + ":8000/authentification/logout/", {
        method: "GET",
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Logout successful") {
                window.location.href = "/login";
            }
        });
});

async function removeFriend(username) {
    const CSRFToken = await getCsrfToken();
    const url = "https://" + hostname + ":8000/friendlist/delete_friend/" + username;
    await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "X-CSRFToken": CSRFToken,
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {})
        .catch((error) => {
        });
}

async function getFriendList() {
    const CSRFToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/friendlist/get_user_friends_accepted", {
        method: "GET",
        credentials: "include",
        headers: {
            "X-CSRFToken": CSRFToken,
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            return (friendTab = data);
        })
        .catch((error) => {
        });
}

async function displayFriend(friend) {
    let friendElement = document.createElement("li");
    friendElement.classList.add("friend__element");
    friendElement.classList.add("friend");
    friendElement.setAttribute("id", friend.id);
    let img = await fetch(friend.profile_picture);
    friendElement.innerHTML = `
        <div class="friend__profile-picture" id="${friend.username}">
            <img style="height:50px;width:50px;border-radius:100%;" src="${img.url}" alt="Profile picture">
        </div>
        <div class="friend__username" style="font-size: 15px">
            <p>${friend.username}</p>
        </div>
        <div class="friend__remove">
            <i class='bx bx-user-minus bx-xl'></i>
        </div>
    `;
    friends.appendChild(friendElement);
    let friend__remove = friendElement.querySelector(".friend__remove");
    friend__remove.classList.add("friend__remove");
    friend__remove.addEventListener("click", () => {
        friendRequestTab.friends = friendRequestTab.friends.filter(
            (f) => f.id !== friend.id
        );
        removeFriend(friend.username);
        friendElement.remove();
        if (friendTab.friends.length === 1) {
            document.querySelector(".noFriends").style.display = "block";
        }
    });
    let friend__username = friendElement.querySelector(".friend__username");
    friend__username.classList.add("friend__username");
    let friend__profile_picture = friendElement.querySelector(
        ".friend__profile-picture"
    );
    friend__profile_picture.classList.add("friend__profile_pic");
    if (friend.is_connected === true) {
        friend__profile_picture.style.border = "2px solid var(--intense-green)";
        friend__profile_picture.style.borderRadius = "100%";
    } else {
        friend__profile_picture.style.border = "2px solid var(--intense-red)";
        friend__profile_picture.style.borderRadius = "100%";
    }
}

const friends = document.querySelector(".friends");

async function setUpFriendList() {
    document.querySelectorAll(".friend__element").forEach((friend) => {
        friend.remove();
    });
    await getFriendList();
    if (friendTab.friends.length === 0) {
        document.querySelector('.noFriends').style.display = "block";
    }
    else {
        document.querySelector('.noFriends').style.display = "none";
        sendMessage(socket, JSON.stringify({
            type: "check_connected",
            friendTab: friendTab,
        }));
    }
}

setUpFriendList();

const friendRequest = document.querySelector(".friendRequest");
let friendRequestTab;

async function getRequestFriendList() {
    const CSRFToken = await getCsrfToken();
    await fetch("https://" + hostname + ":8000/friendlist/get_user_friends_pending", {
        method: "GET",
        credentials: "include",
        headers: {
            "X-CSRFToken": CSRFToken,
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            return (friendRequestTab = data);
        })
        .catch((error) => {
        });
}

async function declineFriendRequest(username) {
    const crsfToken = await getCsrfToken();
    const url =
        "https://" + hostname + ":8000/friendlist/decline_friend_request/" + username;
    await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CSRFToken": crsfToken,
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {})
        .catch((error) => {
            throw error;
        });
}

async function acceptFriendRequest(username) {
    const crsfToken = await getCsrfToken();
    const url =
        "https://" + hostname + ":8000/friendlist/accept_friend_request/" + username;
    await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CSRFToken": crsfToken,
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {})
        .catch((error) => {
            throw error;
        });
}

function addFriendState(friend) {
    let friendElement = document.getElementById(friend.id);
    let friend__profile_picture = friendElement.querySelector(
        ".friend__profile-picture"
    );
    if (friend.is_connected === true) {
        friend__profile_picture.style.border = "2px solid var(--intense-green)";
        friend__profile_picture.style.borderRadius = "100%";
    } else {
        friend__profile_picture.style.border = "2px solid var(--intense-red)";
        friend__profile_picture.style.borderRadius = "100%";
    }
}

async function updateFriendList(data) {
    document.querySelectorAll(".friend__element").forEach((friend) => {
        friend.remove();
    });
    if (data.friends_info.length === friendTab.friends.length) {
        data.friends_info.forEach((friend) => {
                displayFriend(friend);
        })
    } else {
        data.friends_info.forEach((friend) => {
            addFriendState(friend);
        })
    }
}

function displayFriendRequests(friend) {
    let friendElement = document.createElement("li");
    friendElement.classList.add("friend__request_element");
    friendElement.classList.add("friend");
    friendElement.setAttribute("id", friend.id);
    friendElement.innerHTML = `
            <div class="friend__username">
                <p>${friend.username}</p>
            </div>
            <div class="friend__accept">
                <i class='bx bx-user-plus bx-xm'></i>
            </div>
            <div class="friend__decline">
                <i class='bx bx-user-x bx-xm'></i>
            </div>
                `;
        friendRequest.appendChild(friendElement);
        let friend__username = friendElement.querySelector(".friend__username");
        friend__username.classList.add("friend__request_username");
        
        let friend__accept = friendElement.querySelector(".friend__accept");
        friend__accept.classList.add('friend__request_accept'); 
        friend__accept.addEventListener("click", async () => {
            await acceptFriendRequest(friend.username);
            friendRequestTab.friends = friendRequestTab.friends.filter(f => f.id !== friend.id);
            friendElement.remove();
            if (friendRequestTab.friends.length === 0) {
                document.getElementById('friend__notification').style.display = "none";
            }
            setUpFriendList();
        });

    let friend__decline = friendElement.querySelector(".friend__decline");
    friend__decline.classList.add("friend__request_decline");
    friend__decline.addEventListener("click", () => {
        declineFriendRequest(friend.username);
        friendRequestTab.friends = friendRequestTab.friends.filter(
            (f) => f.id !== friend.id
        );
        friendElement.remove();

        if (friendRequestTab.friends.length === 0) {
            document.getElementById("friend__notification").style.display =
                "none";
        }
    });
}

async function setUpFriendRequestList() {
    await getRequestFriendList();
    const user = await getUserData();

    friendRequestTab.friends.forEach((friend) => {
        if (friend.username === user.user_data.username) {
            friendRequestTab.friends = friendRequestTab.friends.filter(
                (f) => f.username !== user.user_data.username
            );
        }
    });

    if (friendRequestTab.friends.length === 0) {
        let friendElement = document.createElement("li");
        friendElement.style.listStyleType = "none";
        friendElement.style.textAlign = "center";
        friendElement.innerHTML = `<span></span>`;
        friendRequest.appendChild(friendElement);
        document.getElementById("friend__notification").style.display = "none";
    } else {
        document.getElementById("friend__notification").style.display = "block";
    }

    friendRequestTab.friends.forEach((friend) => {
        displayFriendRequests(friend);
    });
}

setUpFriendRequestList();
let requestShow = document.querySelector(".request");

requestShow.addEventListener("click", () => {
    let friendRequest = document.querySelector(".friendRequest");
    let computedStyle = window.getComputedStyle(friendRequest);
    if (computedStyle.display == "none") {
        friendRequest.style.transition = "all 0.5s ease-in-out";
        friendRequest.style.display = "block";
        document.getElementById("requestDown").style.display = "none";
        document.getElementById("requestUp").style.display = "block";
    } else {
        friendRequest.style.display = "none";
        document.getElementById("requestDown").style.display = "block";
        document.getElementById("requestUp").style.display = "none";
    }
});

const displayList = document.querySelector(".displayList");
const arrow = document.querySelector(".arrow");

document
    .querySelector("#friendListDisplay")
    .addEventListener("click", (event) => {
        if (
            displayList.style.display === "block" &&
            event.target.id == "friendListDisplay"
        ) {
            document.querySelector(".displayList").style.display = "none";
            document.querySelector(".arrow").style.display = "none";
            showTitle();
        } else {
            displayList.style.display = "block";
            arrow.style.display = "block";
        }
    });

document.querySelector(".arrow").addEventListener("mouseover", () => {
    document.querySelector(".displayList").style.display = "block";
    document.querySelector(".arrow").style.display = "block";
});

document.querySelector(".main").addEventListener("click", () => {
    document.querySelector(".displayList").style.display = "none";
    document.querySelector(".arrow").style.display = "none";
    showTitle();
});

const showTitle = () => {
    closeAddFriendInput();
    openAddFriendTitle();
};

const closeAddFriendInput = () => {
    document.querySelector(".friendInput").style.display = "none";
    document.getElementById("addFriendIconHide").style.display = "none";
    document.getElementById("crossFriendIconHide").style.display = "none";
    document.getElementById("addFriendInput").value = "";
};

const closeAddFriendTitle = () => {
    document.querySelector(".friendTitle").style.display = "none";
    document.getElementById("addFriendIconShow").style.display = "none";
};

const openAddFriendTitle = () => {
    document.querySelector(".friendTitle").style.display = "block";
    document.getElementById("addFriendIconShow").style.display = "block";
};

const openAddFriendInput = () => {
    document.querySelector(".friendInput").style.display = "block";
    document.getElementById("addFriendIconHide").style.display = "block";
    document.getElementById("crossFriendIconHide").style.display = "block";
};

document.querySelector(".addFriends").addEventListener("click", (event) => {
    closeAddFriendTitle();
    openAddFriendInput();
    if (event.target.id == "crossFriendIconHide") showTitle();
});

async function getCsrfToken() {
    return fetch("https://" + hostname + ":8000/authentification/get-csrf-token/", {
        method: "GET",
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => {
            const csrfToken = data.csrfToken;
            return csrfToken;
        })
        .catch((error) => {
        });
}

async function sendFriendRequest(username) {
    const crsfToken = await getCsrfToken();
    if (username === "") return;
    const url =
        "https://" + hostname + ":8000/friendlist/send_friend_request/" + username;
    await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CSRFToken": crsfToken,
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {})
        .catch((error) => {
        });
}

document.getElementById("addFriendIconHide").addEventListener("click", () => {
    let friendName = document.getElementById("addFriendInput").value;
    document.getElementById("addFriendInput").value = "";
    sendFriendRequest(friendName);
});
