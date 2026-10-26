import uvicorn
from fastapi import FastAPI
from routers import chat
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# 挂载路由
app.include_router(chat.router, prefix="/api")

if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=8000)