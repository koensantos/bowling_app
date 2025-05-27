function saveScores() {
    const frames = [];
    for (let i = 1; i <= 10; i++) {
        frames.push(document.getElementById(`frame${i}`).value.trim());
    }

    const bowler = document.getElementById("bowler_name").value.trim();
    const stats = strikeSpareOpenPercentage(frames);
    const score = calculateScore(frames);

    saveBowlerStats(bowler, score, stats, frames);
}

function rollValue(roll) {
    if (roll === "X") return 10;
    if (roll === "/") return 10;
    return parseInt(roll, 10) || 0;
}

function getRolls(frames) {
    let rolls = [];
    for (let i = 0; i < frames.length; i++) {
        if (!frames[i]) continue;
        const parts = frames[i].trim().split(" ");

        if (i < 9) {
            if (parts[0] === "X") {
                rolls.push("X");
            } else {
                rolls.push(parts[0]);
                if (parts[1]) rolls.push(parts[1]);
            }
        } else {
            for (let part of parts) {
                rolls.push(part);
            }
        }
    }
    return rolls;
}

function calculateScore(frames) {
    const rolls = getRolls(frames);
    let score = 0;
    let rollIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
        const roll = rolls[rollIndex];

        if (roll === "X") {
            score += 10 + rollValue(rolls[rollIndex + 1]) + rollValue(rolls[rollIndex + 2]);
            rollIndex += 1;
        } else if (rolls[rollIndex + 1] === "/") {
            score += 10 + rollValue(rolls[rollIndex + 2]);
            rollIndex += 2;
        } else {
            score += rollValue(roll) + rollValue(rolls[rollIndex + 1]);
            rollIndex += 2;
        }
    }

    console.log("Total Score:", score);
    return score;
}

function countChar(str, char) {
    return str.split(char).length - 1;
}

function strikeSpareOpenPercentage(frames) {
    let numStrikes = 0;
    let numSpares = 0;
    let numOpens = 0;

    let possibleStrikes = 0;
    let possibleSpares = 0;
    let possibleOpens = 10;

    for (let i = 0; i < 10; i++) {
        let currFrame = frames[i] || "";

        const isStrike = currFrame.includes("X");
        const isSpare = currFrame.includes("/");
        const isOpen = !isStrike && !isSpare;

        const strikeCount = countChar(currFrame, "X");
        numStrikes += strikeCount;
        possibleStrikes += (i < 9) ? (isStrike ? 1 : 1) : strikeCount;

        if (isSpare) numSpares++;
        possibleSpares++;

        if (isOpen) numOpens++;
    }

    const strikePercent = (possibleStrikes === 0) ? 0 : numStrikes / possibleStrikes;
    const sparePercent = (possibleSpares === 0) ? 0 : numSpares / possibleSpares;
    const openPercent = (possibleOpens === 0) ? 0 : numOpens / possibleOpens;

    console.log("Strike Percent: ", (strikePercent * 100).toFixed(2) + "%");
    console.log("Spare Percent: ", (sparePercent * 100).toFixed(2) + "%");
    console.log("Open Percent: ", (openPercent * 100).toFixed(2) + "%");

    return {
        strikePercent,
        sparePercent,
        openPercent
    };
}

function saveBowlerStats(name, score, stats, frames) {
    const now = new Date();
    const timestamp = now.toLocaleString();

    const data = {
        name: name,
        score: score,
        strikePercent: stats.strikePercent,
        sparePercent: stats.sparePercent,
        openPercent: stats.openPercent,
        timestamp: timestamp,
        frames: frames
    };

    let existing = [];

    try {
        const parsed = JSON.parse(localStorage.getItem("bowlingStats"));
        if (Array.isArray(parsed)) {
            existing = parsed;
        } else {
            console.warn("Corrupted localStorage 'bowlingStats'. Resetting to []");
            localStorage.removeItem("bowlingStats");
        }
    } catch (e) {
        console.error("Error parsing bowlingStats from localStorage:", e);
        localStorage.removeItem("bowlingStats");
    }

    existing.push(data);
    localStorage.setItem("bowlingStats", JSON.stringify(existing));
}

function loadGamesForEdit() {
    const name = document.getElementById("editBowlerSearch").value.trim().toLowerCase();
    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];

    const filtered = data
        .map((entry, index) => ({ ...entry, index }))
        .filter(entry => entry.name.toLowerCase() === name);

    const container = document.getElementById("gameEditListContainer");
    container.innerHTML = "";

    if (filtered.length === 0) {
        container.innerHTML = `<p>No games found for "${name}".</p>`;
        return;
    }

    let html = "<h3>Select a Game to Edit</h3><ul>";
    filtered.forEach(entry => {
        html += `<li>
            Game on ${entry.timestamp} - Score: ${entry.score}
            <button onclick="editGame(${entry.index})">Edit</button>
        </li>`;
    });
    html += "</ul>";

    container.innerHTML = html;
}

function editGame(index) {
    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];
    const game = data[index];

    const container = document.getElementById("frameEditContainer");
    container.innerHTML = `<h3>Editing Game from ${game.timestamp}</h3>`;

    let html = "";
    for (let i = 1; i <= 10; i++) {
        const frameValue = game.frames && game.frames[i - 1] ? game.frames[i - 1] : "";
        html += `
            <label>Frame ${i}: <input type="text" id="editFrame${i}" value="${frameValue}" placeholder="e.g. X or 9 / or 8 1"></label><br>
        `;
    }

    html += `<button onclick="saveEditedGame(${index}, '${game.name}')">Save Changes</button>`;
    container.innerHTML += html;
}

function saveEditedGame(index, bowlerName) {
    const frames = [];
    for (let i = 1; i <= 10; i++) {
        const val = document.getElementById(`editFrame${i}`).value.trim();
        frames.push(val);
    }

    const score = calculateScore(frames);
    const stats = strikeSpareOpenPercentage(frames);

    const updatedGame = {
        name: bowlerName,
        score,
        strikePercent: stats.strikePercent,
        sparePercent: stats.sparePercent,
        openPercent: stats.openPercent,
        timestamp: new Date().toLocaleString(),
        frames: frames
    };

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];
    data[index] = updatedGame;
    localStorage.setItem("bowlingStats", JSON.stringify(data));

    alert("Game updated successfully!");
    loadGamesForEdit();
    document.getElementById("frameEditContainer").innerHTML = "";
}

function calculateStatsFromFrames(frames) {
    let score = calculateScore(frames);
    let stats = strikeSpareOpenPercentage(frames);

    return {
        score: score,
        strikePercent: stats.strikePercent,
        sparePercent: stats.sparePercent,
        openPercent: stats.openPercent
    };
}

function filterByName() {
    const nameInput = document.getElementById("bowlerSearch").value.trim().toLowerCase();
    const tableContainer = document.getElementById("scoreTableContainer");
    const aggregateContainer = document.getElementById("aggregateStatsContainer");
    const gameSelect = document.getElementById("gameSelect");

    tableContainer.innerHTML = "";
    aggregateContainer.innerHTML = "";
    gameSelect.innerHTML = `<option value="">-- Select a Game --</option>`;

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];

    const filtered = data.map((entry, index) => ({ ...entry, index }))
                         .filter(entry => entry.name.toLowerCase() === nameInput);

    if (filtered.length === 0) {
        tableContainer.innerHTML = `<p>No scores found for "${nameInput}".</p>`;
        return;
    }

    // Populate gameSelect dropdown
    filtered.forEach(entry => {
        const option = document.createElement("option");
        option.value = entry.index;
        option.textContent = `Game on ${entry.timestamp} (Score: ${entry.score})`;
        gameSelect.appendChild(option);
    });

    // Build scores table
    let html = "<table><tr><th>Name</th><th>Score</th><th>Strike %</th><th>Spare %</th><th>Open %</th><th>Timestamp</th></tr>";
    filtered.forEach(entry => {
        html += `<tr>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${(entry.strikePercent * 100).toFixed(2)}%</td>
            <td>${(entry.sparePercent * 100).toFixed(2)}%</td>
            <td>${(entry.openPercent * 100).toFixed(2)}%</td>
            <td>${entry.timestamp}</td>
        </tr>`;
    });
    html += "</table>";
    tableContainer.innerHTML = html;

    // Aggregate Stats
    const totalGames = filtered.length;
    let totalScore = 0, totalStrikes = 0, totalSpares = 0, totalOpens = 0;

    filtered.forEach(s => {
        totalScore += s.score;
        totalStrikes += s.strikePercent * 12;
        totalSpares += s.sparePercent * 11;
        totalOpens += s.openPercent * 10;
    });

    const avgScore = totalScore / totalGames;
    const strikePercent = totalStrikes / (totalGames * 12);
    const sparePercent = totalSpares / (totalGames * 11);
    const openPercent = totalOpens / (totalGames * 10);

    aggregateContainer.innerHTML = `
        <h3>Aggregate Stats for "${nameInput}"</h3>
        <p>Games Played: ${totalGames}</p>
        <p>Average Score: ${avgScore.toFixed(2)}</p>
        <p>Total Strikes: ${totalStrikes.toFixed(0)}</p>
        <p>Total Spares: ${totalSpares.toFixed(0)}</p>
        <p>Total Opens: ${totalOpens.toFixed(0)}</p>
        <p>Strike Percentage: ${(strikePercent * 100).toFixed(2)}%</p>
        <p>Spare Percentage: ${(sparePercent * 100).toFixed(2)}%</p>
        <p>Open Percentage: ${(openPercent * 100).toFixed(2)}%</p>
    `;
}



function updateGameFrame() {
    const name = document.getElementById("bowlerSearch").value.trim();
    const timestamp = document.getElementById("gameSelect").value;
    const frame = parseInt(document.getElementById("frameSelect").value);
    const newValue = document.getElementById("newFrameValue").value.trim();
    const status = document.getElementById("editStatus");

    if (!name || !timestamp || !frame || !newValue) {
        status.textContent = "Please fill out all fields.";
        status.style.color = "red";
        return;
    }

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];
    const entry = data.find(e => e.name.toLowerCase() === name.toLowerCase() && e.timestamp === timestamp);

    if (!entry) {
        status.textContent = "Game not found.";
        status.style.color = "red";
        return;
    }

    if (!entry.frames || entry.frames.length !== 10) {
        status.textContent = "Game data is corrupted or incomplete.";
        status.style.color = "red";
        return;
    }

    entry.frames[frame - 1] = newValue;
    const updated = calculateStatsFromFrames(entry.frames);

    entry.score = updated.score;
    entry.strikePercent = updated.strikePercent;
    entry.sparePercent = updated.sparePercent;
    entry.openPercent = updated.openPercent;

    const index = data.findIndex(e => e.name.toLowerCase() === name.toLowerCase() && e.timestamp === timestamp);
    data[index] = entry;
    localStorage.setItem("bowlingStats", JSON.stringify(data));

    status.textContent = "Game updated successfully!";
    status.style.color = "green";

    filterByName();
}

function showGameFrames() {
    const gameIndex = parseInt(document.getElementById("gameSelect").value);
    const container = document.getElementById("selectedGameFrames");
    container.innerHTML = "";

    if (isNaN(gameIndex)) return;

    const allGames = JSON.parse(localStorage.getItem("bowlingStats")) || [];
    const game = allGames[gameIndex];

    if (!game || !Array.isArray(game.frames)) {
        container.textContent = "No frame data available.";
        return;
    }

    let html = "<h4>Current Frame Values:</h4><table><tr>";
    for (let i = 0; i < 10; i++) {
        html += `<th>F${i + 1}</th>`;
    }
    html += "</tr><tr>";
    for (let i = 0; i < 10; i++) {
        html += `<td>${game.frames[i] || "-"}</td>`;
    }
    html += "</tr></table>";

    container.innerHTML = html;
}
