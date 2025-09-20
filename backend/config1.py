from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = "supersecretkey"
CORS(app, supports_credentials=True)

app.config["MONGO_URI"] = "mongodb+srv://Mdsaifali:Saif6343@saif1.n5mqz1l.mongodb.net/event_platform"
mongo = PyMongo(app)
