FROM python:3.11-slim
WORKDIR /app

# 安装系统依赖（aiomysql 可能需要）
RUN apt-get update && apt-get install -y gcc default-libmysqlclient-dev pkg-config

COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .
# 暴露端口
EXPOSE 8000
# 启动命令，注意 host 必须是 0.0.0.0
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]