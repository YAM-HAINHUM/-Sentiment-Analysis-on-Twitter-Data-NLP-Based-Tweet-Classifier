"""
Sentiment Analysis System - FastAPI Backend
"""
import logging
logging.basicConfig(level=logging.INFO, force=True)
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from config import settings
from services.db_service import connect_db, close_db
from routes import auth, analyze, history, admin, insights, export
from routes.history_trending import router as history_trending_router

from routes.emotions import router as emotions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Sentiment Analysis API",
    description="Production-ready NLP-powered Sentiment Analysis System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — must be added BEFORE routers, AFTER exception handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Global exception handler that preserves CORS on 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled exception: %s", exc)
    origin = request.headers.get("origin", "")
    allowed = settings.cors_origins_list
    cors_origin = origin if origin in allowed else (allowed[0] if allowed else "*")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )


# Routers
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(admin.router)
app.include_router(insights.router)
app.include_router(export.router)
app.include_router(emotions_router)
app.include_router(history_trending_router)



@app.get("/")
async def root():
    return {
        "service": "Sentiment Analysis API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/auth",
            "analyze": "/analyze",
            "history": "/history",
            "admin": "/admin",
            "insights": "/insights",
            "emotions": "/emotions",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

