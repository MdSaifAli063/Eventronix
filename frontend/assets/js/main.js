document.addEventListener("DOMContentLoaded", function() {
    const authForm = document.getElementById("authForm");
    if (!authForm) return;

    authForm.addEventListener("submit", async e => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        // Check if we're on signup page (has role field)
        const roleField = document.getElementById("role");
        const role = roleField ? roleField.value : null;
        
        // Determine action based on which page we're on
        const isSignupPage = window.location.pathname.includes('signup.html');
        const action = isSignupPage ? "signup" : "signin";

        try {
            let res;
            if (action === "signup") {
                res = await fetch("/signup", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({ email, password, role })
                });
            } else {
                res = await fetch("/signin", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({ email, password })
                });
            }

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Something went wrong");
                return;
            }

            // Save user session
            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("userEmail", data.email);

            // Redirect on success
            window.location.href = "/";

        } catch (err) {
            console.error("Auth error:", err);
            alert("An error occurred. Please try again.");
        }

    }); // closes the submit listener
}); // closes DOMContentLoaded


    // After login, redirect to dashboard and load pending tab if any

   



    // ----------------------

    // const pendingTab = localStorage.getItem("pendingTab");
    // if (pendingTab) {
    //     window.location.href = "/"; // dashboard
    //     setTimeout(() => {
    //         if (window.loadTab) loadTab(pendingTab);
    //         localStorage.removeItem("pendingTab");
    //     }, 100);
    // } else {
    //     if (data.role === "organizer") {
    //         window.location.href = "organizer_dashboard.html";
    //     } else {
    //         window.location.href = "participant_dashboard.html";
    //     }
    // }

