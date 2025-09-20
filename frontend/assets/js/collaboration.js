// collaboration.js

// ====== Set teamId dynamically ======
let teamId = ""; // Assign this from your session or page context


function setTeamId(id) {
    teamId = id;
    loadChat();
    loadPolls();
}
// ================= Chat =================
async function loadChat() {
    const res = await fetch(`/collaboration/chat/${teamId}`);
    const msgs = await res.json();
    document.getElementById("chatBox").innerHTML = msgs
        .map(m => `${m.sender}: ${m.message}`)
        .join("<br>");
}

async function sendMessage() {
    const msg = document.getElementById("chatInput").value;
    if (!msg) return;
    await fetch(`/collaboration/chat/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "You", message: msg })
    });
    document.getElementById("chatInput").value = "";
    loadChat();
}

setInterval(loadChat, 2000);

// ================= Polls =================
async function loadPolls() {
    if (!teamId) {
        console.error("No team ID set");
        return;
    }
    
    try {
        const res = await fetch(`/collaboration/poll/${teamId}`);
        const polls = await res.json();
        const container = document.getElementById("pollsContainer");
        container.innerHTML = "";

        polls.forEach(p => {
            const div = document.createElement("div");
            div.classList.add("poll-card");
            div.innerHTML = `<strong>${p.question}</strong><br>` +
                p.options.map((opt, i) => 
                    `<button onclick="vote('${p._id}',${i})">${opt} (${p.votes[i]})</button>`
                ).join("<br>");
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Failed to load polls:", err);
    }
}

async function vote(pollId, index) {
    await fetch(`/collaboration/vote/${pollId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex: index })
    });
    loadPolls();
}

document.getElementById("createPollForm").addEventListener("submit", async e => {
    e.preventDefault();
    
    if (!teamId) {
        alert("Please set a team ID first");
        return;
    }
    
    const q = document.getElementById("pollQuestion").value;
    const opts = document.getElementById("pollOptions").value.split(",").map(o => o.trim());
    if (!q || opts.length === 0) return;

    try {
        await fetch(`/collaboration/poll/${teamId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q, options: opts })
        });

        document.getElementById("pollQuestion").value = "";
        document.getElementById("pollOptions").value = "";
        loadPolls(); // Reload polls after creation
    } catch (err) {
        console.error("Failed to create poll:", err);
    }
}); 

setInterval(loadPolls, 2000);

// ================= Whiteboard (Socket.IO) =================
// ================= Whiteboard =================
const socket = io();
const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");
let drawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = 'black';
let currentSize = 3;
let isErasing = false;

// Set canvas to fill container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    redrawStrokes();
}

// Initialize canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Set drawing styles
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.lineWidth = currentSize;
ctx.strokeStyle = currentColor;

// Join whiteboard room
socket.emit("join_whiteboard", { teamId });

// Drawing functions
function startDrawing(e) {
    drawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!drawing) return;
    
    const [x, y] = getCoordinates(e);
    
    // Draw locally
    ctx.lineWidth = currentSize;
    ctx.strokeStyle = currentColor;
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Send to server
    const strokeData = {
        teamId,
        x1: lastX, y1: lastY,
        x2: x, y2: y,
        color: currentColor,
        size: currentSize,
        isErasing: isErasing
    };
    
    socket.emit("draw", strokeData);
    [lastX, lastY] = [x, y];
}

// Get coordinates properly
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    
    return [
        (clientX - rect.left) * scaleX,
        (clientY - rect.top) * scaleY
    ];
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

// Receive drawing from others
socket.on("draw", data => {
    ctx.lineWidth = data.size;
    ctx.strokeStyle = data.color;
    ctx.globalCompositeOperation = data.isErasing ? 'destination-out' : 'source-over';
    
    ctx.beginPath();
    ctx.moveTo(data.x1, data.y1);
    ctx.lineTo(data.x2, data.y2);
    ctx.stroke();
});

// Redraw all strokes
function redrawStrokes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fetch(`/collaboration/whiteboard/${teamId}`)
        .then(res => res.json())
        .then(strokes => {
            strokes.forEach(stroke => {
                ctx.lineWidth = stroke.size || 3;
                ctx.strokeStyle = stroke.color || 'black';
                ctx.globalCompositeOperation = stroke.isErasing ? 'destination-out' : 'source-over';
                
                ctx.beginPath();
                ctx.moveTo(stroke.x1, stroke.y1);
                ctx.lineTo(stroke.x2, stroke.y2);
                ctx.stroke();
            });
        });
}

// Tool functions
function setColor(color) {
    currentColor = color;
    isErasing = false;
    updateToolIndicator();
}

function setSize(size) {
    currentSize = size;
    updateToolIndicator();
}

function toggleEraser() {
    isErasing = !isErasing;
    updateToolIndicator();
}

function clearCanvas() {
    if (confirm('Clear whiteboard?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fetch(`/collaboration/whiteboard/${teamId}`, { method: "DELETE" });
        socket.emit("clear_whiteboard", { teamId });
    }
}

function updateToolIndicator() {
    const indicator = document.getElementById('toolIndicator');
    if (indicator) {
        indicator.textContent = isErasing ? 
            `Eraser (Size: ${currentSize})` : 
            `Pen: ${currentColor} (Size: ${currentSize})`;
    }
}

// Handle clear event from server
socket.on("clear_whiteboard", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});