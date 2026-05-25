from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from models.user import TokenData
from utils.jwt_utils import require_admin
from services.auth_service import get_all_users
from services.db_service import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


def serialize_doc(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.get("/data")
async def get_admin_data(current_user: TokenData = Depends(require_admin)):
    db = get_db()
    users = await get_all_users(db)
    total_analyses = await db.history.count_documents({})

    # Sentiment distribution across all users
    pipeline_agg = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    distribution = {}
    async for doc in db.history.aggregate(pipeline_agg):
        distribution[doc["_id"]] = doc["count"]

    return {
        "total_users": len(users),
        "total_analyses": total_analyses,
        "sentiment_distribution": distribution,
        "users": users,
    }


@router.get("/history")
async def get_all_history(
    page: int = 1,
    limit: int = 20,
    current_user: TokenData = Depends(require_admin)
):
    db = get_db()
    total = await db.history.count_documents({})
    skip = (page - 1) * limit
    cursor = db.history.find({}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/trends")
async def get_global_trends(current_user: TokenData = Depends(require_admin)):
    db = get_db()
    seven_days_ago = datetime.utcnow() - timedelta(days=30)
    trend_pipeline = [
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "sentiment": "$sentiment"
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.date": 1}},
    ]
    trend_raw = []
    async for doc in db.history.aggregate(trend_pipeline):
        trend_raw.append({
            "date": doc["_id"]["date"],
            "sentiment": doc["_id"]["sentiment"],
            "count": doc["count"]
        })
    return {"trend": trend_raw}
