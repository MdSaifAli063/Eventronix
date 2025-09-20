from backend.config import mongo
from bson.objectid import ObjectId

def register_participant(event_id, participant):
    participant["eventId"] = ObjectId(event_id)
    return mongo.db.registrations.insert_one(participant).inserted_id

def get_registrations(event_id):
    regs = list(mongo.db.registrations.find({"eventId": ObjectId(event_id)}))
    for r in regs:
        r["_id"] = str(r["_id"])
    return regs
