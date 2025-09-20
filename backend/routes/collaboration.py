from flask import Blueprint, request, jsonify
from backend.config import mongo
from bson.objectid import ObjectId
from datetime import datetime

collab_bp = Blueprint("collab", __name__)

@collab_bp.route("/collaboration/chat/<team_id>", methods=["GET","POST"])
def chat(team_id):
    if request.method=="POST":
        data=request.get_json()
        msg={"teamId":team_id,"sender":data["sender"],"message":data["message"]}
        mongo.db.chat.insert_one(msg)
        return jsonify({"message":"Sent"}),201
    else:
        msgs=list(mongo.db.chat.find({"teamId":team_id}))
        for m in msgs:m["_id"]=str(m["_id"])
        return jsonify(msgs)

@collab_bp.route("/collaboration/poll/<team_id>", methods=["GET","POST"])
def poll(team_id):
    if request.method=="POST":
        data=request.get_json()
        p={"teamId":team_id,"question":data["question"],"options":data["options"],"votes":[0]*len(data["options"])}
        mongo.db.polls.insert_one(p)
        return jsonify({"message":"Poll created"}),201
    else:
        polls=list(mongo.db.polls.find({"teamId":team_id}))
        for p in polls:p["_id"]=str(p["_id"])
        return jsonify(polls)

@collab_bp.route("/collaboration/vote/<poll_id>", methods=["POST"])
def vote(poll_id):
    data=request.get_json()
    p=mongo.db.polls.find_one({"_id":ObjectId(poll_id)})
    if not p: return jsonify({"error":"Poll not found"}),404
    votes=p["votes"]
    votes[data["optionIndex"]]+=1
    mongo.db.polls.update_one({"_id":ObjectId(poll_id)},{"$set":{"votes":votes}})
    return jsonify({"message":"Voted"}),200

@collab_bp.route("/collaboration/whiteboard/<team_id>", methods=["GET","POST", "DELETE"])
def whiteboard(team_id):
    if request.method == "POST":
        data = request.get_json()
        # Save drawing stroke with start and end points
        stroke = {
            "teamId":team_id,
            "x1": data["x1"], "y1": data["y1"],
            "x2": data["x2"], "y2": data["y2"],
            "color": data.get("color", "black"),
            "size": data.get("size", 3),
            "isErasing": data.get("isErasing", False),
            "timestamp": datetime.utcnow()
        }
        mongo.db.whiteboard.insert_one(stroke)
        return jsonify({"message": "Stroke saved"}), 201
        
    elif request.method == "DELETE":
        # Clear whiteboard
        mongo.db.whiteboard.delete_many({"teamId":team_id})
        return jsonify({"message": "Whiteboard cleared"}), 200
        
    else:
        strokes = list(mongo.db.whiteboard.find({"teamId":team_id}))
        for s in strokes: 
            s["_id"] = str(s["_id"])
            s["teamId"] = str(s["teamId"])
        return jsonify(strokes)