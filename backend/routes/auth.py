from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.user import UserRegister, UserLogin, Token, UserOut
from services.auth_service import (
    create_user, get_user_by_email, verify_password, user_doc_to_out
)
from utils.jwt_utils import create_access_token, get_current_user
from services.db_service import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    db = get_db()
    existing = await get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    user_out = await create_user(db, user)
    access_token = create_access_token({"sub": user_out.email, "role": user_out.role})
    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_db()
    user_doc = await get_user_by_email(db, credentials.email)
    if not user_doc or not verify_password(credentials.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    user_out = user_doc_to_out(user_doc)
    access_token = create_access_token({"sub": user_out.email, "role": user_out.role})
    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.get("/me", response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    db = get_db()
    user_doc = await get_user_by_email(db, current_user.email)
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_out(user_doc)
