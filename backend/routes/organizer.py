from flask import Blueprint, request, jsonify, Response, session
from backend.config import mongo
from bson.objectid import ObjectId
import csv, io
from backend.utils.ai_roadmap import generate_roadmap
from datetime import datetime, timezone

organizer_bp = Blueprint("organizer", __name__)

# Helper: check organizer session
def require_organizer(func):
    def wrapper(*args, **kwargs):
        if not session.get("logged_in") or session.get("role") != "organizer":
            return jsonify({"error":"Unauthorized"}), 403
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@organizer_bp.route("/organizer/create_event", methods=["POST"])
@require_organizer
def create_event():
    data = request.get_json()
    team_size = data.get("teamSize", 4)
    details = data.get("details", "") 

    deadline = None
    if data.get("registrationDeadline"):
        try:
            deadline = datetime.fromisoformat(data["registrationDeadline"].replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"error": "Invalid deadline format"}), 400
        

    event_id = mongo.db.events.insert_one({
        "name": data["name"],
        "type": data["type"],
        "teamSize": team_size,
        "details": details,
        "registrationDeadline": deadline,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }).inserted_id
    return jsonify({"message": "Event created", "eventId": str(event_id)})


@organizer_bp.route("/organizer/event/<event_id>")
@require_organizer
def get_event(event_id):
    event = mongo.db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        return jsonify({"error": "Event not found"}), 404
    event["_id"] = str(event["_id"])
    return jsonify(event)

@organizer_bp.route("/organizer/event/<event_id>/deadline", methods=["POST"])
@require_organizer
def update_deadline(event_id):
    data = request.get_json()
    
    # Parse new deadline
    try:
        new_deadline = datetime.fromisoformat(data["deadline"].replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"error": "Invalid deadline format"}), 400
    
    # Update event with new deadline
    mongo.db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {
            "registrationDeadline": new_deadline,
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    return jsonify({"message": "Deadline updated successfully"})

@organizer_bp.route("/organizer/event/<event_id>/registration_status")
@require_organizer
def registration_status(event_id):
    event = mongo.db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    # Check if registration is open
    now = datetime.now(timezone.utc)
    deadline = event.get("registrationDeadline")
    is_open = True
    
    if deadline and deadline < now:
        is_open = False
    
    # Get registration count
    reg_count = mongo.db.registrations.count_documents({"eventId": ObjectId(event_id)})
    
    return jsonify({
        "registrationOpen": is_open,
        "deadline": deadline.isoformat() if deadline else None,
        "participantsCount": reg_count
    })

@organizer_bp.route("/organizer/events", methods=["GET"])
@require_organizer
def events():
    events = list(mongo.db.events.find({}))
    for e in events: 
        e["_id"] = str(e["_id"])
        # Convert datetime to ISO string
        if e.get("registrationDeadline"):
            e["registrationDeadline"] = e["registrationDeadline"].isoformat()
    return jsonify(events)

@organizer_bp.route("/organizer/<event_id>/participants")
@require_organizer
def participants(event_id):
    regs = list(mongo.db.registrations.find({"eventId": ObjectId(event_id)}))
    for r in regs: r["_id"] = str(r["_id"])
    return jsonify(regs)

@organizer_bp.route("/organizer/<event_id>/teams")
@require_organizer
def teams(event_id):
    teams = list(mongo.db.teams.find({"eventId": ObjectId(event_id)}))
    for t in teams: t["_id"] = str(t["_id"])
    return jsonify(teams)

@organizer_bp.route("/organizer/<event_id>/analytics")
@require_organizer
def analytics(event_id):
    p_count = mongo.db.registrations.count_documents({"eventId": ObjectId(event_id)})
    t_count = mongo.db.teams.count_documents({"eventId": ObjectId(event_id)})
    return jsonify({"participant_count": p_count, "team_count": t_count})

@organizer_bp.route("/organizer/<event_id>/export")
@require_organizer
def export_csv(event_id):
    regs = list(mongo.db.registrations.find({"eventId": ObjectId(event_id)}))
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["name", "email", "phone", "skills", "linkedin"])
    writer.writeheader()
    for r in regs:
        writer.writerow({
            "name": r.get("name", ""),
            "email": r.get("email", ""),
            "phone": r.get("phone", ""),
            "skills": r.get("skills", ""),
            "linkedin": r.get("linkedin", "")
        })
    response = Response(output.getvalue(), mimetype="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=participants_{event_id}.csv"
    return response

# Dynamic AI Roadmap per event type
@organizer_bp.route("/organizer/<event_id>/ai_roadmap", methods=["GET"])
@require_organizer
def ai_roadmap(event_id):
    event = mongo.db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        return jsonify({"error":"Event not found"}), 404
    roadmap_steps = generate_roadmap(event["type"])
    return jsonify({"event": event["name"], "roadmap": roadmap_steps})



@organizer_bp.route("/organizer/<event_id>/submitted_teams")
@require_organizer
def submitted_teams(event_id):
    teams = list(mongo.db.teams.find({
        "eventId": ObjectId(event_id),
        "submitted": True
    }))
    
    for t in teams:
        t["_id"] = str(t["_id"])
        t["eventId"] = str(t["eventId"])
    
    return jsonify(teams)







@organizer_bp.route("/organizer/submitted-teams")
@require_organizer
def get_submitted_teams():
    try:
        event_id = request.args.get("eventId")
        query = {"submitted": True}
        if event_id:
            query["eventId"] = ObjectId(event_id)
            
        teams = list(mongo.db.teams.find(query).sort("submittedAt", -1))
        
        for team in teams:
            team["_id"] = str(team["_id"])
            team["eventId"] = str(team["eventId"])
            
            # Get event details
            event = mongo.db.events.find_one({"_id": ObjectId(team["eventId"])})
            team["eventName"] = event["name"] if event else "Unknown Event"
            
            # Ensure all fields exist
            team["teamCode"] = team.get("teamCode", "N/A")
            team["teamSize"] = team.get("teamSize", 4)
            team["status"] = team.get("status", "pending")
            team["submittedAt"] = team.get("submittedAt", datetime.utcnow())
            
            # Ensure each member has all fields
            for member in team.get("members", []):
                member.setdefault("phone", "Not provided")
                member.setdefault("email", "Not provided")
                member.setdefault("skills", "No skills listed")
                member.setdefault("linkedin", "No LinkedIn provided")
                
        return jsonify(teams)
    except Exception as e:
        return jsonify({"error": str(e)}), 500