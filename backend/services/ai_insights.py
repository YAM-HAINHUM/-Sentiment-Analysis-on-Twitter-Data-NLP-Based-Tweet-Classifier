"""AI Insights (NLP-only).

This module replaces the legacy OpenAI-powered insights generation with
local, deterministic NLP heuristics.

Returned JSON shape (used by `GET /insights`):
{
  "summary": str,
  "sentiment_distribution": {"Positive": float, "Negative": float, "Neutral": float},
  "top_negative_keywords": [str]
}
"""

from __future__ import annotations

import re
from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Dict, List

from services.db_service import get_db


def _clean_keyword(w: str) -> str:
    w = w.strip().lower()
    w = re.sub(r"[^a-z0-9_\-]", "", w)
    return w


def _sentiment_label(v: Any) -> str:
    # Accept whatever is stored in MongoDB history.
    if isinstance(v, str):
        # common values: Positive/Negative/Neutral
        vv = v.strip().lower()
        if vv.startswith("pos"):
            return "Positive"
        if vv.startswith("neg"):
            return "Negative"
        if vv.startswith("neu"):
            return "Neutral"
        # fallback
        return v
    return str(v)


async def generate_insights(user_email: str, days: int = 30, top_k_keywords: int = 12) -> Dict[str, Any]:
    db = get_db()

    since = datetime.utcnow() - timedelta(days=days)

    # Prefer stored per-analysis keyword list if present. Fall back to
    # tokenization of negative texts.
    cursor = db.history.find(
        {"user_email": user_email, "created_at": {"$gte": since}},
    ).sort("created_at", -1).limit(5000)

    history_rows: List[Dict[str, Any]] = []
    async for doc in cursor:
        history_rows.append(doc)

    if not history_rows:
        return {
            "summary": "No recent analyses found. Run sentiment analysis first.",
            "sentiment_distribution": {"Positive": 0.0, "Negative": 0.0, "Neutral": 0.0},
            "top_negative_keywords": [],
        }

    sentiments = [_sentiment_label(r.get("sentiment")) for r in history_rows]
    total = len(sentiments)

    counts = Counter(sentiments)
    pos_pct = (counts.get("Positive", 0) / total) * 100
    neg_pct = (counts.get("Negative", 0) / total) * 100
    neu_pct = 100.0 - pos_pct - neg_pct

    # Summary: template-based with quick stats.
    # (We avoid LLM calls per requirements.)
    summary = (
        f"Over the last {days} days, sentiment is {pos_pct:.0f}% positive, "
        f"{neg_pct:.0f}% negative, and {neu_pct:.0f}% neutral. "
        "Negative tweets tend to cluster around recurring topics; reviewing the keywords below can help target improvements."
    )

    # Top negative keywords:
    neg_rows = [r for r in history_rows if _sentiment_label(r.get("sentiment")) == "Negative"]
    keyword_counter: Counter[str] = Counter()

    for r in neg_rows:
        # If pipeline stored keywords, use them.
        kw_list = r.get("keywords") or r.get("top_keywords")
        if isinstance(kw_list, list):
            # list may contain strings or dicts {word, weight}
            for kw in kw_list:
                if isinstance(kw, str):
                    k = _clean_keyword(kw)
                    if k:
                        keyword_counter[k] += 1
                elif isinstance(kw, dict):
                    w = kw.get("word") or kw.get("text") or kw.get("keyword")
                    if w:
                        k = _clean_keyword(str(w))
                        if k:
                            keyword_counter[k] += float(kw.get("weight", 1) or kw.get("score", 1) or 1)

        # Otherwise tokenize the negative text.
        text = r.get("text") or ""
        if isinstance(text, str) and text:
            # very simple tokenizer; good enough for dashboard keywords
            tokens = re.findall(r"[a-zA-Z0-9_\-]{2,}", text.lower())
            for t in tokens:
                if t in {"the", "and", "for", "with", "that", "this", "have", "from", "your", "you", "are"}:
                    continue
                keyword_counter[t] += 1

    top_keywords = [k for k, _ in keyword_counter.most_common(top_k_keywords)]

    return {
        "summary": summary,
        "sentiment_distribution": {
            "Positive": round(pos_pct, 2),
            "Negative": round(neg_pct, 2),
            "Neutral": round(neu_pct, 2),
        },
        "top_negative_keywords": top_keywords,
    }

