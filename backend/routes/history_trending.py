from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any
from datetime import datetime, timedelta


from models.user import TokenData
from utils.jwt_utils import get_current_user
from services.db_service import get_db

router = APIRouter(prefix="/history", tags=["history"])


def _serialize_doc(doc: dict) -> dict:
    """Serialize Mongo document into JSON-friendly dict."""
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.get("/tweets-by-date")
async def tweets_by_date(
    date: str = Query(..., description="YYYY-MM-DD"),
    limit: int = Query(200, ge=1, le=1000),
    current_user: TokenData = Depends(get_current_user),
):
    """Return analyzed tweets for a specific date (UTC), for drill-down."""
    try:
        day = datetime.fromisoformat(date)
    except ValueError:
        # allow plain YYYY-MM-DD
        day = datetime.strptime(date, "%Y-%m-%d")

    start = day
    end = day + timedelta(days=1)

    db = get_db()
    cursor = (
        db.history.find(
            {
                "user_email": current_user.email,
                "created_at": {"$gte": start, "$lt": end},
            }
        )
        .sort("created_at", -1)
        .limit(limit)
    )

    items: List[Dict[str, Any]] = []
    async for doc in cursor:
        # Keep payload small for UI
        items.append(
            {
                "id": str(doc.get("_id")),
                "text": doc.get("text", ""),
                "sentiment": doc.get("sentiment"),
                "confidence": doc.get("confidence"),
                "compound_score": doc.get("compound_score"),
                "created_at": doc.get("created_at").isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at"),
            }
        )

    return {"date": date, "tweets": items, "count": len(items), "limit": limit}


@router.get("/keywords-trend")
async def keywords_trend(
    days: int = Query(30, ge=7, le=365),
    top: int = Query(10, ge=3, le=50),
    current_user: TokenData = Depends(get_current_user),
):
    """Return per-day top keywords for positive and negative sentiments."""
    since = datetime.utcnow() - timedelta(days=days)
    db = get_db()

    # Aggregate by day + sentiment + keyword
    base_pipe = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": since}}},
        {"$unwind": "$keywords"},
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "sentiment": "$sentiment",
                    "word": "$keywords.word",
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.date": 1, "count": -1}},
    ]

    # Collect per day and take top N for each sentiment
    # We do it in Python to keep aggregation simple.
    rows: List[Dict[str, Any]] = []
    async for doc in db.history.aggregate(base_pipe):
        rows.append(
            {
                "date": doc["_id"]["date"],
                "sentiment": doc["_id"]["sentiment"],
                "word": doc["_id"]["word"],
                "count": doc["count"],
            }
        )

    by_day: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for r in rows:
        d = r["date"]
        s = r["sentiment"]
        by_day.setdefault(d, {})
        by_day[d].setdefault(s, [])
        by_day[d][s].append({"word": r["word"], "count": r["count"]})

    positive: List[Dict[str, Any]] = []
    negative: List[Dict[str, Any]] = []

    for date in sorted(by_day.keys()):
        pos_list = by_day[date].get("Positive", [])[:top] if by_day.get(date) else []
        neg_list = by_day[date].get("Negative", [])[:top] if by_day.get(date) else []
        if pos_list:
            positive.append({"date": date, "keywords": pos_list})
        if neg_list:
            negative.append({"date": date, "keywords": neg_list})

    return {"days": days, "top": top, "positive": positive, "negative": negative}


