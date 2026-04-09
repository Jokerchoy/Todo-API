# 导入必要的模块
from sqlalchemy import create_engine  # 创建数据库引擎
from sqlalchemy.ext.declarative import declarative_base  # 创建模型基类
from sqlalchemy.orm import sessionmaker  # 创建会话工厂
import os  # 操作系统接口，用于读取环境变量
from dotenv import load_dotenv  # 加载.env文件中的环境变量

# 加载.env文件中的配置
load_dotenv()

# 获取数据库URL，如果没有设置则使用默认的SQLite
# SQLite是一种轻量级的文件数据库，适合开发测试
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todos.db")

# 创建数据库引擎
# connect_args={"check_same_thread": False} 仅SQLite需要，允许多线程访问
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# 创建会话工厂
# autocommit=False: 不自动提交，需要手动commit
# autoflush=False: 不自动刷新，需要手动flush
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建模型基类，所有数据库模型都要继承这个类
Base = declarative_base()

# 依赖注入函数：每个请求都会调用这个函数，获取数据库会话
def get_db():
    """
    这个函数的作用：
    1. 创建一个新的数据库会话
    2. 将会话交给API端点使用
    3. 请求结束后关闭会话，释放资源
    """
    db = SessionLocal()  # 创建会话
    try:
        yield db  # 将会话返回给API端点
    finally:
        db.close()  # 确保会话被关闭