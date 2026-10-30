from sqlalchemy.ext.asyncio import AsyncSession

import crud.messages as crud
import asyncio

from config.LLM_API import DEEPSEEK_API_KEY
from openai import AsyncOpenAI
from crud.conversations import get_conversation_by_id, update_conversation_title, get_messages_by_conv_id

client = AsyncOpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
)

# 流式回复
async def ai_stream(conversation_id: int, user_content: str, db: AsyncSession):
    #1. 存用户消息
    await crud.create_message(db, conversation_id, "user", user_content)
    #2.如果是新会话，更新会话标题为用户输入的内容
    conv=await get_conversation_by_id(db, conversation_id)
    if conv and conv.title =='新对话':
        await update_conversation_title(db, conversation_id, user_content[:10])

    await db.commit()  # 为了确保用户消息立刻落盘（防止后续流式报错导致回滚），手动提交事务

    #3.获取历史消息作为上下文
    history_msg=await get_messages_by_conv_id(db, conversation_id)
    messages=[{"role": msg.role, "content": msg.content} for msg in history_msg]

    #4.调用模型，获取流式回复
    full_ai_reply=""
    try:
        response = await client.chat.completions.create(
            model="deepseek-flash",
            messages=messages,
            stream=True,
            reasoning_effort="high",
            extra_body={"thinking": {"type": "enabled"}},
        )
        async for chunk in response:
            # 提取增量文本
            content = chunk.choices[0].delta.content
            if content:
                await asyncio.sleep(0.1)
                full_ai_reply += content
                # 按照 SSE 格式发给前端
                yield f"data: {content}\n\n"
    except Exception as e:
        print(f"大模型调用失败: {e}")
        yield f"data: [ERROR] 大模型服务异常\n\n"

    #5. 存 AI 回复
    await crud.create_message(db, conversation_id, "assistant", full_ai_reply)
    await db.commit()  # 为了确保 AI 回复立刻落盘（防止后续流式报错导致回滚），手动提交事务
    yield "data: [DONE]\n\n"

# async def fake_ai_stream(conversation_id: int, user_content: str, db: AsyncSession):
#     # 1. 存用户消息
#     await crud.create_message(db, conversation_id, "user", user_content)
#     await db.commit()  # 为了确保用户消息立刻落盘（防止后续流式报错导致回滚），手动提交事务
#
#     words = ["你好！", "我", "是", "AI", "助手。", "真实", "存库", "测试。"]
#     full_ai_reply = ""
#
#     for word in words:
#         await asyncio.sleep(0.5)
#         full_ai_reply += word
#         yield f"data: {word}\n\n"
#
#     # 2. 存 AI 回复
#     await crud.create_message(db, conversation_id, "assistant", full_ai_reply)
#     await db.commit()  # 为了确保 AI 回复立刻落盘（防止后续流式报错导致回滚），手动提交事务
#
#     yield "data: [DONE]\n\n"