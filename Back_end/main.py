import uvicorn
from fastapi import FastAPI
from routers import chat,conversations
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.db_conf import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 服务器启动时执行：
    await create_tables()
    print("服务器启动成功！")
    yield  # 这里代表服务器正在运行中...
    # 服务器关闭时执行（比如清理资源）：
    print("服务器关闭。")

app = FastAPI(lifespan=lifespan)

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# 挂载路由
app.include_router(chat.router)
app.include_router(conversations.router)

@app.get("/")
async def root():
    return {"message": "Hello AI Chat"}

if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=8000)