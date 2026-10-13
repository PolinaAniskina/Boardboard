"""
Глобальный список доступных меток.
Предопределённые метки
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Label
from app.schemas import LabelOut

router = APIRouter(prefix="/labels", tags=["labels"])


@router.get("", response_model=list[LabelOut])
def list_labels(db: Session = Depends(get_db)):
    # Список публичный — авторизация не нужна
    return db.query(Label).order_by(Label.id).all()