from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TextInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class AnalysisInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    model: str = Field("best", description="vader|best|lr|nb|svm")


class BatchTextInput(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=50)
    model: str = Field("best", description="vader|best|lr|nb|svm")


class KeywordScore(BaseModel):
    word: str
    score: float
    type: str  # "positive" | "negative" | "neutral"


class SentimentResult(BaseModel):
    text: str
    sentiment: str  # "Positive" | "Negative" | "Neutral"
    confidence: float
    model_used: str  # "vader" | "best" | "lr" | "nb" | "svm"
    scores: dict  # {"positive": float, "negative": float, "neutral": float}
    keywords: List[KeywordScore]
    compound_score: float
    processing_time_ms: float


class InsightsResponse(BaseModel):
    summary: str
    insights: List[str]
    recommendations: List[str]


class HistoryItem(BaseModel):
    id: Optional[str] = None
    user_id: str
    user_email: str
    text: str
    sentiment: str
    confidence: float
    model_used: Optional[str] = "vader"
    scores: dict
    compound_score: float
    keywords: List[dict]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HistoryFilter(BaseModel):
    sentiment: Optional[str] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
