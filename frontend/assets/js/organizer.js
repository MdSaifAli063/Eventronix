document.getElementById("createEventForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("eventName").value;
    const type = document.getElementById("eventType").value;
    const details = document.getElementById("eventDetails").value;
    const deadline = document.getElementById("eventDeadline").value;
    const teamSize = document.getElementById("teamSize").value;// Get deadline

    const res = await fetch("/organizer/create_event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, details,teamSize, registrationDeadline: deadline, }) // Send deadline
    });
    const data = await res.json();
    alert(data.message);
    loadEvents();
});

async function showDeadlineManagement(eventId) {
    const event = await fetch(`/organizer/event/${eventId}`).then(r => r.json());
    
    const html = `
        <h3>Registration Deadline</h3>
        <p>Current: ${event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : 'Not set'}</p>
        <input type="datetime-local" id="newDeadline">
        <button onclick="updateDeadline('${eventId}')">Update Deadline</button>
        <p>Status: ${event.registrationOpen ? 'OPEN' : 'CLOSED'}</p>
    `;
    
    document.getElementById("deadlineManagement").innerHTML = html;
}

async function updateDeadline(eventId) {
    const newDeadline = document.getElementById("newDeadline").value;
    
    const res = await fetch(`/organizer/event/${eventId}/deadline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: newDeadline })
    });
    
    const data = await res.json();
    alert(data.message);
    showDeadlineManagement(eventId); // Refresh
}


async function loadEvents() {
    const res = await fetch("/organizer/events");
    const events = await res.json();
    const container = document.getElementById("eventsList");
    container.innerHTML = "";

    for (let e of events) {
        const div = document.createElement("div");
        div.classList.add("event-card");


        div.innerHTML = `
            <div class="event-header">
                <strong>${e.name}</strong> 
                <span class="event-type">${e.type}</span>
            </div>
            <div class="event-meta">
                <div class="meta-item">
                    <i class="fa-solid fa-calendar"></i>
                    <span>${e.registrationDeadline ? 'Deadline: ' + formatDate(e.registrationDeadline) : 'No deadline'}</span>
                </div>
            </div>
            <div class="event-actions">
                <button onclick="loadAnalytics('${e._id}')">Analytics</button>
                <button onclick="generateAI('${e._id}')">AI Roadmap</button>
                <button onclick="showDeadlineManagement('${e._id}')">Set Deadline</button>
                <button onclick="exportCSV('${e._id}')">Export CSV</button>
                <button onclick="viewParticipants('${e._id}', '${e.type}')">View Participants</button>
                
            </div>
        `;
        container.appendChild(div);
    }
}

async function loadAnalytics(eventId) {
    const res = await fetch(`/organizer/${eventId}/analytics`);
    const data = await res.json();
    document.getElementById("analytics").innerText = JSON.stringify(data, null, 2);
}

// Generate AI Roadmap for selected event
async function generateAI(eventId) {
    try {
        const res = await fetch(`/organizer/${eventId}/ai_roadmap`);
        const data = await res.json();
        const container = document.getElementById("aiRoadmapContainer");
        container.innerHTML = `<h3>${data.event} Roadmap:</h3>`;
        data.roadmap.forEach((step, idx) => {
            const div = document.createElement("div");
            div.innerText = `${idx + 1}. ${step}`;
            container.appendChild(div);
        });
    } catch (err) {
        alert("Failed to generate AI roadmap.");
        console.error(err);
    }
}

loadEvents();

async function exportCSV(eventId) {
    window.open(`/organizer/${eventId}/export`, '_blank');
}
// ----------------------
// Logout Function
// ----------------------
async function logout() {
    try {
        const response = await fetch("/logout", {
            method: "POST",
            credentials: "include" // Important for session cookies
        });
        
        const data = await response.json();
        if (data.success) {
            // Clear local storage and redirect to login
            localStorage.removeItem("user");
            localStorage.removeItem("pendingTab");
            window.location.href = "/signin";
        } else {
            alert("Logout failed: " + data.message);
        }
    } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed. Please try again.");
    }
}

// In organizer.js - Enhanced version to show all details
async function loadSubmittedTeams(eventId = null) {
    try {
        const url = eventId 
            ? `/organizer/submitted-teams?eventId=${eventId}`
            : '/organizer/submitted-teams';
            
        const res = await fetch(url);
        
        // Check if the response is OK
        if (!res.ok) {
            if (res.status === 403) {
                alert("Access denied. Please make sure you're logged in as an organizer.");
                return;
            }
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }
        
        const teams = await res.json();
        
        // Check if teams is an array
        if (!Array.isArray(teams)) {
            console.error("Expected array but got:", teams);
            alert("Unexpected response from server. Please try again.");
            return;
        }
        
        // Get the container element
        const container = document.getElementById("submittedTeamsContainer");
        if (!container) {
            console.error("Submitted teams container not found");
            return;
        }
        
        container.innerHTML = "";
        
        if (teams.length === 0) {
            container.innerHTML = "<p>No teams submitted yet.</p>";
            return;
        }
        
        teams.forEach(team => {
            const div = document.createElement("div");
            div.classList.add("submitted-team-card");
            div.innerHTML = `
                <div class="team-header">
                    <h3>${team.teamName || "Unnamed Team"}</h3>
                    <span class="status-badge ${team.status || "pending"}">${team.status || "pending"}</span>
                </div>
                
                <div class="team-info">
                    <p><strong>Event:</strong> ${team.eventName || "Unknown Event"}</p>
                    <p><strong>Team Code:</strong> ${team.teamCode || "N/A"}</p>
                    <p><strong>Team Size:</strong> ${team.members ? team.members.length : 0}/${team.teamSize || 4}</p>
                    <p><strong>Submitted:</strong> ${team.submittedAt ? new Date(team.submittedAt).toLocaleString() : "Not submitted"}</p>
                </div>
                
                <div class="team-members">
                    <h4>Team Members:</h4>
                    ${team.members ? team.members.map(member => `
                        <div class="member-card">
                            <strong>${member.name || "Unknown"}</strong>
                            <p>📞 ${member.phone || "Not provided"}</p>
                            <p>🛠️ ${member.skills || "No skills listed"}</p>
                            <p>🔗 ${member.linkedin || "No LinkedIn provided"}</p>
                        </div>
                    `).join('') : "No members"}
                </div>
                
            `;
            container.appendChild(div);
        });
        
    } catch (err) {
        console.error("Failed to load submitted teams:", err);
        const container = document.getElementById("submittedTeamsContainer");
        if (container) {
            container.innerHTML = `<p>Error loading teams: ${err.message}</p>`;
        }
    }
}



function formatDate(dateString) {
    try {
        if (!dateString) return 'No deadline';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
        return 'Date error';
    }
}




async function viewParticipants(eventId, eventType) {
    try {
        const res = await fetch(`/organizer/${eventId}/participants`);
        const participants = await res.json();
        
        // Create a modal to display participants
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "2000";
        
        let participantsHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h2>Participants for Event</h2>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right;">Close</button>
                <div style="clear: both;"></div>
        `;
        
        if (participants.length === 0) {
            participantsHTML += `<p>No participants registered yet.</p>`;
        } else {
            participantsHTML += `
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Name</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Phone</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Skills</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">LinkedIn</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            participants.forEach(p => {
                participantsHTML += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name || 'N/A'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.phone || 'N/A'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.skills || 'N/A'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.linkedin || 'N/A'}</td>
                    </tr>
                `;
            });
            
            participantsHTML += `</tbody></table>`;
        }
        
        participantsHTML += `</div>`;
        modal.innerHTML = participantsHTML;
        document.body.appendChild(modal);
    } catch (err) {
        console.error("Failed to load participants:", err);
        alert("Failed to load participants. Please try again.");
    }
}





async function viewTeams(eventId) {
    try {
        const res = await fetch(`/organizer/${eventId}/teams`);
        const teams = await res.json();
        
        // Create a modal to display teams
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "2000";
        
        let teamsHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h2>Teams for Hackathon</h2>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right;">Close</button>
                <div style="clear: both;"></div>
        `;
        
        if (teams.length === 0) {
            teamsHTML += `<p>No teams created yet.</p>`;
        } else {
            teams.forEach(team => {
                teamsHTML += `
                    <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                        <h3>${team.teamName || 'Unnamed Team'}</h3>
                        <p><strong>Team Code:</strong> ${team.teamCode || 'N/A'}</p>
                        <p><strong>Team Size:</strong> ${team.members ? team.members.length : 0}/${team.teamSize || 4}</p>
                        
                        <h4>Members:</h4>
                        <ul>
                `;
                
                if (team.members && team.members.length > 0) {
                    team.members.forEach(member => {
                        teamsHTML += `
                            <li>
                                ${member.name || 'Unknown'} - 
                                ${member.phone || 'No phone'} - 
                                ${member.skills || 'No skills'} - 
                                ${member.linkedin || 'No LinkedIn'}
                            </li>
                        `;
                    });
                } else {
                    teamsHTML += `<li>No members yet</li>`;
                }
                
                teamsHTML += `</ul></div>`;
            });
        }
        
        teamsHTML += `</div>`;
        modal.innerHTML = teamsHTML;
        document.body.appendChild(modal);
    } catch (err) {
        console.error("Failed to load teams:", err);
        alert("Failed to load teams. Please try again.");
    }
}