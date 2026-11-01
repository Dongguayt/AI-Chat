from sqlalchemy.ext.asyncio import AsyncSession
import crud.messages as crud
from config.LLM_API import DEEPSEEK_API_KEY
from openai import AsyncOpenAI
from crud.conversations import get_conversation_by_id, update_conversation_title, get_messages_by_conv_id
from cache.chat_cache import get_context_from_cache, set_context_to_cache
import redis.asyncio as aioredis

client = AsyncOpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
)

# 流式回复
async def ai_stream(conversation_id: int, user_content: str, db: AsyncSession, r: aioredis.Redis):
    #1. 存用户消息
    await crud.create_message(db, conversation_id, "user", user_content)
    #2.如果是新会话，更新会话标题为用户输入的内容
    conv=await get_conversation_by_id(db, conversation_id)
    if conv and conv.title =='新对话':
        await update_conversation_title(db, conversation_id, user_content[:10])

    await db.commit()  # 为了确保用户消息立刻落盘（防止后续流式报错导致回滚），手动提交事务

    #3.获取历史消息作为上下文
    cached_messages = await get_context_from_cache(r, conversation_id)

    if cached_messages:
        messages = cached_messages + [{"role": "user", "content": user_content}]
    else:
        history_msg = await get_messages_by_conv_id(db, conversation_id)
        messages = [{"role": msg.role, "content": msg.content} for msg in history_msg]


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
                full_ai_reply += content
                # 按照 SSE 格式发给前端
                yield f"data: {content}\n\n"
    except Exception as e:
        print(f"大模型调用失败: {e}")
        yield f"data: [ERROR] 大模型服务异常\n\n"

    #5. 存 AI 回复
    await crud.create_message(db, conversation_id, "assistant", full_ai_reply)
    await db.commit()  # 为了确保 AI 回复立刻落盘（防止后续流式报错导致回滚），手动提交事务

    #6.更新redis缓存
    messages.append({"role": "assistant", "content": full_ai_reply})
    await set_context_to_cache(r, conversation_id, messages)

    yield "data: [DONE]\n\n"
