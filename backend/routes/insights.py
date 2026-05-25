"""
New Insights API endpoints
Integrates AI insights engine with user history.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict
from models.user import TokenData
from utils.jwt_utils import get_current_user
from services.ai_insights import generate_insights
from services.db_service import get_db


router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("")
async def get_user_insights(
    days: Optional[int] = 30,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate AI insights from user history."""
    insights = await generate_insights(current_user.email, days=days)
    return insights


