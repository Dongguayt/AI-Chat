from pydantic import BaseModel
from datetime import datetime

class ConversationResponse(BaseModel):
    id: int
    title: str
    create_time: datetime
    # 配置模型属性，将数据库字段映射到模型字段
    model_config = {"from_attributes": True}

class ConversationCreate(BaseModel):
    """创建会话时的请求体"""
    title: str = "新对话" # 如果前端没传，默认叫“新对话”

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    create_time: datetime
    # 配置模型属性，将数据库字段映射到模型字段
    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    """发送消息时的请求体"""
    conversation_id: int
    content: str