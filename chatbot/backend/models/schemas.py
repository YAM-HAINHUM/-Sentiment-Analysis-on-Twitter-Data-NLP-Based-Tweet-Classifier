from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ConversationCreate(BaseModel):
    title: str = "New Chat"


class ConversationOut(BaseModel):
    id: str
    title: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    conversation_id: str


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: str


class RegenerateRequest(BaseModel):
    conversation_id: str
    message_id: str
