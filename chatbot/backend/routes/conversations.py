from fastapi import APIRouter, Depends, Query
from models.schemas import ConversationCreate, ConversationOut, MessageOut
from services.chat_service import (
    create_conversation, get_conversations, delete_conversation, get_messages
)
from utils.jwt_utils import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationOut, status_code=201)
async def new_conversation(data: ConversationCreate, user_id: str = Depends(get_current_user)):
    return await create_conversation(user_id, data.title)


@router.get("", response_model=list[ConversationOut])
async def list_conversations(search: str = Query(""), user_id: str = Depends(get_current_user)):
    return await get_conversations(user_id, search)


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def list_messages(conversation_id: str, user_id: str = Depends(get_current_user)):
    return await get_messages(conversation_id, user_id)


@router.delete("/{conversation_id}", status_code=204)
async def remove_conversation(conversation_id: str, user_id: str = Depends(get_current_user)):
    await delete_conversation(conversation_id, user_id)
