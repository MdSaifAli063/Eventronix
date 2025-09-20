// Global state
let pendingTab = null;
let selectedEventType = null;
let userRole = null; // 'participant' or 'organizer'
let currentActiveTab = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkLoginAndInit();
    setInitialActiveTab();

    // Load pending tab from localStorage if any (only if user is logged in)
    if (userRole) {
        const storedTab = localStorage.getItem("pendingTab");
        if (storedTab) {
            pendingTab = storedTab;
            currentActiveTab = storedTab;

            loadTab(pendingTab);
            localStorage.removeItem("pendingTab");
        }else {
            // Show default content if no pending tab
            loadTab('default');
        }
    }else {
        // Show default content for non-logged in users
        loadTab('default');
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await registerParticipant();
        });
    }

});

function setInitialActiveTab() {
   const tabs = document.querySelectorAll('#eventTabs button');
    tabs.forEach(t => t.classList.remove('active'));
}

// ----------------------
// Login & Role Check
// ----------------------
async function checkLoginAndInit() {
    try {
        const res = await fetch("/auth/check_session");
        const data = await res.json();
        
        if (data.loggedIn) {
            userRole = data.user.role; // Fixed: access role from user object
            localStorage.setItem('userEmail', data.user.email);
            document.getElementById("userEmail").textContent = data.user.email;
            await loadEvents();
        } else {
            console.log("User not logged in. Tabs will redirect to login.");
        }
    } catch (err) {
        console.error("Session check failed:", err);
    }
}

// ----------------------
// Require Login Wrapper
// ----------------------
async function requireLogin(actionCallback, intendedTab = null) {
    try {
        const res = await fetch("/auth/check_session");
        const data = await res.json();

        if (!data.loggedIn) {
            if (intendedTab) {
                localStorage.setItem("pendingTab", intendedTab);
                // Add the tab to the redirect URL
                window.location.href = `/signin?redirect=/?tab=${intendedTab}`;
            } else {
                window.location.href = "/signin?redirect=/";
            }
        } else {
            actionCallback();
        }
    } catch (err) {
        console.error("Login check failed:", err);
        window.location.href = "/signin?redirect=/";
    }
}

// ----------------------
// Tab Navigation
// ----------------------
// ----------------------
// Tab Navigation (FIXED)
// ----------------------
function navigateTo(tab, event) {
    requireLogin(() => {
        // Update active tab styling
        const tabs = document.querySelectorAll('#eventTabs button');
        tabs.forEach(t => t.classList.remove('active'));


        if (currentActiveTab === tab) {
            currentActiveTab = null;
            loadTab('default'); // Show default content
            return;
        }

        currentActiveTab = tab;
        
        // Add active class to clicked button
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        } else {
            // Fallback: find button by tab name
            const tabButton = Array.from(tabs).find(btn => 
                btn.textContent.toLowerCase().includes(tab.toLowerCase())
            );
            if (tabButton) tabButton.classList.add('active');
        }
        
        pendingTab = tab;
        loadTab(tab);
    }, tab);
}

function loadTab(tab) {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    // Clear previous content
    mainContent.innerHTML = "";
    
    switch(tab) {
        case "hackathon":
            window.location.href = "/event_pages/hackathon.html"
            break;
        case "webinar":
            window.location.href = "/event_pages/webinar.html"
            break;
        case "conference":
            window.location.href = "/event_pages/workshop.html"
            break;
        case "workshop":
            window.location.href = "/event_pages/conference.html"
            break;
            // mainContent.innerHTML = `<h2>${tab.charAt(0).toUpperCase() + tab.slice(1)} Events</h2>
            //                          <div id="eventsList"></div>`;
            // loadEvents(tab);

        case "virtual_event":
            window.location.href = "/virtual_event.html";
            break;

        // case "default":
        //     // Show the default dashboard content (feature cards, etc.)
        //     mainContent.innerHTML = `
        //         <div class="role-buttons">
        //             <button onclick="goToOrganizerDashboard()" class="btn btn-primary">Organizer Dashboard</button>
        //             <button onclick="goToParticipantDashboard()" class="btn btn-secondary">Participant Dashboard</button>
        //         </div>
        //         <div class="features-grid">
        //             <div class="feature-card">
        //                 <i class="fas fa-robot"></i>
        //                 <h3>AI Roadmap Generator</h3>
        //                 <p>Create detailed event plans with AI assistance for event organizer</p>
        //             </div>
        //             <div class="feature-card">
        //                 <i class="fas fa-users"></i>
        //                 <h3>AI Team Matching</h3>
        //                 <p>Find teammates based on skills and interests for hackathon events</p>
        //             </div>
        //             <div class="feature-card" onclick="navigateTo('virtual_event', event)">
        //                 <i class="fas fa-video"></i>
        //                 <h3>Virtual Events</h3>
        //                 <p>Host engaging online events with chat and streaming</p>
        //             </div>
        //             <div class="feature-card">
        //                 <i class="fas fa-chart-line"></i>
        //                 <h3>Analytics</h3>
        //                 <p>Gain deep insights from participant and team data</p>
        //             </div>
        //         </div>
        //     `;
        //     break;
            
        default:
            mainContent.innerHTML = ``;
    }
}

// ----------------------
// Event Loading
// ----------------------
// ----------------------
// Event Loading (FIXED)
// ----------------------
async function loadEvents(eventType = null) {
    try {
        // Always use participant endpoint for common dashboard
        let url = "/participant/events";
        
        // Only add type filter if it's a specific event type (not "all")
        if (eventType && eventType !== "all") {
            url += `?type=${eventType}`;
        }

        const res = await fetch(url);
        const events = await res.json();
        const container = document.getElementById("eventsList");
        if (!container) return;

        container.innerHTML = "";
        
        if (events.length === 0) {
            const message = eventType ? `No ${eventType} events available yet.` : "No events available yet.";
            container.innerHTML = `<p>${message}</p>`;
            return;
        }

        events.forEach(e => {
            const div = document.createElement("div");
            div.classList.add("event-card");

            let innerHTML = `<strong>${e.name}</strong><br>
                             <em>Type: ${e.type}</em><br>
                             <p>${e.details || ""}</p>`;

            // Always show View/Register button on common dashboard
            innerHTML += `<button onclick="handleEventClick('${e._id}','${e.type}')">View / Register</button>`;

            div.innerHTML = innerHTML;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Failed to load events:", err);
        const container = document.getElementById("eventsList");
        if (container) {
            container.innerHTML = "<p>Failed to load events. Please try again.</p>";
        }
    }
}

// ----------------------
// Event Click Handling
// ----------------------
function handleEventClick(eventId, eventType) {
    requireLogin(() => {
        // Redirect to the specific event page based on event type
        switch(eventType) {
            case "hackathon":
                window.location.href = `/event_pages/hackathon.html?eventId=${eventId}`;
                break;
            case "webinar":
                window.location.href = `/event_pages/webinar.html?eventId=${eventId}`;
                break;
            case "conference":
                window.location.href = `/event_pages/conference.html?eventId=${eventId}`;
                break;
            case "workshop":
                window.location.href = `/event_pages/workshop.html?eventId=${eventId}`;
                break;
            default:
                // For unknown types, show the register form as fallback
                selectedEventId = eventId;
                selectedEventType = eventType;
                showRegisterForm();
        }
    });
}

function showRegisterForm() {
    const registerSection = document.getElementById("registerFormSection");
    if (registerSection) {
        registerSection.style.display = "block";
        
        // Show hackathon-specific fields only for hackathons
        const hackathonFields = document.getElementById("hackathonFields");
        if (selectedEventType === "hackathon") {
            hackathonFields.style.display = "block";
        } else {
            hackathonFields.style.display = "none";
        }
    }
}

function hideRegisterForm() {
    const registerSection = document.getElementById("registerFormSection");
    if (registerSection) {
        registerSection.style.display = "none";
    }
}

// Add event listener for registration form
// document.addEventListener("DOMContentLoaded", () => {
//     const registerForm = document.getElementById("registerForm");
//     if (registerForm) {
//         registerForm.addEventListener("submit", async (e) => {
//             e.preventDefault();
//             await registerParticipant();
//         });
//     }
// });

// Registration function
async function registerParticipant() {
    const name = document.getElementById("participantName").value;
    const phone = document.getElementById("participantPhone").value;
    const email = document.getElementById("participantEmail").value;
    const skills = document.getElementById("participantSkills").value;
    const linkedin = document.getElementById("participantLinkedin").value;
    
    let payload = {
        eventId: selectedEventId,
        name, phone, email, skills, linkedin
    };
    
    // Add hackathon-specific data if applicable
    if (selectedEventType === "hackathon") {
        const action = document.getElementById("hackathonAction").value;
        const teamNameOrCode = document.getElementById("teamNameOrCode").value;
        payload.action = action;
        
        if (action === "create") {
            payload.teamName = teamNameOrCode;
            payload.teamSize = 4;
        } else if (action === "join") {
            payload.teamCode = teamNameOrCode;
        }
    }
    
    try {
        const url = selectedEventType === "hackathon" 
            ? "/participant/register_hackathon" 
            : "/participant/register";
            
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        alert(data.message || "Registered successfully!");
        hideRegisterForm();
        document.getElementById("registerForm").reset();
    } catch (err) {
        console.error("Registration failed:", err);
        alert("Failed to register. Please try again.");
    }
}

// ----------------------
// Analytics (Organizer)
// ----------------------
async function loadAnalytics(eventId) {
    try {
        const res = await fetch(`/organizer/${eventId}/analytics`);
        const data = await res.json();
        alert(`Participants: ${data.participant_count}\nTeams: ${data.team_count}`);
    } catch (err) {
        console.error("Failed to load analytics:", err);
    }
}

// Add these functions to handle the role buttons
function goToOrganizerDashboard() {
    requireLogin(() => {
        window.location.href = "/organizer_dashboard.html";
    }, "organizer_dashboard");
}

function goToParticipantDashboard() {
    requireLogin(() => {
        window.location.href = "/participant_dashboard.html";
    }, "participant_dashboard");
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


// Add this to checkLoginAndInit() function
console.log("Session data:", data);
console.log("User role:", userRole);