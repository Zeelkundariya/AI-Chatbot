from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "SUPER_SECRET"
ALGORITHM = "HS256"

pwd = CryptContext(schemes=["pbkdf2_sha256"])
oauth2 = OAuth2PasswordBearer(tokenUrl="login")

def hash_password(p): return pwd.hash(p)
def verify_password(p, h): return pwd.verify(p, h)

def create_token(data):
    data["exp"] = datetime.utcnow() + timedelta(hours=12)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_user(token=Depends(oauth2)):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid token")

def get_admin(user=Depends(get_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return user["email"]