from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
from typing import Optional

from models.user import UserRegister, UserInDB, UserOut

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def user_doc_to_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        role=doc.get("role", "user"),
        created_at=doc.get("created_at", datetime.utcnow()),
    )


async def create_user(db: AsyncIOMotorDatabase, user: UserRegister) -> UserOut:
    doc = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "role": "user",
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return user_doc_to_out(doc)


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email})


async def get_all_users(db: AsyncIOMotorDatabase) -> list:
    users = []
    async for doc in db.users.find({}, {"hashed_password": 0}):
        users.append(user_doc_to_out(doc).model_dump())
    return users
