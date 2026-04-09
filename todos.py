from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import User, Todo
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/todos", tags=["待办事项"])


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 1


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[int] = None


class TodoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(todo_data: TodoCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_todo = Todo(
        title=todo_data.title,
        description=todo_data.description,
        priority=todo_data.priority,
        owner_id=current_user.id
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo


@router.get("/", response_model=List[TodoResponse])
def get_all_todos(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=200),
        completed: Optional[bool] = Query(None),
        priority: Optional[int] = Query(None, ge=1, le=3),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    query = db.query(Todo).filter(Todo.owner_id == current_user.id)
    if completed is not None:
        query = query.filter(Todo.completed == completed)
    if priority is not None:
        query = query.filter(Todo.priority == priority)
    todos = query.order_by(Todo.created_at.desc()).offset(skip).limit(limit).all()
    return todos


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo_by_id(todo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == current_user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"待办事项 ID {todo_id} 不存在")
    return todo


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo_data: TodoUpdate, current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == current_user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"待办事项 ID {todo_id} 不存在")
    if todo_data.title is not None:
        todo.title = todo_data.title
    if todo_data.description is not None:
        todo.description = todo_data.description
    if todo_data.completed is not None:
        todo.completed = todo_data.completed
    if todo_data.priority is not None:
        todo.priority = todo_data.priority
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == current_user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"待办事项 ID {todo_id} 不存在")
    db.delete(todo)
    db.commit()
    return None


@router.patch("/{todo_id}/complete", response_model=TodoResponse)
def mark_complete(todo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == current_user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"待办事项 ID {todo_id} 不存在")
    todo.completed = True
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}/incomplete", response_model=TodoResponse)
def mark_incomplete(todo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == current_user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"待办事项 ID {todo_id} 不存在")
    todo.completed = False
    db.commit()
    db.refresh(todo)
    return todo