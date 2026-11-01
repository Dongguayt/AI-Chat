import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool

REDIS_URL = "redis://127.0.0.1:6379/0"

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