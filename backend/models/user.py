from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    hashed_password: str
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
