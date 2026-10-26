from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import time

router = APIRouter()

def fake_ai_stream():
    words = ["你好！", "我", "是", "AI", "助手。", "流式", "输出", "测试。"]
    for word in words:
        time.sleep(0.5)
        # 注意这里的空格，前端解析要靠它
        yield f"data: {word}\n\n"
    yield "data: [DONE]\n\n"

# 改成 POST，路径改成 /chat/stream
@router.post("/chat/stream")
async def chat_stream():
    return StreamingResponse(fake_ai_stream(), media_type="text/event-stream")