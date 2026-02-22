from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["study_bot"]

users = db["users"]
chat_collection = db["chats"]
audit_collection = db["audit_logs"]
rate_limit_collection = db["rate_limits"]
notifications_collection = db["notifications"]
push_subscriptions = db["push_subscriptions"]