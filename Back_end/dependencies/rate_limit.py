import time
from fastapi import Depends, HTTPException
import redis.asyncio as aioredis
from config.redis_conf import get_redis
from schemas.chat import MessageCreate


async def chat_rate_limiter(
        data: MessageCreate,
        r: aioredis.Redis = Depends(get_redis)
):
    """限制同一会话每分钟最多 5 次请求"""
    current_minute = int(time.time() // 60)
    rate_key = f"rate_limit:{data.conversation_id}:{current_minute}"

    request_count = await r.incr(rate_key)
    if request_count == 1:
        await r.expire(rate_key, 60)

    if request_count > 5:
        raise HTTPException(
            status_code=429,
            detail="请求太频繁了，请 1 分钟后再试。"
        )