from backend.config import mongo
from bson.objectid import ObjectId

def create_event(name, event_type, details, deadline, team_size):
    event = {"name": name, "type": event_type, "details": details, "registrationDeadline": deadline, "teamSize": team_size}
    return mongo.db.events.insert_one(event).inserted_id

def get_events(event_type=None):
    query = {} if not event_type else {"type": event_type}
    events = list(mongo.db.events.find(query))
    for e in events:
        e["_id"] = str(e["_id"])
    return events
 