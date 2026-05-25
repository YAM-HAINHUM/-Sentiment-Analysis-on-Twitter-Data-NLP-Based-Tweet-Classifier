"""Emotion detection endpoint.

Uses keyword/lexicon heuristic (no external LLM calls) for production-ready behavior.
If you later add HuggingFace models, replace the classifier implementation.
"""

from __future__ import annotations

import re
from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends

from models.user import TokenData
from utils.jwt_utils import get_current_user
from services.db_service import get_db

router = APIRouter(prefix="/emotions", tags=["emotions"])

Emotion = Literal["happy", "sad", "angry", "excited"]

EMO_PATTERNS: Dict[Emotion, List[str]] = {
    "happy": [
        "love",
        "great",
        "amazing",
        "awesome",
        "fantastic",
        "happy",
        "good",
        "wonderful",
        "delight",
        "best",
    ],
    "sad": [
        "sad",
        "terrible",
        "awful",
        "bad",
        "hate",
        "disappointed",
        "regret",
        "worst",
        "broken",
        "refund",
    ],
    "angry": [
        "angry",
        "hate",
        "mad",
        "furious",
        "upset",
        "scam",
        "fraud",
        "rage",
        "unacceptable",
    ],
    "excited": [
        "excited",
        "cant wait",
        "can't wait",
        "amazing",
        "so good",
        "wow",
        "incredible",
        "love it",
        "brilliant",
    ],
}


def _detect_emotions(text: str) -> List[Emotion]:
    t = text.lower()
    hits: List[Emotion] = []
    for emo, patterns in EMO_PATTERNS.items():
        for p in patterns:
            if p in t:
                hits.append(emo)
                break
    return hits


@router.get("")
async def emotions(
    days: int = 30,
    limit: int = 5000,
    current_user: TokenData = Depends(get_current_user),
):
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)

    cursor = db.history.find(
        {"user_email": current_user.email, "created_at": {"$gte": since}},
        {"text": 1},
    ).sort("created_at", -1).limit(limit)

    counter: Counter[str] = Counter()
    per_tweet: List[dict] = []

    async for doc in cursor:
        text = doc.get("text") or ""
        labels = _detect_emotions(text)
        if not labels:
            continue
        for lab in labels:
            counter[lab] += 1
        per_tweet.append({"text_id": str(doc.get("_id")), "emotions": labels})

    total = sum(counter.values()) or 1

    distribution = {
        "happy": round((counter["happy"] / total) * 100, 2),
        "sad": round((counter["sad"] / total) * 100, 2),
        "angry": round((counter["angry"] / total) * 100, 2),
        "excited": round((counter["excited"] / total) * 100, 2),
    }

    return {
        "days": days,
        "distribution": distribution,
        "per_tweet": per_tweet[:200],
    }

