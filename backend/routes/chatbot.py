"""
AI Chatbot — Ollama local LLM backend (no API key required).

Flow:
  1. Try Ollama at OLLAMA_BASE_URL  →  stream tokens via /api/chat
  2. If Ollama is unreachable        →  informative fallback stream
  3. If OPENAI_API_KEY is set and
     USE_OLLAMA=false                →  use OpenAI (legacy path)

Context memory: last OLLAMA_CONTEXT_MESSAGES messages are sent to the model.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import settings
from services.db_service import get_db
from utils.jwt_utils import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chatbot"])

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are SentiAI Assistant — a helpful, intelligent AI built into a "
    "Sentiment Analysis platform. You can:\n"
    "- Answer general knowledge questions clearly and concisely\n"
    "- Help users understand their sentiment analysis results\n"
    "- Explain NLP concepts (VADER, TF-IDF, sentiment scoring)\n"
    "- Write and debug code\n"
    "- Summarize and analyse text\n\n"
    "Always use markdown formatting for code, lists, and structured answers. "
    "Be conversational, accurate, and concise."
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    title: str = "New Chat"


class ChatSendRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: str


class RegenerateRequest(BaseModel):
    conversation_id: str
    message_id: str


# ── DB helpers ────────────────────────────────────────────────────────────────

def _conv_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "user_id": doc["user_email"],
        "created_at": doc["created_at"].isoformat(),
        "updated_at": doc["updated_at"].isoformat(),
        "message_count": doc.get("message_count", 0),
    }


def _msg_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "conversation_id": str(doc["conversation_id"]),
        "role": doc["role"],
        "content": doc["content"],
        "created_at": doc["created_at"].isoformat(),
    }


async def _get_context(db, conversation_id: str) -> list[dict]:
    """Return last N messages in chronological order."""
    limit = settings.OLLAMA_CONTEXT_MESSAGES
    cursor = (
        db.chat_messages
        .find({"conversation_id": ObjectId(conversation_id)})
        .sort("created_at", -1)
        .limit(limit)
    )
    msgs = [doc async for doc in cursor]
    return [{"role": m["role"], "content": m["content"]} for m in reversed(msgs)]


async def _save_message(db, conversation_id: str, role: str, content: str) -> dict:
    now = datetime.utcnow()
    doc = {
        "conversation_id": ObjectId(conversation_id),
        "role": role,
        "content": content,
        "created_at": now,
    }
    result = await db.chat_messages.insert_one(doc)
    doc["_id"] = result.inserted_id
    await db.chat_conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"updated_at": now}, "$inc": {"message_count": 1}},
    )
    return _msg_out(doc)


# ── Ollama streaming ──────────────────────────────────────────────────────────

async def _ollama_stream(messages: list[dict]):
    """
    Stream tokens from Ollama /api/chat endpoint.
    Ollama uses NDJSON streaming (one JSON object per line).
    Each line: {"message": {"content": "token"}, "done": false}
    Final line: {"done": true}
    """
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "stream": True,
        "options": {
            "temperature": 0.7,
            "num_predict": 2048,
            "top_p": 0.9,
        },
    }

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=5.0)) as client:
        try:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise HTTPException(
                        status_code=502,
                        detail=f"Ollama error {response.status_code}: {body.decode()[:300]}",
                    )
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                        token = obj.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if obj.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Ollama is not running. "
                    f"Start it with: ollama serve  (model: {settings.OLLAMA_MODEL})"
                ),
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Ollama response timed out.")


# ── OpenAI streaming (legacy / optional) ─────────────────────────────────────

async def _openai_stream(messages: list[dict]):
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "stream": True,
        "max_tokens": 2048,
        "temperature": 0.7,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream(
                "POST",
                f"{settings.OPENAI_API_BASE}/v1/chat/completions",
                headers=headers,
                json=payload,
            ) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise HTTPException(status_code=502, detail=f"OpenAI error: {body.decode()[:200]}")
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        token = obj["choices"][0]["delta"].get("content", "")
                        if token:
                            yield token
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"OpenAI connection failed: {exc}")


# ── Fallback stream (no AI backend available) ────────────────────────────────

async def _fallback_stream(messages: list[dict]):
    """
    Last-resort fallback when neither Ollama nor OpenAI is available.
    Tells the user exactly what to configure — does NOT give hardcoded answers.
    """
    text = (
        "I'm currently running in **offline mode** — no AI backend is configured.\n\n"
        "**Option 1 — Use OpenAI (easiest):**\n"
        "Add your key to `backend/.env`:\n"
        "```\nOPENAI_API_KEY=sk-...\nUSE_OLLAMA=false\n```\n\n"
        "**Option 2 — Run Ollama locally (free, no key):**\n"
        "```bash\n"
        "# Download from https://ollama.com/download\n"
        f"ollama pull {settings.OLLAMA_MODEL}\n"
        "ollama serve\n"
        "# Then set USE_OLLAMA=true in backend/.env\n"
        "```\n\n"
        "Restart the backend after either change."
    )
    words = text.split(" ")
    for i, word in enumerate(words):
        yield word + (" " if i < len(words) - 1 else "")
        await asyncio.sleep(0.018)


# ── Router: pick correct backend ─────────────────────────────────────────────

def _openai_key_valid() -> bool:
    k = settings.OPENAI_API_KEY
    return bool(k) and not k.startswith("sk-your") and len(k) > 20


async def _stream_ai(messages: list[dict]):
    """
    Priority:
      1. Ollama  — if USE_OLLAMA=true AND server reachable
      2. OpenAI  — if OPENAI_API_KEY is set and non-placeholder
      3. Fallback — tells user to configure a backend
    """
    if settings.USE_OLLAMA:
        try:
            async for chunk in _ollama_stream(messages):
                yield chunk
            return
        except HTTPException as exc:
            logger.warning("Ollama unavailable (%s), trying OpenAI", exc.detail)
            # fall through to OpenAI if key exists

    if _openai_key_valid():
        async for chunk in _openai_stream(messages):
            yield chunk
        return

    async for chunk in _fallback_stream(messages):
        yield chunk


# ── SSE generator ─────────────────────────────────────────────────────────────

async def _sse_generate(db, conversation_id: str, context: list[dict]):
    """Collect streamed tokens, emit SSE chunks, then persist the full reply."""
    collected: list[str] = []
    try:
        async for chunk in _stream_ai(context):
            collected.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    except HTTPException as exc:
        msg = f"AI error: {exc.detail}"
        await _save_message(db, conversation_id, "assistant", msg)
        yield f"data: {json.dumps({'chunk': msg})}\n\n"
        yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"
        return
    except Exception as exc:
        msg = f"Unexpected error: {exc}"
        logger.exception("SSE generation error")
        await _save_message(db, conversation_id, "assistant", msg)
        yield f"data: {json.dumps({'chunk': msg})}\n\n"
        yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"
        return

    full_text = "".join(collected)
    if full_text:
        await _save_message(db, conversation_id, "assistant", full_text)

    yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"


# ── Status endpoint ───────────────────────────────────────────────────────────

@router.get("/chat/status")
async def chat_status():
    """
    Returns whether Ollama is reachable and which model is configured.
    Frontend uses this to show a live status badge.
    """
    ollama_ok = False
    available_models: list[str] = []

    if settings.USE_OLLAMA:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
                if r.status_code == 200:
                    ollama_ok = True
                    data = r.json()
                    available_models = [m["name"] for m in data.get("models", [])]
        except Exception:
            pass

    return {
        "ollama_running": ollama_ok,
        "model": settings.OLLAMA_MODEL if (settings.USE_OLLAMA and ollama_ok) else settings.OPENAI_MODEL,
        "use_ollama": settings.USE_OLLAMA,
        "available_models": available_models,
        "mode": (
            "ollama" if (settings.USE_OLLAMA and ollama_ok)
            else "openai" if _openai_key_valid()
            else "fallback"
        ),
    }


# ── Conversation routes ───────────────────────────────────────────────────────

@router.post("/conversations", status_code=201)
async def create_conversation(data: ConversationCreate, user=Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow()
    doc = {
        "user_email": user.email,
        "title": data.title,
        "created_at": now,
        "updated_at": now,
        "message_count": 0,
    }
    result = await db.chat_conversations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _conv_out(doc)


@router.get("/conversations")
async def list_conversations(search: str = "", user=Depends(get_current_user)):
    db = get_db()
    query: dict = {"user_email": user.email}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    cursor = db.chat_conversations.find(query).sort("updated_at", -1).limit(100)
    return [_conv_out(doc) async for doc in cursor]


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, user=Depends(get_current_user)):
    db = get_db()
    conv = await db.chat_conversations.find_one(
        {"_id": ObjectId(conversation_id), "user_email": user.email}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    cursor = db.chat_messages.find(
        {"conversation_id": ObjectId(conversation_id)}
    ).sort("created_at", 1)
    return [_msg_out(doc) async for doc in cursor]


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    db = get_db()
    result = await db.chat_conversations.delete_one(
        {"_id": ObjectId(conversation_id), "user_email": user.email}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.chat_messages.delete_many({"conversation_id": ObjectId(conversation_id)})


# ── Chat routes ───────────────────────────────────────────────────────────────

@router.post("/chat/send")
async def send_message(req: ChatSendRequest, user=Depends(get_current_user)):
    db = get_db()
    conv = await db.chat_conversations.find_one(
        {"_id": ObjectId(req.conversation_id), "user_email": user.email}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await _save_message(db, req.conversation_id, "user", req.message)

    # Auto-title on first message
    if conv.get("message_count", 0) == 0:
        title = req.message[:50] + ("..." if len(req.message) > 50 else "")
        await db.chat_conversations.update_one(
            {"_id": ObjectId(req.conversation_id)},
            {"$set": {"title": title}},
        )

    context = await _get_context(db, req.conversation_id)

    return StreamingResponse(
        _sse_generate(db, req.conversation_id, context),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/chat/regenerate")
async def regenerate(req: RegenerateRequest, user=Depends(get_current_user)):
    db = get_db()
    conv = await db.chat_conversations.find_one(
        {"_id": ObjectId(req.conversation_id), "user_email": user.email}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    last_ai = await db.chat_messages.find_one(
        {"conversation_id": ObjectId(req.conversation_id), "role": "assistant"},
        sort=[("created_at", -1)],
    )
    if last_ai:
        await db.chat_messages.delete_one({"_id": last_ai["_id"]})
        await db.chat_conversations.update_one(
            {"_id": ObjectId(req.conversation_id)},
            {"$inc": {"message_count": -1}},
        )

    context = await _get_context(db, req.conversation_id)

    return StreamingResponse(
        _sse_generate(db, req.conversation_id, context),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.delete("/chat/clear/{conversation_id}", status_code=204)
async def clear_chat(conversation_id: str, user=Depends(get_current_user)):
    """Delete all messages in a conversation but keep the conversation itself."""
    db = get_db()
    conv = await db.chat_conversations.find_one(
        {"_id": ObjectId(conversation_id), "user_email": user.email}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.chat_messages.delete_many({"conversation_id": ObjectId(conversation_id)})
    await db.chat_conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"message_count": 0, "updated_at": datetime.utcnow()}},
    )
