from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, RegenerateRequest
from services.chat_service import (
    save_message, get_context_messages, update_conversation_title,
    delete_last_ai_message, get_messages
)
from ai.openai_service import stream_ai_response
from utils.jwt_utils import get_current_user, decode_token
from database import get_db
from bson import ObjectId
import json

router = APIRouter(prefix="/chat", tags=["chat"])


async def _verify_conversation(conversation_id: str, user_id: str):
    db = get_db()
    conv = await db.conversations.find_one({"_id": ObjectId(conversation_id), "user_id": ObjectId(user_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.post("/send")
async def send_message(req: ChatRequest, user_id: str = Depends(get_current_user)):
    conv = await _verify_conversation(req.conversation_id, user_id)
    await save_message(req.conversation_id, "user", req.message)

    context = await get_context_messages(req.conversation_id)

    # Auto-title on first message
    if conv.get("message_count", 0) <= 1:
        title = req.message[:50] + ("..." if len(req.message) > 50 else "")
        await update_conversation_title(req.conversation_id, title)

    full_response = []

    async def generate():
        async for chunk in stream_ai_response(context):
            full_response.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        ai_text = "".join(full_response)
        await save_message(req.conversation_id, "assistant", ai_text)
        yield f"data: {json.dumps({'done': True, 'conversation_id': req.conversation_id})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/regenerate")
async def regenerate(req: RegenerateRequest, user_id: str = Depends(get_current_user)):
    await _verify_conversation(req.conversation_id, user_id)
    await delete_last_ai_message(req.conversation_id)
    context = await get_context_messages(req.conversation_id)

    full_response = []

    async def generate():
        async for chunk in stream_ai_response(context):
            full_response.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        ai_text = "".join(full_response)
        await save_message(req.conversation_id, "assistant", ai_text)
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.websocket("/ws/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    await websocket.accept()
    try:
        # Authenticate via first message
        auth_data = await websocket.receive_json()
        token = auth_data.get("token", "")
        user_id = decode_token(token)

        db = get_db()
        conv = await db.conversations.find_one({"_id": ObjectId(conversation_id), "user_id": ObjectId(user_id)})
        if not conv:
            await websocket.send_json({"error": "Unauthorized"})
            await websocket.close()
            return

        await websocket.send_json({"status": "connected"})

        while True:
            data = await websocket.receive_json()
            message = data.get("message", "").strip()
            if not message:
                continue

            await save_message(conversation_id, "user", message)
            context = await get_context_messages(conversation_id)

            if conv.get("message_count", 0) <= 1:
                title = message[:50] + ("..." if len(message) > 50 else "")
                await update_conversation_title(conversation_id, title)

            full_response = []
            async for chunk in stream_ai_response(context):
                full_response.append(chunk)
                await websocket.send_json({"chunk": chunk})

            ai_text = "".join(full_response)
            await save_message(conversation_id, "assistant", ai_text)
            await websocket.send_json({"done": True})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
