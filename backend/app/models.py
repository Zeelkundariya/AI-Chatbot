from pydantic import BaseModel

class User(BaseModel):
    email: str
    password: str
    role: str = "user"

class ChatRequest(BaseModel):
    message: str