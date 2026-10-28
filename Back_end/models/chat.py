from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Text
from models.base import Base

class Conversation(Base):
    """会话表"""
    __tablename__ = "conversation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="会话ID")

    # 会话标题，比如用户问的第一句话，或者默认的"新对话"
    title: Mapped[str] = mapped_column(String(100), nullable=False, default="新对话", comment="会话标题")

    # 定义一对多关系：一个会话包含多条消息。
    # back_populates 让 Message 也能反向找到 Conversation
    # cascade="all, delete-orphan" ：当删除这个会话时，它下面的所有消息也会被自动删除
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan"
    )

class Message(Base):
    """消息表"""
    __tablename__ = "message"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="消息ID")
    # 外键，关联到 conversation 表的 id
    conversation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("conversation.id", ondelete="CASCADE"),
        nullable=False,
        comment="所属会话ID"
    )
    # 角色：'user' 代表用户，'assistant' 代表 AI
    role: Mapped[str] = mapped_column(String(20), nullable=False, comment="角色(user/assistant)")
    # 消息内容，因为 AI 回复可能很长，所以用 Text 类型而不是 String
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="消息内容")
    # 反向关联：每条消息都能找到它属于哪个会话
    conversation: Mapped["Conversation"] = relationship(back_populates="messages")