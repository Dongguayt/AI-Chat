from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from config.db_conf import get_db
from schemas.chat import MessageCreate
from services.chat_service import ai_stream
import redis.asyncio as aioredis
from config.redis_conf import get_redis
from dependencies.rate_limit import chat_rate_limiter

router = APIRouter(prefix="/api/chat", tags=["chat_stream"])

@router.post("/stream")
async def chat_stream(
        data: MessageCreate,
        db: AsyncSession = Depends(get_db),
        r: aioredis.Redis = Depends(get_redis),
        _=Depends(chat_rate_limiter)
):
    """接收消息 -> 存库 -> 流式返回 -> 存库"""
    return StreamingResponse(
        ai_stream(data.conversation_id, data.content, db,r),
        media_type="text/event-stream"
    )