from fastapi import HTTPException
from database import get_db
from models.schemas import ConversationOut, MessageOut
from datetime import datetime
from bson import ObjectId


def _conv_out(doc: dict) -> ConversationOut:
    return ConversationOut(
        id=str(doc["_id"]),
        title=doc["title"],
        user_id=str(doc["user_id"]),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        message_count=doc.get("message_count", 0),
    )


def _msg_out(doc: dict) -> MessageOut:
    return MessageOut(
        id=str(doc["_id"]),
        conversation_id=str(doc["conversation_id"]),
        role=doc["role"],
        content=doc["content"],
        created_at=doc["created_at"],
    )


async def create_conversation(user_id: str, title: str = "New Chat") -> ConversationOut:
    db = get_db()
    now = datetime.utcnow()
    doc = {"user_id": ObjectId(user_id), "title": title, "created_at": now, "updated_at": now, "message_count": 0}
    result = await db.conversations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _conv_out(doc)


async def get_conversations(user_id: str, search: str = "") -> list[ConversationOut]:
    db = get_db()
    query = {"user_id": ObjectId(user_id)}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    cursor = db.conversations.find(query).sort("updated_at", -1).limit(100)
    return [_conv_out(doc) async for doc in cursor]


async def delete_conversation(conversation_id: str, user_id: str):
    db = get_db()
    result = await db.conversations.delete_one({"_id": ObjectId(conversation_id), "user_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.messages.delete_many({"conversation_id": ObjectId(conversation_id)})


async def get_messages(conversation_id: str, user_id: str) -> list[MessageOut]:
    db = get_db()
    conv = await db.conversations.find_one({"_id": ObjectId(conversation_id), "user_id": ObjectId(user_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    cursor = db.messages.find({"conversation_id": ObjectId(conversation_id)}).sort("created_at", 1)
    return [_msg_out(doc) async for doc in cursor]


async def save_message(conversation_id: str, role: str, content: str) -> MessageOut:
    db = get_db()
    now = datetime.utcnow()
    doc = {"conversation_id": ObjectId(conversation_id), "role": role, "content": content, "created_at": now}
    result = await db.messages.insert_one(doc)
    doc["_id"] = result.inserted_id
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"updated_at": now}, "$inc": {"message_count": 1}},
    )
    return _msg_out(doc)


async def update_conversation_title(conversation_id: str, title: str):
    db = get_db()
    await db.conversations.update_one({"_id": ObjectId(conversation_id)}, {"$set": {"title": title}})


async def get_context_messages(conversation_id: str, limit: int = 20) -> list[dict]:
    db = get_db()
    cursor = db.messages.find({"conversation_id": ObjectId(conversation_id)}).sort("created_at", -1).limit(limit)
    messages = [doc async for doc in cursor]
    return [{"role": m["role"], "content": m["content"]} for m in reversed(messages)]


async def delete_last_ai_message(conversation_id: str):
    db = get_db()
    last = await db.messages.find_one(
        {"conversation_id": ObjectId(conversation_id), "role": "assistant"},
        sort=[("created_at", -1)],
    )
    if last:
        await db.messages.delete_one({"_id": last["_id"]})
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$inc": {"message_count": -1}},
        )
