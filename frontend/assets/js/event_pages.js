// In your event_pages.js, update the loadEventDetails function
async function loadEventDetails(type){
    // Get event ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    
    const res = await fetch("/participant/events");
    const events = await res.json();
    
    let e;
    if (eventId) {
        // Find the specific event by ID
        e = events.find(ev => ev._id === eventId);
    } else {
        // Fallback: find by type
        e = events.find(ev => ev.type === type);
    }
    
    if(!e) {
        document.getElementById(`${type}Details`).innerHTML = "<p>Event not found</p>";
        return;
    }
    
    // Display event details in a user-friendly format
    document.getElementById(`${type}Details`).innerHTML = `
        <h2>${e.name}</h2>
        <p><strong>Type:</strong> ${e.type}</p>
        <p><strong>Details:</strong> ${e.details || "No details available"}</p>
    `;
    
    // Store the event ID for registration
    window.currentEventId = e._id;
    window.currentEventType = e.type;
}

// Update the registerEvent function to use the stored event ID
async function registerEvent(type){
    const name = document.getElementById("participantName").value;
    const phone = document.getElementById("participantPhone").value;
    const email = document.getElementById("participantEmail").value;

    await fetch("/participant/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            eventId: window.currentEventId || "", 
            eventType: type, 
            name, 
            phone, 
            email: email || "demo@example.com"
        })
    });
    alert("Registered for " + type);
    document.getElementById("participantName").value = "";
    document.getElementById("participantPhone").value = "";
    if (email) document.getElementById("participantEmail").value = "";
}

// Form submit listeners
document.addEventListener("DOMContentLoaded", () => {
    ["hackathon","webinar","conference","workshop"].forEach(type=>{
        const form = document.getElementById(`${type}RegisterForm`);
        if(form){
            form.addEventListener("submit", e=>{
                e.preventDefault();
                registerEvent(type);
            });
        }
        loadEventDetails(type);
    });
});
