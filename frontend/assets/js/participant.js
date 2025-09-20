// Add these variables at the top (after the existing selectedEventId variables)
let selectedEventId = null;
let selectedEventType = null;
let userRole = null; // Add this // Add this

// ----------------------
// Require Login Wrapper (Add this function)
// ----------------------
async function requireLogin(actionCallback, intendedTab = null) {
    try {
        const res = await fetch("/auth/check_session");
        const data = await res.json();

        if (!data.loggedIn) {
            if (intendedTab) localStorage.setItem("pendingTab", intendedTab);
            window.location.href = "/signin?redirect=/";
        } else {
            // Set userRole from session data
             userRole = data.user?.role || 'participant'; // Added fallback
            if (typeof actionCallback === 'function') {
                actionCallback();
            }
        }
    } catch (err) {
        console.error("Login check failed:", err);
        window.location.href = "/signin?redirect=/";
    }
}

// ----------------------
// Login & Role Check (Add this function)
async function checkLoginAndInit() {
    try {
        const res = await fetch("/auth/check_session");
        const data = await res.json();
        
        if (data.loggedIn) {
            userRole = data.user?.role || 'participant';  // Set userhere
            await loadEvents();
        } else {
            console.log("User not logged in. Tabs will redirect to login.");
        }
    } catch (err) {
        console.error("Session check failed:", err);
    }
}

// Load all events on page load
// Load all events on page load
document.addEventListener("DOMContentLoaded", async () => {
    await checkLoginAndInit(); // Change this line

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async e => {
            e.preventDefault();
            await registerParticipant();
        });
    }
});

// Fetch and display events
// In participant.js - update the loadEvents function
async function loadEvents(eventType = null) {
    try {
        let url = userRole === "organizer" ? "/organizer/events" : "/participant/events";
        if (eventType) url += `?type=${eventType}`;

        const res = await fetch(url);
        const events = await res.json();
        const container = document.getElementById("eventsList");
        if (!container) return;

        container.innerHTML = "";
        if (events.length === 0) {
            container.innerHTML = "<p>No events available yet.</p>";
            return;
        }

        events.forEach(e => {
            const div = document.createElement("div");
            div.classList.add("event-card");

            let innerHTML = `
                <div class="event-header">
                    <strong>${e.name}</strong> 
                    <span class="event-type">${e.type}</span>
                </div>
                <div class="event-details">
                    ${e.details ? `<p class="event-description">${e.details}</p>` : '<p>No details available</p>'}
                </div>
                <div class="event-meta">
            `;

            // ONLY show team size for hackathon events
            if (e.type === "hackathon") {
                innerHTML += `
                    <div class="meta-item">
                        <i class="fa-solid fa-users"></i>
                        <span>Team Size: ${e.teamSize || 'Flexible'}</span>
                    </div>
                `;
            }

            innerHTML += `
                    <div class="meta-item">
                        <i class="fa-solid fa-calendar"></i>
                        <span>${e.registrationDeadline ? 'Deadline: ' + formatDate(e.registrationDeadline) : 'No deadline'}</span>
                    </div>
                </div>
                <div class="event-actions">
            `;
            if (userRole === "participant") {
                innerHTML += `<button onclick="showRegister('${e._id}','${e.type}')">Register</button>`;

                
                // ONLY show View Teams button for hackathon events
                if (e.type === "hackathon") {
                    innerHTML += `<button onclick="viewTeams('${e._id}')">View Teams</button>`;
                }
             } 
            //  else {
            //     innerHTML += `<button onclick="loadAnalytics('${e._id}')">Analytics</button>`;
            // }
            innerHTML += `</div>`;
            div.innerHTML = innerHTML;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Failed to load events:", err);
    }
}

// Show registration form
function showRegister(eventId, eventType) {
    selectedEventId = eventId;
    selectedEventType = eventType;
    document.getElementById("registerFormSection").style.display = "block";

    // Show hackathon-specific fields only for hackathons
    const actionSelect = document.getElementById("hackathonAction");
    const teamInput = document.getElementById("teamNameOrCode");
    if(eventType === "hackathon") {
        actionSelect.style.display = "block";
        teamInput.style.display = "block";
    } else {
        actionSelect.style.display = "none";
        teamInput.style.display = "none";
    }
}


// Safe date formatting function
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
// Filter events by type
// Filter events by type
async function filterEvents(type) {
    try {
        const res = await fetch("/participant/events");
        const events = await res.json();
        const container = document.getElementById("eventsList");
        container.innerHTML = "";

        events
            .filter(e => type === "all" || e.type === type)
            .forEach(e => {
                const div = document.createElement("div");
                div.classList.add("event-card");
                
                let innerHTML = `
                    <div class="event-header">
                        <strong>${e.name}</strong> 
                        <span class="event-type">${e.type}</span>
                    </div>
                    <div class="event-details">
                        ${e.details ? `<p class="event-description">${e.details}</p>` : '<p>No details available</p>'}
                    </div>
                    <div class="event-meta">
                `;

                // ONLY show team size for hackathon events
                if (e.type === "hackathon") {
                    innerHTML += `
                        <div class="meta-item">
                            <i class="fa-solid fa-users"></i>
                            <span>Team Size: ${e.teamSize || 'Flexible'}</span>
                        </div>
                    `;
                }

                innerHTML += `
                        <div class="meta-item">
                            <i class="fa-solid fa-calendar"></i>
                            <span>${e.registrationDeadline ? 'Deadline: ' + formatDate(e.registrationDeadline) : 'No deadline'}</span>
                        </div>
                    </div>
                    <div class="event-actions">
                        <button onclick="showRegister('${e._id}','${e.type}')">Register</button>
                `;
                
                // ADD THIS: Show View Teams button only for hackathons
                if (e.type === "hackathon") {
                    innerHTML += `<button onclick="viewTeams('${e._id}')">View Teams</button>`;
                }
                innerHTML += `</div>`;
                div.innerHTML = innerHTML;
                container.appendChild(div);
            });
    } catch(err) {
        console.error("Failed to filter events:", err);
    }
}

// Register participant
async function registerParticipant() {
    const name = document.getElementById("participantName").value;
    const phone = document.getElementById("participantPhone").value;
    const skills = document.getElementById("participantSkills").value;
    const linkedin = document.getElementById("participantLinkedin").value;
    const action = document.getElementById("hackathonAction").value;
    const teamNameOrCode = document.getElementById("teamNameOrCode").value;


    localStorage.setItem('userName', name);
    localStorage.setItem('userPhone', phone);



     if (selectedEventType === "hackathon" && action === "ai_match") {
        await sendAIMatchRequest();   // ⬅️ Use request-based matching
        document.getElementById("registerForm").reset();
        document.getElementById("registerFormSection").style.display = "none";
        return;
    }
    
    let payload = { eventId: selectedEventId, name, phone, skills, linkedin };

    // Hackathon specific
    let url = "/participant/register";
    if(selectedEventType === "hackathon") {
        url = "/participant/register_hackathon";
        payload.action = action;
        if(action === "create") payload.teamName = teamNameOrCode, payload.teamSize = 4;
        if(action === "join") payload.teamCode = teamNameOrCode;
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        // Store team ID if it's returned (for hackathon events)
        if (data.teamId && selectedEventType === "hackathon") {
            localStorage.setItem('currentTeamId', data.teamId);
            localStorage.setItem('currentTeamSubmitted', 'false');
            
            // Show team submission section
            // showTeamSubmissionSection(data.teamId);
            viewTeams(selectedEventId);

        }
        
        // Show team code if it was created
        if (data.teamCode) {
            alert(`Team created successfully!\n\nTeam Code: ${data.teamCode}\n\nShare this code with your teammates so they can join your team.`);
            // Store team code for virtual events
            localStorage.setItem('currentTeamCode', data.teamCode);
        } else {
            alert(data.message || "Registered successfully!");
        }
        
        document.getElementById("registerForm").reset();
        document.getElementById("registerFormSection").style.display = "none";
    } catch(err) {
        console.error("Registration failed:", err);
        alert("Failed to register. Please try again.");
    }
}

// function showTeamSubmissionSection(teamId) {
//     const html = `
//         <div id="teamSubmission">
//             <h3>Team Submission</h3>
//             <p>Your team has been created. Please review and submit your team.</p>
//             <div id="teamMembersList"></div>
//             <button onclick="loadTeamStatus('${teamId}')">Check Team Status</button>
//             <button onclick="submitTeam('${teamId}')">Submit Team</button>
//             <p id="submissionStatus">loading sataus</p>
//         </div>
//     `;
    
//     // Add to your page where appropriate
//    const container = document.querySelector("mainContent") || document.body;
//     container.insertAdjacentHTML('beforeend', html);
//     loadTeamMembers(teamId);
//     loadTeamStatus(teamId);
// }

async function loadTeamMembers(teamId) {
    const res = await fetch(`/participant/team/${teamId}/status`);
    const team = await res.json();
    
    const container = document.getElementById("teamMembersList");
    container.innerHTML = "<h4>Team Members:</h4>";
    
    team.members.forEach(member => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p>${member.name} - ${member.skills || 'No skills listed'}</p>
        `;
        container.appendChild(div);
    });
    
    if (team.submitted) {
        document.getElementById("submissionStatus").textContent = 
            `Team submitted on ${new Date(team.submittedAt).toLocaleString()}`;
        document.querySelector("button[onclick=\"submitTeam('${teamId}')\"]").disabled = true;
    }
}

async function submitTeam(teamId) {
    try {
        // Get user details from localStorage or form
        const userName = localStorage.getItem('userName') || document.getElementById("participantName").value;
        const userPhone = localStorage.getItem('userPhone') || document.getElementById("participantPhone").value;
        
        if (!userName || !userPhone) {
            alert("Please provide your name and phone number to submit the team.");
            return;
        }
        
        const res = await fetch(`/participant/team/${teamId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                name: userName, 
                phone: userPhone 
            })
        });
        
        const data = await res.json();
        console.log("Submission response:", data);
        
        if (res.ok) {
            alert("Team submitted successfully!");
            localStorage.setItem('currentTeamSubmitted', 'true');
            loadTeamStatus(teamId);
        } else {
            alert("Error: " + (data.error || "Failed to submit team"));
        }
    } catch (error) {
        console.error("Submit team error:", error);
        alert("Failed to submit team. Please try again.");
    }
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

// ----------------------
// Team Viewing Functions
// ----------------------
// ----------------------
// Team Viewing Functions
// ----------------------
let currentEventId = null;

function viewTeams(eventId) {
    requireLogin(() => {
        currentEventId = eventId;
        showTeamsSection();
        loadTeams(eventId);
    }, 'teams');
}

function showTeamsSection() {
    // Hide other sections
    document.getElementById("eventsList").style.display = "none";
    document.getElementById("registerFormSection").style.display = "none";
    
    // Show teams section
    const teamsSection = document.getElementById("teamsSection");
    if (!teamsSection) {
        createTeamsSection();
    } else {
        teamsSection.style.display = "block";
    }
}

function createTeamsSection() {
    const mainContent = document.getElementById("eventsList").parentElement;
    
    const teamsSection = document.createElement("section");
    teamsSection.id = "teamsSection";
    teamsSection.innerHTML = `
        <h2>Teams for Event</h2>
        <div id="teamsList"></div>
        <button onclick="hideTeams()">Back to Events</button>
    `;
    
    mainContent.appendChild(teamsSection);
}

function hideTeams() {
    document.getElementById("teamsSection").style.display = "none";
    document.getElementById("eventsList").style.display = "block";
    document.getElementById("teamsList").innerHTML = "";
}




async function loadTeams(eventId) {
    try {
        const res = await fetch(`/participant/teams/${eventId}`);
        const teams = await res.json();
        const container = document.getElementById("teamsList");
        
        container.innerHTML = "";
        if (teams.length === 0) {
            container.innerHTML = "<p>No teams created yet for this event.</p>";
            return;
        }
        // In the loadTeams function, add a manage requests button
        

        teams.forEach(team => {
            const div = document.createElement("div");
            div.classList.add("team-card");
            div.style.border = "1px solid #ddd";
            div.style.padding = "15px";
            div.style.marginBottom = "15px";
            div.style.borderRadius = "8px";


            let teamHTML = `
                <h3>${team.teamName}</h3>
                <p><strong>Team Size:</strong> ${team.members.length}/${team.teamSize}</p>
                <p><strong>Members:</strong></p>
                <ul>`;


            team.members.forEach(member => {
                teamHTML += `<li>${member.name} (${member.skills || 'No skills listed'})</li>`;
            });
            
            teamHTML += `
                </ul>
                <p><strong>Team Code:</strong> ${team.teamCode}</p>
                <div id="teamStatus-${team._id}">Loading status...</div>

            `;

            // Add after rendering team.members
            if (team._id === localStorage.getItem('pendingTeamId')) {
                // Only show if user is not already in the team
                if (!isCurrentUserTeamMember(team)) {
                    teamHTML += `
                        <p style="color: orange;">
                            <i class="fa-solid fa-clock"></i>
                            Your join request is pending approval...
                        </p>
                    `;
                }
            }


            if (isCurrentUserTeamMember(team)) {
                teamHTML += `
                    <button onclick="submitTeam('${team._id}')" class="primary-btn">
                        <i class="fa-solid fa-paper-plane"></i> Submit Team
                    </button>
                    <button onclick="loadTeamStatus('${team._id}')" class="primary-btn">
                        <i class="fa-solid fa-refresh"></i> Check Status
                    </button>
                     <button onclick="viewTeamRequests('${team._id}')" class="primary-btn">
                        <i class="fa-solid fa-envelope"></i> Manage Requests
                    </button>
                `;
             } 
            // else {
            //     teamHTML += `
            //         <button onclick="joinTeam('${teamCode}')" class="primary-btn">
            //             <i class="fa-solid fa-user-plus"></i> Join Team
            //         </button>
            //     `;
            // }

            div.innerHTML = teamHTML;
            container.appendChild(div);
            
            // Load initial status for each team
            loadTeamStatus(team._id);
        });
    } catch (err) {
        console.error("Failed to load teams:", err);
        alert("Failed to load teams. Please try again.");
    }
}



async function loadTeamStatus(teamId) {
    try {
        const res = await fetch(`/participant/team/${teamId}/status`);
        const team = await res.json();
        
        const statusElement = document.getElementById(`teamStatus-${teamId}`);
        if (!statusElement) return;
        
        if (team.submitted) {
            statusElement.innerHTML = `
                <p style="color: green;">
                    <i class="fa-solid fa-check"></i> 
                    Team submitted on ${new Date(team.submittedAt).toLocaleString()}
                </p>
            `;
            
            // Disable submit button if team is already submitted
            const submitButton = document.querySelector(`button[onclick="submitTeam('${teamId}')"]`);
            if (submitButton) submitButton.disabled = true;
        } else {
            statusElement.innerHTML = `
                <p style="color: orange;">
                    <i class="fa-solid fa-clock"></i> 
                    Team not submitted yet
                </p>
            `;
        }
    } catch (err) {
        console.error("Failed to load team status:", err);
        const statusElement = document.getElementById(`teamStatus-${teamId}`);
        if (statusElement) {
            statusElement.innerHTML = `<p style="color: red;">Error loading status</p>`;
        }
    }
}




// async function loadTeamStatus(teamId) {
//     try {
//         const res = await fetch(`/participant/team/${teamId}/status`);
//         const team = await res.json();
        
//         const statusElement = document.getElementById("submissionStatus");
//         const submitButton = document.querySelector(`button[onclick="submitTeam('${teamId}')"]`);
        
//         if (team.submitted) {
//             statusElement.textContent = `Team submitted on ${new Date(team.submittedAt).toLocaleString()}`;
//             if (submitButton) submitButton.disabled = true;
//         } else {
//             statusElement.textContent = "Team not submitted yet";
//             if (submitButton) submitButton.disabled = false;
//         }
//     } catch (err) {
//         console.error("Failed to load team status:", err);
//     }
// }

function isCurrentUserTeamMember(team) {
    const userName = localStorage.getItem('userName');
    const userPhone = localStorage.getItem('userPhone');
    
    if (!userName || !userPhone) return false;
    
    return team.members.some(member => 
        member.name === userName && member.phone === userPhone
    );
}

function joinTeam(teamCode) {
    // Pre-fill the team code and set action to join
    document.getElementById("teamNameOrCode").value = teamCode;
    document.getElementById("hackathonAction").value = "join";
    
    // Store the team code temporarily (will be replaced with actual team ID after registration)
    localStorage.setItem('pendingTeamCode', teamCode);
    
    // Show the registration form
    showRegister();
    
    // Hide teams section
    hideTeams();
}



// ----------------------
// Virtual Event Function
// ----------------------
function openVirtualEvent() {
    requireLogin(() => {
        window.location.href = "/virtual_event.html";
    }, "virtual_event");
}






// AI Match Request function
async function sendAIMatchRequest() {
    const name = document.getElementById("participantName").value;
    const phone = document.getElementById("participantPhone").value;
    const skills = document.getElementById("participantSkills").value;
    const linkedin = document.getElementById("participantLinkedin").value;

    try {
        const res = await fetch("/participant/ai_match_request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventId: selectedEventId,
                name, phone, skills, linkedin
            })
        });
        
        const data = await res.json();
        alert(data.message || "Request sent successfully!");
        
        if (data.teamId) {
            localStorage.setItem('pendingTeamId', data.teamId);
            localStorage.setItem('pendingTeamStatus', 'waiting');
            alert(`${data.message}\n\nYou will see this team once they approve your request.`);
            // Store team ID for future reference
            localStorage.setItem('currentTeamId', data.teamId);

            viewTeams(selectedEventId);
        }
    } catch (err) {
        console.error("Request failed:", err);
        alert("Failed to send request. Please try again.");
    }
}

// Function to view and manage team requests
async function viewTeamRequests(teamId) {
    try {
        const res = await fetch(`/participant/team/${teamId}/requests`);
        const requests = await res.json();
        
        // Display requests in a modal or dedicated section
        showRequestsModal(requests, teamId);
    } catch (err) {
        console.error("Failed to load requests:", err);
    }
}

// Function to show requests modal
function showRequestsModal(requests, teamId) {
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
    modal.style.zIndex = "1000";
    
    let requestsHTML = `<div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; max-height: 80vh; overflow-y: auto;">
        <h2>Team Join Requests</h2>`;
    
    if (requests.length === 0) {
        requestsHTML += `<p>No pending requests</p>`;
    } else {
        requests.forEach(req => {
            requestsHTML += `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
                    <h3>${req.name}</h3>
                    <p><strong>Skills:</strong> ${req.skills || 'Not specified'}</p>
                    <p><strong>Email:</strong> ${req.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> ${req.phone || 'Not provided'}</p>
                    <div>
                        <button onclick="acceptRequest('${req._id}')">Accept</button>
                        <button onclick="rejectRequest('${req._id}')">Reject</button>
                    </div>
                </div>
            `;
        });
    }
    
    requestsHTML += `<button onclick="this.parentElement.parentElement.remove()">Close</button></div>`;
    modal.innerHTML = requestsHTML;
    
    document.body.appendChild(modal);
}

// Functions to handle accept/reject
async function acceptRequest(requestId) {
    try {
        const res = await fetch(`/participant/request/${requestId}/accept`, {
            method: "POST"
        });
        const data = await res.json();
        alert(data.message);
        // Refresh the page or update UI
        location.reload();
    } catch (err) {
        console.error("Failed to accept request:", err);
    }
}

async function rejectRequest(requestId) {
    try {
        const res = await fetch(`/participant/request/${requestId}/reject`, {
            method: "POST"
        });
        const data = await res.json();
        alert(data.message);
        // Refresh the page or update UI
        location.reload();
    } catch (err) {
        console.error("Failed to reject request:", err);
    }
}