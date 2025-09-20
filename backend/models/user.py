from backend.config import mongo
from werkzeug.security import generate_password_hash, check_password_hash

def create_user(email, password, role):
    users = mongo.db.users   # ✅ Correct collection reference
    if users.find_one({"email": email}):
        return None
    
    hashed_password = generate_password_hash(password)
    user = {"email": email, "password": hashed_password, "role": role}
    return users.insert_one(user).inserted_id

def authenticate_user(email, password):
    users = mongo.db.users   # ✅ Correct collection reference
    user = users.find_one({"email": email})
    if user and check_password_hash(user["password"], password):
        return {"email": user["email"], "role": user["role"]}
    return None

def get_user(email):
    users = mongo.db.users   # ✅ Correct collection reference
    return users.find_one({"email": email})
