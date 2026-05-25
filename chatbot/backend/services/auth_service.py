from passlib.context import CryptContext
from fastapi import HTTPException, status
from database import get_db
from models.schemas import UserCreate, UserLogin, TokenResponse, UserOut
from utils.jwt_utils import create_token
from datetime import datetime
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def register_user(data: UserCreate) -> TokenResponse:
    db = get_db()
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    user_out = UserOut(id=user_id, name=data.name, email=data.email, created_at=user_doc["created_at"])
    return TokenResponse(access_token=create_token(user_id), user=user_out)


async def login_user(data: UserLogin) -> TokenResponse:
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_id = str(user["_id"])
    user_out = UserOut(id=user_id, name=user["name"], email=user["email"], created_at=user["created_at"])
    return TokenResponse(access_token=create_token(user_id), user=user_out)


async def get_user_by_id(user_id: str) -> UserOut:
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"], created_at=user["created_at"])
