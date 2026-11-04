import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool
import os

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"

# 创建异步连接池
redis_pool = ConnectionPool.from_url(
    REDIS_URL,
    decode_responses=True,
    max_connections=20
)

# 依赖注入函数
async def get_redis():
    redis_client = aioredis.Redis(connection_pool=redis_pool)
    try:
        yield redis_client
    finally:
        await redis_client.aclose()