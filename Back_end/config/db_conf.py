from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from models.base import Base
import os

# 💡 如果环境变量里没有 MYSQL_HOST，默认用 127.0.0.1（本地开发）
DB_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
DB_PORT = os.getenv("MYSQL_PORT", "3306")
DB_USER = os.getenv("MYSQL_USER", "root")
DB_PASS = os.getenv("MYSQL_PASSWORD", "123456")

ASYNC_DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/aichat_db?charset=utf8"

#创建异步引擎
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,# 输出SQL日志
    pool_size=10,# 连接池大小
    max_overflow=20,# 最大溢出连接数
)

#创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

#依赖项，用于获取数据库会话
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

#建表
async def create_tables():
    async with async_engine.begin() as conn:
        # 这里的 run_sync 是在异步环境中执行同步的 SQLAlchemy 操作
        await conn.run_sync(Base.metadata.create_all)
    # print("数据库表初始化完成！")