from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from config.db_conf import get_db
from schemas.chat import MessageCreate
from services.chat_service import fake_ai_stream

router = APIRouter(prefix="/api/chat", tags=["chat_stream"])

@router.post("/stream")
async def chat_stream(data: MessageCreate, db: AsyncSession = Depends(get_db)):
    """接收消息 -> 存库 -> 流式返回 -> 存库"""
    return StreamingResponse(
        fake_ai_stream(data.conversation_id, data.content, db),
        media_type="text/event-stream"
    )