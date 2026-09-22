"""
Роутер колонок доски.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Board, Column
from app.schemas import ColumnCreate, ColumnUpdate, ColumnOut
from app.auth import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/boards/{board_id}/columns", tags=["columns"])


def check_board_access(board_id: int, user: User, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    return board


@router.get("", response_model=list[ColumnOut])
def list_columns(board_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    check_board_access(board_id, user, db)
    return db.query(Column).filter(Column.board_id == board_id).order_by(Column.position).all()


@router.post("", response_model=ColumnOut, status_code=201)
def create_column(board_id: int, data: ColumnCreate,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_board_access(board_id, user, db)
    col = Column(board_id=board_id, name=data.name, position=data.position)
    db.add(col)
    db.commit()
    db.refresh(col)
    log_action(db, board_id, user.id, "create", "column", col.id, {"name": col.name})
    return col


@router.put("/{column_id}", response_model=ColumnOut)
def update_column(board_id: int, column_id: int, data: ColumnUpdate,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    col = db.query(Column).filter(Column.id == column_id, Column.board_id == board_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Колонка не найдена")
    if data.name is not None:
        col.name = data.name
    if data.position is not None:
        col.position = data.position
    db.commit()
    db.refresh(col)
    return col


@router.delete("/{column_id}", status_code=204)
def delete_column(board_id: int, column_id: int,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    col = db.query(Column).filter(Column.id == column_id, Column.board_id == board_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Колонка не найдена")
    db.delete(col)
    db.commit()
