from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "supersecretkey")
CORS(app, supports_credentials=True)

# Use environment variable for MongoDB URI with fallback
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "")
mongo = PyMongo(app)
