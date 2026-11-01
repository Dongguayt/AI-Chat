from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from models.base import Base

ASYNC_DATABASE_URL = "mysql+aiomysql://root:123456@localhost:3306/aichat_db?charset=utf8"

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