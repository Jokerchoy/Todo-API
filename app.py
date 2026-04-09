from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from auth import router as auth_router
from todos import router as todos_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="待办事项API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(todos_router)

@app.get("/")
def root():
    return {"message": "欢迎使用待办事项API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)