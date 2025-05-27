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
    const gameIndex = document.getElementById("gameSelect").value;
    const frameNumber = parseInt(document.getElementById("frameSelect").value);
    const newValue = document.getElementById("newFrameValue").value.trim();
    const status = document.getElementById("editStatus");

    if (!gameIndex || isNaN(frameNumber) || !newValue) {
        status.textContent = "Please select a game, frame, and enter a new value.";
        return;
    }

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];
    const game = data[gameIndex];

    if (!game || !Array.isArray(game.frames) || !game.frames[frameNumber - 1]) {
        status.textContent = "Game not found or invalid frame.";
        return;
    }

    // Update the frame value
    game.frames[frameNumber - 1] = newValue;

    // Recalculate score and stats
    const newScore = calculateScore(game.frames);
    const stats = strikeSpareOpenPercentage(game.frames);
    game.score = newScore;
    game.strikePercent = stats.strikePercent;
    game.sparePercent = stats.sparePercent;
    game.openPercent = stats.openPercent;
    game.timestamp = new Date().toLocaleString();

    // Save back to localStorage
    data[gameIndex] = game;
    localStorage.setItem("bowlingStats", JSON.stringify(data));

    status.textContent = "Game updated successfully!";
    filterByName();  // Refresh stats & dropdown
    document.getElementById("currentFrames").innerHTML = "";  // Clear frame view
}


function showGameFrames() {
    const selectedIndex = document.getElementById("gameSelect").value;
    const currentFrames = document.getElementById("currentFrames");

    if (!selectedIndex) {
        currentFrames.innerHTML = "";
        return;
    }

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];
    const game = data[selectedIndex];

    if (!game || !Array.isArray(game.frames)) {
        currentFrames.innerHTML = "<p>Game not found.</p>";
        return;
    }

    let html = "<h4>Current Frames:</h4><ul>";
    game.frames.forEach((frame, i) => {
        html += `<li>Frame ${i + 1}: ${frame}</li>`;
    });
    html += "</ul>";

    currentFrames.innerHTML = html;
}
