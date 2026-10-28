from sqlalchemy.ext.asyncio import AsyncSession

import crud.messages as crud
import asyncio

async def fake_ai_stream(conversation_id: int, user_content: str, db: AsyncSession):
    # 1. 存用户消息
    await crud.create_message(db, conversation_id, "user", user_content)
    await db.commit()  # 为了确保用户消息立刻落盘（防止后续流式报错导致回滚），手动提交事务

    words = ["你好！", "我", "是", "AI", "助手。", "真实", "存库", "测试。"]
    full_ai_reply = ""

    for word in words:
        await asyncio.sleep(0.5)
        full_ai_reply += word
        yield f"data: {word}\n\n"

    # 2. 存 AI 回复
    await crud.create_message(db, conversation_id, "assistant", full_ai_reply)
    await db.commit()  # 为了确保 AI 回复立刻落盘（防止后续流式报错导致回滚），手动提交事务

    yield "data: [DONE]\n\n"