let pictures = {
    "1": "/static/assets/404/1.png",
    "2": "/static/assets/404/2.png",
    "3": "/static/assets/404/3.png",
}

let catchPhrase = {
    1: "Vous êtes perdu la team...",
    2: "Naaan y'a rien ici... grappling?",
    3: "Vous voulez un bourepif???",
}

let random = Math.floor(Math.random() * 3) + 1;

let dataTrad;
if (localStorage.getItem('language'))
    dataTrad = localStorage.getItem('language').split('-')[1];
else
    dataTrad = 'fr';

if (dataTrad == 'es') {
    catchPhrase = {
        1: "Has perdido el equipo...",
        2: "Naaan no hay nada aquí... ¿grappling?",
        3: "¿Quieres un bourepif???",
    }
    
} else if (dataTrad == 'us') {
    catchPhrase = {
        1: "You're lost, team...",
        2: "Naaan there's nothing here... grappling?",
        3: "Would you like a bourepif???",
    }
}

document.getElementById("image").src = pictures[random];
document.getElementById("descr").textContent = catchPhrase[random];
