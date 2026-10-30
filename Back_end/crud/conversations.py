from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.chat import Conversation, Message


async def get_conversations(db:AsyncSession):
    """获取所有对话 按创建时间降序排序"""
    stmt=select(Conversation).order_by(Conversation.create_time.desc())
    results = await db.execute(stmt)
    return results.scalars().all()

async def create_conversation(db: AsyncSession,title: str):
    """新建一个会话"""
    new_conv = Conversation(title=title)
    db.add(new_conv)
    await db.flush()
    await db.refresh(new_conv) # 刷新会话对象，获取自增 ID
    return new_conv

async def get_messages_by_conv_id(db: AsyncSession, conversation_id: int):
    """获取某个会话下的所有历史消息，按时间正序"""
    stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.create_time.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_conversation_by_id(db: AsyncSession, conversation_id: int):
    """根据 ID 获取会话"""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_conversation_title(db: AsyncSession, conversation_id: int, new_title: str):
    """更新会话标题"""
    conv=await get_conversation_by_id(db, conversation_id)
    if conv:
        conv.title = new_title
        db.add(conv)
        await db.flush()
    return conv