from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Added timeout to prevent hanging if URI is wrong
client = MongoClient(os.getenv("MONGO_URI"), serverSelectionTimeoutMS=5000)
db = client["study_bot"]

print("🚀 Study Bot Database Connection Initialized")

users = db["users"]
chat_collection = db["chats"]
audit_collection = db["audit_logs"]
rate_limit_collection = db["rate_limits"]
notifications_collection = db["notifications"]
push_subscriptions = db["push_subscriptions"]