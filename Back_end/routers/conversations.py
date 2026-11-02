from fastapi import APIRouter, Depends, HTTPException
from typing import List

from starlette import status

from schemas.chat import ConversationResponse,ConversationCreate,MessageResponse,ConversationUpdate
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

#用户重命名会话标题
@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation_title(conversation_id: int, data:ConversationUpdate, db: AsyncSession = Depends(get_db)):
    conv=await crud.update_conversation_title(db, conversation_id, data.title)
    return conv

#删除会话
@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, db: AsyncSession = Depends(get_db)):
    conv=await crud.get_conversation_by_id(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="会话不存在")
    await crud.delete_conversation(db, conv)
    return {"message": "会话删除成功"}
