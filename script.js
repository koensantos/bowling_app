function saveScores(){
    const frame1 = document.getElementById("frame1").value;
    const frame2 = document.getElementById("frame2").value;
    const frame3 = document.getElementById("frame3").value;
    const frame4 = document.getElementById("frame4").value;
    const frame5 = document.getElementById("frame5").value;
    const frame6 = document.getElementById("frame6").value;
    const frame7 = document.getElementById("frame7").value;
    const frame8 = document.getElementById("frame8").value;
    const frame9 = document.getElementById("frame9").value;
    const frame10 = document.getElementById("frame10").value;

    const frames = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8, frame9, frame10]

    const bowler = document.getElementById("bowler_name").value.trim();
    const stats = strikeSpareOpenPercentage(frames);
    const score = calculateScore(frames);

    saveBowlerStats(bowler, score, stats);
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

        if (roll === "X") { // Strike
            score += 10 + rollValue(rolls[rollIndex + 1]) + rollValue(rolls[rollIndex + 2]);
            rollIndex += 1;
        } else if (rolls[rollIndex + 1] === "/") { // Spare
            score += 10 + rollValue(rolls[rollIndex + 2]);
            rollIndex += 2;
        } else { // Open frame
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

        // Strikes
        const strikeCount = countChar(currFrame, "X");
        numStrikes += strikeCount;
        possibleStrikes += (i < 9) ? (isStrike ? 1 : 1) : strikeCount;

        // Spares
        if (isSpare) numSpares++;
        possibleSpares++;

        // Opens
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

function saveBowlerStats(name, score, stats) {
    const now = new Date();
    const timestamp = now.toLocaleString(); // readable date and time

    const data = {
        name: name,
        score: score,
        strikePercent: stats.strikePercent,
        sparePercent: stats.sparePercent,
        openPercent: stats.openPercent,
        timestamp: timestamp
    };

    // Try to load existing data and ensure it's an array
    let existing = [];

    try {
        const parsed = JSON.parse(localStorage.getItem("bowlingStats"));
        if (Array.isArray(parsed)) {
            existing = parsed;
        } else {
            // If it's not an array (could be object or corrupted), reset it
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

function filterByName() {
    const nameInput = document.getElementById("bowlerSearch").value.trim().toLowerCase();
    const tableContainer = document.getElementById("scoreTableContainer");
    const aggregateContainer = document.getElementById("aggregateStatsContainer");
    
    tableContainer.innerHTML = "";
    aggregateContainer.innerHTML = "";

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];

    const filtered = data.filter(entry => entry.name.toLowerCase() === nameInput);

    if (filtered.length === 0) {
        tableContainer.innerHTML = `<p>No scores found for "${nameInput}".</p>`;
        return;
    }

    // Build scores table
    let html = "<table><tr>" +
        "<th>Name</th><th>Score</th>" +
        "<th>Strike %</th><th>Spare %</th><th>Open %</th><th>Timestamp</th></tr>";

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

    // Aggregate calculations
    let totalGames = filtered.length;
    let totalScore = 0;
    let totalStrikes = 0;
    let totalSpares = 0;
    let totalOpens = 0;

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

    tableContainer.innerHTML = html;

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

function displayTeamScores() {
    const container = document.getElementById("teamScoresContainer");
    container.innerHTML = "";

    const data = JSON.parse(localStorage.getItem("bowlingStats")) || [];

    const teamStats = {};

    // Group by bowler
    for (let entry of data) {
        const name = entry.name;

        if (!teamStats[name]) {
            teamStats[name] = {
                games: 0,
                totalScore: 0,
                totalStrikes: 0,
                totalSpares: 0,
                totalOpens: 0
            };
        }

        teamStats[name].games += 1;
        teamStats[name].totalScore += entry.score;

        teamStats[name].totalStrikes += entry.strikePercent * 12; // Max 12 per game
        teamStats[name].totalSpares += entry.sparePercent * 11;   // Max 11 per game
        teamStats[name].totalOpens += entry.openPercent * 10;     // Max 10 per game
    }

    // Build table
    let html = `
        <table>
            <tr>
                <th>Bowler</th>
                <th>Games</th>
                <th>Total Score</th>
                <th>Avg Score</th>
                <th>Total Strikes</th>
                <th>Total Spares</th>
                <th>Total Opens</th>
                <th>Strike %</th>
                <th>Spare %</th>
                <th>Open %</th>
            </tr>
    `;

    for (let name in teamStats) {
        const stats = teamStats[name];
        const avgScore = stats.totalScore / stats.games;
        const strikePercent = stats.totalStrikes / (stats.games * 12);
        const sparePercent = stats.totalSpares / (stats.games * 11);
        const openPercent = stats.totalOpens / (stats.games * 10);

        html += `
            <tr>
                <td>${name}</td>
                <td>${stats.games}</td>
                <td>${stats.totalScore}</td>
                <td>${avgScore.toFixed(2)}</td>
                <td>${stats.totalStrikes.toFixed(1)}</td>
                <td>${stats.totalSpares.toFixed(1)}</td>
                <td>${stats.totalOpens.toFixed(1)}</td>
                <td>${(strikePercent * 100).toFixed(2)}%</td>
                <td>${(sparePercent * 100).toFixed(2)}%</td>
                <td>${(openPercent * 100).toFixed(2)}%</td>
            </tr>
        `;
    }

    html += "</table>";
    container.innerHTML = html;
}

