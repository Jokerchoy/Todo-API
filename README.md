# Todo API - 待办事项管理系统

一个基于 FastAPI 构建的现代化 RESTful API 待办事项管理系统，支持用户认证、JWT Token、完整的 CRUD 操作。

## ※功能特性

- **用户认证系统**
  - 用户注册、登录
  - JWT Token 认证
  - 密码加密存储（bcrypt）
  - Token 过期机制（30分钟）

- **待办事项管理**
  - 创建待办事项
  - 查看所有/单个待办
  - 更新待办内容
  - 删除待办事项
  - 标记完成/未完成状态
  - 优先级设置（1-低、2-中、3-高）

- **高级功能**
  - 分页查询（skip/limit）
  - 状态筛选（completed/uncompleted）
  - 优先级筛选
  - 按创建时间排序

- **数据安全**
  - 用户数据隔离（只能访问自己的待办）
  - 密码哈希存储
  - JWT 安全认证

## ※技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.12+ | 编程语言 |
| FastAPI | 0.104.1 | Web 框架 |
| SQLAlchemy | 2.0.23 | ORM 框架 |
| SQLite | - | 数据库 |
| Pydantic | 2.5.0 | 数据验证 |
| python-jose | 3.3.0 | JWT 处理 |
| passlib | 1.7.4 | 密码加密 |
| bcrypt | 4.0.1 | 哈希算法 |
| Uvicorn | 0.24.0 | ASGI 服务器 |

## ※安装与运行

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/todo-api.git
cd todo-api
```
### 2. 创建虚拟环境
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Mac/Linux
python3 -m venv .venv
source .venv/bin/activate
```
### 3. 安装依赖
```bash
pip install -r requirements.txt
```
### 4.配置环境变量（可选）
```bash
DATABASE_URL=sqlite:///./todos.db
SECRET_KEY=your-secret-key-change-this-in-production
```
### 5.运行应用
```bash
python app.py
```
或使用
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 6.访问API文档
Swagger UI: http://localhost:8000/docs

ReDoc: http://localhost:8000/redoc

## ※测试用例
```bash
# 1. 注册用户
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'

# 2. 登录获取 token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&password=123456"

# 3. 创建待办（替换 YOUR_TOKEN）
curl -X POST "http://localhost:8000/todos/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"学习 FastAPI","priority":3}'

# 4. 获取所有待办
curl -X GET "http://localhost:8000/todos/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
## ※使用Python
```python
import requests

BASE_URL = "http://localhost:8000"

# 登录
response = requests.post(f"{BASE_URL}/auth/login", 
                         data={"username": "test", "password": "123456"})
token = response.json()["access_token"]

# 创建待办
todo = requests.post(f"{BASE_URL}/todos/",
                     headers={"Authorization": f"Bearer {token}"},
                     json={"title": "我的任务", "priority": 2})
print(todo.json())
```
## ※项目结构
todo-api/

├── app.py              # 应用入口

├── auth.py             # 认证模块（注册、登录、JWT）

├── todos.py            # 待办事项模块（CRUD）

├── models.py           # 数据库模型

├── database.py         # 数据库配置

├── requirements.txt    # 依赖列表

├── .env               # 环境变量

├── todos.db           # SQLite 数据库（自动生成）

└── README.md          # 项目文档

## ※数据库设计

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PRIMARY KEY | 用户ID（自增） |
| username | String(50) | NOT NULL, UNIQUE | 用户名 |
| email | String(100) | NOT NULL, UNIQUE | 邮箱地址 |
| hashed_password | String(255) | NOT NULL | 加密后的密码 |
| is_active | Boolean | DEFAULT TRUE | 是否激活 |
| created_at | DateTime | DEFAULT NOW() | 创建时间 |

### todos 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PRIMARY KEY | 待办ID（自增） |
| title | String(200) | NOT NULL | 标题 |
| description | String(1000) | NULL | 描述 |
| completed | Boolean | DEFAULT FALSE | 完成状态 |
| priority | Integer | DEFAULT 1 | 优先级（1低/2中/3高） |
| created_at | DateTime | DEFAULT NOW() | 创建时间 |
| updated_at | DateTime | DEFAULT NOW() | 更新时间 |
| owner_id | Integer | FOREIGN KEY | 所属用户ID |

### 表关系
users (1) -----< (N) todos
- 一个用户可以有多个待办事项
- 一个待办事项只属于一个用户
- 删除用户时，级联删除其所有待办事项

### 状态码说明

200	OK - 请求成功

201	Created - 创建成功

204	No Content - 删除成功

400	Bad Request - 请求错误

401	Unauthorized - 未认证

404	Not Found - 资源不存在

422	Validation Error - 数据验证失败

## ※部署
使用docker，创建dockerfile：
```bash
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```
```bash
docker build -t todo-api .
docker run -p 8000:8000 todo-api
```
使用 Gunicorn（生产环境）
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app
```
## ※许可证
MIT License

## ※致谢
感谢 FastAPI 和 SQLAlchemy 社区提供的优秀工具

⭐ 如果这个项目对你有帮助，请给个 Star！