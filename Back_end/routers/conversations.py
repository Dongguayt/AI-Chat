from fastapi import APIRouter, Depends
from typing import List
from schemas.chat import ConversationResponse,ConversationCreate,MessageResponse
from sqlalchemy.ext.asyncio import AsyncSession
from config.db_conf import get_db
import crud.conversations as crud


router = APIRouter(prefix='/api/conversations',tags=['conversations'])

# 获取所有对话
@router.get("/", response_model=List[ConversationResponse])
async def get_conversations(db:AsyncSession=Depends(get_db)):
    conversations = await crud.get_conversations(db)
    return conversations

# 创建对话
@router.post("/", response_model=ConversationResponse)
async def create_conversation(data:ConversationCreate,db:AsyncSession=Depends(get_db)):
    new_conv=await crud.create_conversation(db,data.title)
    return new_conv

# 获取对话下的所有消息
@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: int, db: AsyncSession = Depends(get_db)):
    messages = await crud.get_messages_by_conv_id(db, conversation_id)
    return messages