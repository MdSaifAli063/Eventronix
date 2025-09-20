from flask import Blueprint, request, jsonify
from backend.config import mongo
from bson.objectid import ObjectId
from backend.utils.ai_team_matching import ai_match_team
import random
import string
from datetime import datetime, timezone

participant_bp = Blueprint("participant", __name__)

@participant_bp.route("/participant/events") 
def get_events():
    try:
        events = list(mongo.db.events.find({}))
        for e in events: 
            e["_id"]=str(e["_id"])
            e.setdefault("details", "")
            e.setdefault("teamSize",4)
            if e.get("registrationDeadline"):
                e["registrationDeadline"] = e["registrationDeadline"].isoformat()
            else:
                e["registrationDeadline"] = None


        return jsonify(events)
    except Exception as e:
            return jsonify({"error": str(e)}), 500

@participant_bp.route("/participant/register", methods=["POST"])
def register():
    data=request.get_json()
    event_id = ObjectId(data["eventId"])

    # Check if registration is still open
    event = mongo.db.events.find_one({"_id": event_id})
    if event and event.get("registrationDeadline"):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if now > event["registrationDeadline"]:
            return jsonify({"error": "Registration is closed for this event"}), 400
        
    mongo.db.registrations.insert_one({
        "eventId": ObjectId(data["eventId"]),
        "name": data["name"],
        "phone": data["phone"], "skills": data.get("skills",""), "linkedin": data.get("linkedin","")
    })
    return jsonify({"message":"Registered successfully"})

@participant_bp.route("/participant/register_hackathon", methods=["POST"])
def hackathon():
    data=request.get_json()
    event_id=ObjectId(data["eventId"])
    name, phone, skills, linkedin = data["name"], data["phone"], data.get("skills",""), data.get("linkedin","")
    action=data["action"]

    if action=="create":
        team_code = generate_team_code()
        team={"eventId":event_id,"teamName":data["teamName"],"teamSize":data["teamSize"], "teamCode": team_code,"members":[{"name":name,"phone":phone,"skills":skills,"linkedin":linkedin}]}
        team_id=mongo.db.teams.insert_one(team).inserted_id
        mongo.db.registrations.insert_one({"eventId":event_id,"teamId":team_id,"name":name,"phone":phone,"skills":skills,"linkedin":linkedin})
        return jsonify({
        "message": "Team created successfully", 
        "teamCode": team_code,  # ← Add this line
        "teamId": str(team_id)
        }), 201

    elif action=="join":
        team=mongo.db.teams.find_one({"teamCode":data["teamCode"]})
        if not team: return jsonify({"error":"Team not found"}),404
        mongo.db.teams.update_one({"_id":team["_id"]},{"$push":{"members":{"name":name,"phone":phone,"skills":skills,"linkedin":linkedin}}})
        mongo.db.registrations.insert_one({"eventId":event_id,"teamId":team["_id"],"name":name,"phone":phone,"skills":skills,"linkedin":linkedin})
        return jsonify({
        "message": "Joined team successfully",
        "teamCode": data["teamCode"],
        "teamId": str(team["_id"])
        }), 200


    elif action=="ai_match":
        team=ai_match_team(event_id,skills)
        if not team: 
            return jsonify({"message":"No match"}),200
        
        mongo.db.teams.update_one({"_id":team["_id"]},{"$push":{"members":{"name":name,"phone":phone,"skills":skills,"linkedin":linkedin}}})
        mongo.db.registrations.insert_one({"eventId":event_id,"teamId":team["_id"],"name":name,"phone":phone,"skills":skills,"linkedin":linkedin})
        # In both create and join actions, return the teamId
        return jsonify({
            "message": f"Matched with {team['teamName']}",
            "teamCode": team.get("teamCode", ""),  # ← Return team code if available
            "teamId": str(team["_id"])
        }), 200
    return jsonify({"error":"Invalid action"}),400




@participant_bp.route("/participant/teams/<event_id>")
def get_teams(event_id):
    try:
        teams = list(mongo.db.teams.find({"eventId": ObjectId(event_id)}))
        for team in teams:
            team["_id"] = str(team["_id"])
            team["eventId"] = str(team["eventId"])
        return jsonify(teams)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

def generate_team_code(length=6):
    """Generate a random team code with letters and numbers"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@participant_bp.route("/participant/team/<team_id>/submit", methods=["POST"])
def submit_team(team_id):
    data = request.get_json()
    
    # Verify the user is a member of this team
    team = mongo.db.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        return jsonify({"error": "Team not found"}), 404
    
    # Check if user is in the team
    
    user_name = data.get("name")
    user_phone = data.get("phone")

    if not user_name or not user_phone:
        return jsonify({"error": "Name and phone required for verification"}), 400

    is_member = any(
        member.get("name") == user_name and member.get("phone") == user_phone
        for member in team.get("members", [])
    )

    
    if not is_member:
        return jsonify({"error": "You are not a member of this team"}), 403
    
    # Submit the team
    mongo.db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$set": {
            "submitted": True,
            "submittedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    return jsonify({"message": "Team submitted successfully"})

@participant_bp.route("/participant/team/<team_id>/status")
def team_status(team_id):
    team = mongo.db.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        return jsonify({"error": "Team not found"}), 404
    
    return jsonify({
        "submitted": team.get("submitted", False),
        "submittedAt": team.get("submittedAt"),
        "members": team.get("members", [])
    })



@participant_bp.route("/participant/ai_match_request", methods=["POST"])
def ai_match_request():
    data = request.get_json()
    event_id = ObjectId(data["eventId"])
    name = data["name"]
    phone = data["phone"]
    skills = data.get("skills", "")
    linkedin = data.get("linkedin", "")
    email = data.get("email", "")
    
    # Find a matching team
    team = ai_match_team(event_id, skills)
    
    if not team:
        return jsonify({"message": "No suitable teams found"}), 200
    
    # Create a join request
    request_id = mongo.db.requests.insert_one({
        "eventId": event_id,
        "teamId": team["_id"],
        "userId": data.get("userId"),  # If you have user accounts
        "name": name,
        "phone": phone,
        "email": email,
        "skills": skills,
        "linkedin": linkedin,
        "status": "pending",
        "createdAt": datetime.utcnow()
    }).inserted_id
    
    # Add request to team's pending requests
    mongo.db.teams.update_one(
        {"_id": team["_id"]},
        {"$push": {"joinRequests": str(request_id)}}
    )
    
    return jsonify({
        "message": f"Request sent to {team['teamName']}",
        "teamId": str(team["_id"]),
        "requestId": str(request_id)
    }), 200

@participant_bp.route("/participant/team/<team_id>/requests")
def get_team_requests(team_id):
    requests = list(mongo.db.requests.find({"teamId": ObjectId(team_id), "status": "pending"}))
    for req in requests:
        req["_id"] = str(req["_id"])
        req["teamId"] = str(req["teamId"])
    return jsonify(requests)

@participant_bp.route("/participant/request/<request_id>/accept", methods=["POST"])
def accept_request(request_id):
    request_obj = mongo.db.requests.find_one({"_id": ObjectId(request_id)})
    
    if not request_obj:
        return jsonify({"error": "Request not found"}), 404
    
    # Add user to team
    mongo.db.teams.update_one(
        {"_id": request_obj["teamId"]},
        {"$push": {"members": {
            "name": request_obj["name"],
            "phone": request_obj["phone"],
            "email": request_obj["email"],
            "skills": request_obj["skills"],
            "linkedin": request_obj["linkedin"]
        }}}
    )
    
    # Update request status
    mongo.db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "accepted"}}
    )
    
    # Remove from team's pending requests
    mongo.db.teams.update_one(
        {"_id": request_obj["teamId"]},
        {"$pull": {"joinRequests": request_id}}
    )
    
    # Create registration
    mongo.db.registrations.insert_one({
        "eventId": request_obj["eventId"],
        "teamId": request_obj["teamId"],
        "name": request_obj["name"],
        "phone": request_obj["phone"],
        "email": request_obj["email"],
        "skills": request_obj["skills"],
        "linkedin": request_obj["linkedin"]
    })
    
    return jsonify({"message": "Request accepted"}), 200

@participant_bp.route("/participant/request/<request_id>/reject", methods=["POST"])
def reject_request(request_id):
    request_obj = mongo.db.requests.find_one({"_id": ObjectId(request_id)})
    
    if not request_obj:
        return jsonify({"error": "Request not found"}), 404
    
    # Update request status
    mongo.db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected"}}
    )
    
    # Remove from team's pending requests
    mongo.db.teams.update_one(
        {"_id": request_obj["teamId"]},
        {"$pull": {"joinRequests": request_id}}
    )
    
    return jsonify({"message": "Request rejected"}), 200