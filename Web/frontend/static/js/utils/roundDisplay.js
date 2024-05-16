const hostname = window && window.location && window.location.hostname;
export function getRound(bracket) {
    if (bracket.length === 1) {
        return 1;
    } else if (bracket.length === 2) {
        return 2;
    } else if (bracket.length === 3 || bracket.length === 4) {
        return 3;
    } else if (bracket.length >= 5) {
        return 4;
    }
}

export async function SetUpRound(bracket, currentRound) {
    let round = document.createElement('div');
    round.classList.add('round');
    if (currentRound == 4)
        currentRound *= 2;
    if (currentRound == 3)
        currentRound = 4;
    for (let i = 0; i < currentRound; i++) {
        let match = document.createElement('div');
        let player1 = "TBD";
        let player2 = "TBD";
        let user1 = "";
        let user2 = "";
        let pp1 = "/static/assets/avatar/bear.png";
        let pp2 = "/static/assets/avatar/bear.png";
        let score1 = 0;
        let score2 = 0;
        if (bracket[i]) {
            if (bracket[i].odd_name) {
                player1 = bracket[i].odd_name;
                pp1 = bracket[i].odd_picture;
                player2 = "DQ";
                score1 = 5;
            } else {
                player1 = bracket[i].first_pseudo;
                player2 = bracket[i].second_pseudo;
                pp1 = bracket[i].first_picture;
                pp2 = bracket[i].second_picture;
            }
        }
        match.classList.add("match");
        match.style.width = "75%";
        match.setAttribute("id", "match" + i);
        match.innerHTML = `
            <div class="match__info">
                <img src="${pp1}" alt="arrow">
                <div class="match__name">
                    <p id="Round${currentRound}match${i}Player1">${player1}</p>
                </div>
            </div>
            <div class="match__score" id="${player1}${player2}">
                <p>  ${score1}  :  ${score2}  </p>
            </div>
            <div class="match__info_2">
                <img src="${pp2}" alt="arrow">
                <div class="match__name">
                    <p id="Round${currentRound}match${i}Player2">${player2}</p>
                </div>
            </div>
        `;
        round.appendChild(match);
    }
    return round;
}

export function emptyRound(currentRound, filler) {
    let round = document.createElement('div');
    round.classList.add('round');
    round.setAttribute("id", "round" + currentRound);
    if (currentRound == 4)
        currentRound *= 2;
    if (currentRound == 3)
        currentRound = 4;
    for (let i = 0; i < currentRound; i++) {
        let match = document.createElement('div');
        match.classList.add("match");
        match.setAttribute("id", "match" + i)
        match.style.width = "75%";
        match.innerHTML = `
            <div class="match__info">
                <img src="/static/assets/avatar/bear.png" alt="arrow">
                <div class="match__name">
                    <p id="Round${currentRound}match${i}Player1">${filler}</p>
                </div>
            </div>
            <div class="match__score">
                <p>  0  : 0  </p>
            </div>
            <div class="match__info_2">
                <img src="/static/assets/avatar/bear.png" alt="arrow">
                <div class="match__name">
                    <p id="Round${currentRound}match${i}Player2">${filler}</p>
                </div>
            </div>
        `;
        round.appendChild(match);
    }
    return round;
}