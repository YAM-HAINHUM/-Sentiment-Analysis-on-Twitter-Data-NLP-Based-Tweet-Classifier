from fastapi import APIRouter, Depends
from models.schemas import UserCreate, UserLogin, TokenResponse, UserOut
from services.auth_service import register_user, login_user, get_user_by_id
from utils.jwt_utils import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate):
    return await register_user(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    return await login_user(data)


@router.get("/me", response_model=UserOut)
async def me(user_id: str = Depends(get_current_user)):
    return await get_user_by_id(user_id)
