from flask import Blueprint, request, jsonify, session
from backend.models.user import create_user, authenticate_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    user_id = create_user(data["email"], data["password"], data["role"])
    if user_id:
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "User already exists"})

@auth_bp.route("/signin", methods=["POST"])
def signin():
    data = request.get_json()
    user = authenticate_user(data["email"], data["password"])
    if user:
        # ✅ Set consistent session flags
        session["logged_in"] = True
        session["role"] = user["role"]
        session["email"] = user["email"]
        session["user"] = user  # optional, you can use either 'user' or individual fields
        return jsonify({
            "success": True,
            "redirect": "/",
            "role": user["role"],
            "email": user["email"]
        })
    return jsonify({"success": False, "message": "Invalid credentials"})

@auth_bp.route("/auth/check_session")
def check_session():
    if session.get("logged_in"):
        return jsonify({
            "loggedIn": True,
            "user": {
                "email": session.get("email"),
                "role": session.get("role")
            }
        })
    return jsonify({"loggedIn": False})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Clear the session
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})