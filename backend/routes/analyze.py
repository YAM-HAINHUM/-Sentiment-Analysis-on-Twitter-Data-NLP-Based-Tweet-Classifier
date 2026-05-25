from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from datetime import datetime
from bson import ObjectId
from typing import Optional
import csv
import io

from models.sentiment import TextInput, BatchTextInput, SentimentResult, AnalysisInput
from models.user import TokenData
from utils.jwt_utils import get_current_user
from nlp.pipeline import get_pipeline
from services.db_service import get_db

router = APIRouter(prefix="/analyze", tags=["analyze"])


def _build_history_doc(user_email: str, result: dict) -> dict:
    return {
        "user_id": user_email,
        "user_email": user_email,
        "text": result["text"][:500],
        "sentiment": result["sentiment"],
        "confidence": result["confidence"],
        "model_used": result.get("model_used", "vader"),
        "scores": result["scores"],
        "compound_score": result["compound_score"],
        "keywords": result["keywords"][:5],
        "created_at": datetime.utcnow(),
    }


@router.post("", response_model=SentimentResult)
async def analyze_text(
    body: AnalysisInput,
    current_user: TokenData = Depends(get_current_user)
):
    pipeline = get_pipeline()
    result = pipeline.analyze(body.text, model=body.model or "vader")
    db = get_db()
    try:
        await db.history.insert_one(_build_history_doc(current_user.email, result))
    except Exception:
        pass
    return SentimentResult(**result)


@router.post("/batch")
async def analyze_batch(
    body: BatchTextInput,
    current_user: TokenData = Depends(get_current_user)
):
    pipeline = get_pipeline()
    model = body.model or "vader"
    results = pipeline.analyze_batch(body.texts, model=model)
    db = get_db()
    for r in results:
        r["model_used"] = model
        try:
            await db.history.insert_one(_build_history_doc(current_user.email, r))
        except Exception:
            pass
    pos = sum(1 for r in results if r["sentiment"] == "Positive")
    neg = sum(1 for r in results if r["sentiment"] == "Negative")
    neu = sum(1 for r in results if r["sentiment"] == "Neutral")
    return {
        "results": results,
        "count": len(results),
        "model_used": model,
        "summary": {"positive": pos, "negative": neg, "neutral": neu},
    }


@router.post("/batch/csv")
async def analyze_batch_csv(
    file: UploadFile = File(...),
    column: Optional[str] = Query("text"),
    model: Optional[str] = Query("vader"),
    current_user: TokenData = Depends(get_current_user)
):
    """Upload a CSV file and analyze the text column."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    rows = list(reader)
    if not rows:
        raise HTTPException(400, "CSV file is empty")

    # Auto-detect text column
    headers = list(rows[0].keys())
    text_col = column if column in headers else headers[0]

    texts = [str(row.get(text_col, "")).strip() for row in rows if row.get(text_col, "").strip()]
    if not texts:
        raise HTTPException(400, f"No text found in column '{text_col}'")
    if len(texts) > 500:
        texts = texts[:500]

    pipeline = get_pipeline()
    results = pipeline.analyze_batch(texts, model=model or "vader")
    db = get_db()
    for r in results:
        r["model_used"] = model or "vader"
        try:
            await db.history.insert_one(_build_history_doc(current_user.email, r))
        except Exception:
            pass

    pos = sum(1 for r in results if r["sentiment"] == "Positive")
    neg = sum(1 for r in results if r["sentiment"] == "Negative")
    neu = sum(1 for r in results if r["sentiment"] == "Neutral")

    return {
        "results": results,
        "count": len(results),
        "model_used": model or "vader",
        "columns": headers,
        "text_column": text_col,
        "summary": {"positive": pos, "negative": neg, "neutral": neu},
    }


@router.get("/batch/csv/export")
async def export_batch_csv(
    current_user: TokenData = Depends(get_current_user)
):
    """Export last batch results as CSV."""
    db = get_db()
    cursor = db.history.find({"user_email": current_user.email}).sort("created_at", -1).limit(500)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Text", "Sentiment", "Confidence", "Compound", "Model", "Created At"])
    async for doc in cursor:
        writer.writerow([
            doc["text"],
            doc["sentiment"],
            round(doc.get("confidence", 0), 4),
            round(doc.get("compound_score", 0), 4),
            doc.get("model_used", "vader"),
            doc.get("created_at", "").isoformat() if isinstance(doc.get("created_at"), datetime) else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=batch_results.csv"}
    )


@router.post("/public")
async def analyze_public(body: TextInput):
    """Public endpoint — no auth, no history saving."""
    pipeline = get_pipeline()
    result = pipeline.analyze(body.text)
    result["model_used"] = result.get("model_used", "vader")
    return SentimentResult(**result)


@router.get("/keywords")
async def get_top_keywords(
    days: int = Query(30),
    limit: int = Query(20),
    current_user: TokenData = Depends(get_current_user)
):
    """Get top keywords from recent analyses."""
    from datetime import timedelta
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)
    pipeline_agg = [
        {"$match": {"user_email": current_user.email, "created_at": {"$gte": since}}},
        {"$unwind": "$keywords"},
        {"$group": {
            "_id": "$keywords.word",
            "count": {"$sum": 1},
            "avg_score": {"$avg": "$keywords.score"},
            "type": {"$first": "$keywords.type"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    results = []
    async for doc in db.history.aggregate(pipeline_agg):
        results.append({
            "word": doc["_id"],
            "count": doc["count"],
            "avg_score": round(doc["avg_score"], 4),
            "type": doc["type"],
        })
    return {"keywords": results, "days": days}
