"""
Роутер досок: создание, просмотр, обновление, удаление.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Board, board_members
from app.schemas import BoardCreate, BoardUpdate, BoardOut
from app.auth import get_current_user

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("", response_model=list[BoardOut])
def list_boards(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Board)
        .join(board_members, board_members.c.board_id == Board.id, isouter=True)
        .filter(
            (Board.owner_id == user.id) | (board_members.c.user_id == user.id)
        )
        .distinct()
        .all()
    )


@router.post("", response_model=BoardOut, status_code=201)
def create_board(data: BoardCreate, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    board = Board(name=data.name, description=data.description, owner_id=user.id)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardOut)
def get_board(board_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    return board


@router.put("/{board_id}", response_model=BoardOut)
def update_board(board_id: int, data: BoardUpdate,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    if board.owner_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")

    if data.name is not None:
        board.name = data.name
    if data.description is not None:
        board.description = data.description
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=204)
def delete_board(board_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    if board.owner_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    db.delete(board)
    db.commit()
