from backend.config import mongo
from bson.objectid import ObjectId

def create_team(event_id, team_name, team_size, members):
    team = {"eventId": ObjectId(event_id), "teamName": team_name, "teamSize": team_size, "members": members}
    return mongo.db.teams.insert_one(team).inserted_id

def get_teams(event_id):
    teams = list(mongo.db.teams.find({"eventId": ObjectId(event_id)}))
    for t in teams:
        t["_id"] = str(t["_id"])
    return teams
