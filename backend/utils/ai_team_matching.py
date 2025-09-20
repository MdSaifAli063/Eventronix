from backend.config import mongo
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from bson.objectid import ObjectId
import random

def ai_match_team(event_id, skills):
    event_id = ObjectId(event_id)
    teams = list(mongo.db.teams.find({"eventId": event_id}))
    
    if not teams:
        return None
    
    # Filter teams that are not full and have available slots
    available_teams = [t for t in teams if len(t.get("members", [])) < t.get("teamSize", 4)]
    
    if not available_teams:
        return None
    
    team_texts = []
    team_ids = []
    
    for t in available_teams:
        members_skills = " ".join([m.get("skills","") for m in t.get("members",[])])
        team_texts.append(members_skills)
        team_ids.append(t["_id"])
    
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(team_texts + [skills])
    similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
    
    if similarities.max() == 0:
        # If no good match, select a random team
        best_idx = random.randint(0, len(available_teams) - 1)
    else:
        best_idx = similarities.argmax()
    
    best_team = mongo.db.teams.find_one({"_id": team_ids[best_idx]})
    return best_team