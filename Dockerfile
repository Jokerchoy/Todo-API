# 使用 Alpine Linux 版本
FROM python:3.12-alpine

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai

# 安装编译依赖
RUN apk add --no-cache \
    gcc \
    musl-dev \
    linux-headers \
    curl \
    libffi-dev \
    openssl-dev

COPY requirements.txt .

# 使用阿里云 pip 源（更稳定）
RUN pip install --no-cache-dir -r requirements.txt \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]