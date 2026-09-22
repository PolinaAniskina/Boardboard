"""
Pydantic-схемы — валидация входных данных и сериализация ответов.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class BoardCreate(BaseModel):
    name: str
    description: str = ""


class BoardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ColumnCreate(BaseModel):
    name: str
    position: int = 0


class ColumnUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None


class CardCreate(BaseModel):
    title: str
    description: str = ""
    position: int = 0
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None


class CardMove(BaseModel):
    column_id: int
    position: int = 0


class CardOut(BaseModel):
    id: int
    column_id: int
    title: str
    description: str
    position: int
    status: str
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class ColumnOut(BaseModel):
    id: int
    board_id: int
    name: str
    position: int
    cards: list[CardOut] = []
    model_config = {"from_attributes": True}

class BoardOut(BaseModel):
    id: int
    name: str
    description: str
    owner_id: int
    created_at: datetime
    columns: list[ColumnOut] = []
    model_config = {"from_attributes": True}


class LabelCreate(BaseModel):
    name: str
    color: str = "#6b7280"


class LabelOut(BaseModel):
    id: int
    name: str
    color: str
    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: int
    board_id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[dict] = None
    created_at: datetime
    model_config = {"from_attributes": True}
