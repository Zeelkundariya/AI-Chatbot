from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import os, asyncio, time
import sentry_sdk
from app.database import *
from app.models import *
from app.auth import *
from app.chatbot import chat_with_bot, generate_quiz_logic
from app.rag import process_pdf
from fastapi import UploadFile, File
import shutil
from pywebpush import webpush
from email.message import EmailMessage
import smtplib

dsn = os.getenv("SENTRY_DSN")
if dsn and dsn != "YOUR_SENTRY_DSN":
    sentry_sdk.init(dsn=dsn, traces_sample_rate=1.0)

app = FastAPI(title="Study Bot Elite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Utilities ----------
def log_action(actor, action, target=None):
    audit_collection.insert_one({
        "actor": actor,
        "action": action,
        "target": target,
        "time": datetime.utcnow()
    })

def send_email(subject, body):
    msg = EmailMessage()
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = os.getenv("ADMIN_EMAIL")
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(os.getenv("EMAIL_HOST"), 587) as s:
        s.starttls()
        s.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
        s.send_message(msg)

# ---------- Rate Limit ----------
def rate_limit(user):
    now = datetime.utcnow()
    r = rate_limit_collection.find_one({"user": user})
    if not r:
        rate_limit_collection.insert_one({"user": user, "count": 1, "time": now})
        return
    if (now - r["time"]).seconds > 60:
        rate_limit_collection.update_one({"user": user}, {"$set": {"count": 1, "time": now}})
        return
    if r["count"] >= 10:
        send_email("Rate limit", f"{user} exceeded limit")
        raise HTTPException(429, "Rate limit exceeded")
    rate_limit_collection.update_one({"user": user}, {"$inc": {"count": 1}})

# ---------- Auth ----------
@app.post("/register")
def register(user: User):
    hashed = hash_password(user.password)
    users.insert_one({**user.dict(), "password": hashed, "blocked": False})
    return {"msg": "registered"}

@app.post("/login")
def login(user: User):
    u = users.find_one({"email": user.email})
    if not u or not verify_password(user.password, u["password"]):
        raise HTTPException(401, "Invalid")
    if u["blocked"]:
        raise HTTPException(403, "Blocked")
    log_action(user.email, "LOGIN")
    return {
        "access_token": create_token({"email": user.email, "role": u["role"]}),
        "role": u["role"]
    }

# ---------- Chat ----------
@app.post("/chat")
def chat(req: ChatRequest, user=Depends(get_user)):
    rate_limit(user["email"])
    index = f"uploads/{user['email']}.pdf.index"
    return {"response": chat_with_bot(user["email"], req.message, index_path=index if os.path.exists(index) else None)}

@app.get("/chats")
def get_chats(user=Depends(get_user)):
    return list(chat_collection.find({"user_id": user["email"]}, {"_id": 0}).sort("created_at", 1))

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), user=Depends(get_user)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{user['email']}.pdf"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    process_pdf(file_path)
    return {"msg": "PDF processed and indexed"}

import traceback

@app.get("/generate-quiz")
def generate_quiz(topic: str = None, count: int = 3, user=Depends(get_user)):
    try:
        index = f"uploads/{user['email']}.pdf.index"
        quiz = generate_quiz_logic(
            user["email"], 
            index_path=index if os.path.exists(index) else None,
            topic=topic,
            count=count
        )
        return {"quiz": quiz}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, str(e))

# ---------- Admin ----------
@app.get("/admin/users")
def get_users(admin=Depends(get_admin)):
    return list(users.find({}, {"_id": 0, "password": 0}))

@app.put("/admin/block/{email}")
def block(email, admin=Depends(get_admin)):
    users.update_one({"email": email}, {"$set": {"blocked": True}})
    log_action(admin, "BLOCK", email)
    return {"msg": "blocked"}

@app.delete("/admin/delete/{email}")
def delete(email, admin=Depends(get_admin)):
    users.delete_one({"email": email})
    chat_collection.delete_many({"user_id": email})
    log_action(admin, "DELETE", email)
    return {"msg": "deleted"}

@app.get("/admin/analytics")
def analytics(admin=Depends(get_admin)):
    return {
        "users": users.count_documents({}),
        "chats": chat_collection.count_documents({})
    }

@app.get("/health")
def health():
    return {"status": "OK"}