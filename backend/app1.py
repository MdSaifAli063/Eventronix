import os
from flask import send_from_directory, session, redirect, url_for
from backend.config import app as flask_app
from backend.routes.auth import auth_bp
from backend.routes.organizer import organizer_bp
from backend.routes.participant import participant_bp
from backend.routes.collaboration import collab_bp
from backend.routes.virtual_event import virtual_bp

# Register blueprints
app = flask_app
app.register_blueprint(auth_bp) 
app.register_blueprint(organizer_bp)
app.register_blueprint(participant_bp)
app.register_blueprint(collab_bp)
app.register_blueprint(virtual_bp)

# Path to frontend folder
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

# Root → always show common dashboard
@app.route("/")
def serve_dashboard():
    return send_from_directory(FRONTEND_DIR, "common_dashboard.html")

# Explicit login page
@app.route("/signin")
def serve_signin():
    return send_from_directory(FRONTEND_DIR, "signin.html")

# Serve signup page
@app.route("/signup")  
def serve_signup():
    return send_from_directory(FRONTEND_DIR, "signup.html")

# Serve assets (CSS, JS, etc.)
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

if __name__ == "__main__":
    app.run(debug=True)
