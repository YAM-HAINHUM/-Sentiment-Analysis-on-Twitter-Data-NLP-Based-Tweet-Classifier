from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timedelta
import csv
import io

from models.user import TokenData
from utils.jwt_utils import get_current_user
from services.db_service import get_db

router = APIRouter(prefix="/history", tags=["history"])


def serialize_doc(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.get("")
async def get_history(
    sentiment: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user)
):
    db = get_db()
    query = {"user_email": current_user.email}
    if sentiment and sentiment != "all":
        query["sentiment"] = sentiment
    if search:
        query["text"] = {"$regex": search, "$options": "i"}
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            date_filter["$lte"] = datetime.fromisoformat(date_to + "T23:59:59")
        query["created_at"] = date_filter

    total = await db.history.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.history.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/analytics")
async def get_analytics(
    days: int = Query(30),
    current_user: TokenData = Depends(get_current_user)
):
    """Extended analytics endpoint with keyword frequency and word cloud data."""
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)

    # All keywords (positive + negative) for word cloud
    kw_all_pipe = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": since}}},
        {"$unwind": "$keywords"},
        {"$group": {
            "_id": "$keywords.word",
            "count": {"$sum": 1},
            "type": {"$first": "$keywords.type"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": 50},
    ]
    all_keywords = []
    async for doc in db.history.aggregate(kw_all_pipe):
        all_keywords.append({"word": doc["_id"], "count": doc["count"], "type": doc["type"]})

    # Trend over selected days
    trend_pipeline = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": since}}},
        {"$group": {
            "_id": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "sentiment": "$sentiment"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.date": 1}},
    ]
    trend_raw = []
    async for doc in db.history.aggregate(trend_pipeline):
        trend_raw.append({"date": doc["_id"]["date"], "sentiment": doc["_id"]["sentiment"], "count": doc["count"]})

    # Distribution
    dist_pipe = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": since}}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    distribution = {}
    async for doc in db.history.aggregate(dist_pipe):
        distribution[doc["_id"]] = doc["count"]
    total = sum(distribution.values())

    # Avg confidence
    conf_pipe = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": since}}},
        {"$group": {"_id": "$sentiment", "avg_confidence": {"$avg": "$confidence"}}},
    ]
    conf_stats = {}
    async for doc in db.history.aggregate(conf_pipe):
        conf_stats[doc["_id"]] = round(doc["avg_confidence"], 3)

    return {
        "total": total,
        "distribution": distribution,
        "trend": trend_raw,
        "all_keywords": all_keywords,
        "confidence_by_sentiment": conf_stats,
        "days": days,
    }


@router.get("/stats")
async def get_stats(current_user: TokenData = Depends(get_current_user)):
    db = get_db()
    
    # Sentiment distribution
    pipeline_agg = [
        {"$match": {"user_email": current_user.email}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    cursor = db.history.aggregate(pipeline_agg)
    distribution = {}
    async for doc in cursor:
        distribution[doc["_id"]] = doc["count"]

    total = sum(distribution.values())

    total = sum(distribution.values())

    # Model usage
    model_pipe = [
        {"$match": {"user_email": current_user.email}},
        {"$group": {"_id": "$model_used", "count": {"$sum": 1}}},
    ]
    cursor = db.history.aggregate(model_pipe)
    model_usage = {}
    async for doc in cursor:
        model_usage[doc["_id"] or "vader"] = doc["count"]

    # Top negative keywords (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    kw_pipe = [
        {"$match": {"user_email": current_user.email, "sentiment": "Negative", "created_at": {"$gte": thirty_days_ago}}},
        {"$unwind": "$keywords"},
        {"$group": {"_id": "$keywords.word", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    cursor = db.history.aggregate(kw_pipe)
    top_negative_keywords = []
    async for doc in cursor:
        top_negative_keywords.append({"keyword": doc["_id"], "count": doc["count"]})

    # Avg confidence by sentiment
    conf_pipe = [
        {"$match": {"user_email": current_user.email}},
        {"$group": {
            "_id": "$sentiment",
            "avg_confidence": {"$avg": "$confidence"},
            "count": {"$sum": 1}
        }}
    ]
    cursor = db.history.aggregate(conf_pipe)
    conf_stats = {}
    async for doc in cursor:
        conf_stats[doc["_id"]] = {
            "avg_confidence": round(doc["avg_confidence"], 3),
            "count": doc["count"]
        }

    # Time series - last 7 days (enhanced)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    trend_pipeline = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": seven_days_ago}}},
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
    trend_cursor = db.history.aggregate(trend_pipeline)
    trend_raw = []
    async for doc in trend_cursor:
        trend_raw.append({"date": doc["_id"]["date"], "sentiment": doc["_id"]["sentiment"], "count": doc["count"]})

    return {
        "total": total,
        "distribution": distribution,
        "model_usage": model_usage,
        "top_negative_keywords": top_negative_keywords,
        "confidence_by_sentiment": conf_stats,
        "trend": trend_raw,
    }


@router.get("/export/csv")
async def export_csv(current_user: TokenData = Depends(get_current_user)):
    db = get_db()
    cursor = db.history.find({"user_email": current_user.email}).sort("created_at", -1).limit(1000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Text", "Sentiment", "Confidence", "Compound Score", "Created At"])

    async for doc in cursor:
        writer.writerow([
            str(doc["_id"]),
            doc["text"],
            doc["sentiment"],
            round(doc.get("confidence", 0), 4),
            round(doc.get("compound_score", 0), 4),
            doc.get("created_at", "").isoformat() if isinstance(doc.get("created_at"), datetime) else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentiment_history.csv"}
    )


@router.delete("/{item_id}")
async def delete_history_item(item_id: str, current_user: TokenData = Depends(get_current_user)):
    from bson import ObjectId
    db = get_db()
    result = await db.history.delete_one({"_id": ObjectId(item_id), "user_email": current_user.email})
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted successfully"}
