from sqlalchemy.ext.asyncio import AsyncSession

from models.chat import Message


async def create_message(db: AsyncSession, conversation_id: int, role: str, content: str):
    """保存一条新消息"""
    new_msg = Message(conversation_id=conversation_id, role=role, content=content)
    db.add(new_msg)
    await db.flush()
    await db.refresh(new_msg) # 同样要刷新，拿到数据库生成的时间
    return new_msg