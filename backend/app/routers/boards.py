"""
Роутер досок: создание, просмотр, обновление, удаление.
Теперь корректно работает с тем, что get_current_user_with_roles возвращает dict.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Board, board_members
from app.schemas import BoardCreate, BoardUpdate, BoardOut
from app.auth import get_current_user_with_roles

router = APIRouter(prefix="/boards", tags=["boards"])


def has_role(current: dict, role_name: str) -> bool:
    """Проверка, есть ли у текущего пользователя указанная роль."""
    roles = current.get("roles", [])
    return role_name in roles


@router.get("", response_model=list[BoardOut])
def list_boards(
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
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
def create_board(
    data: BoardCreate,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    board = Board(name=data.name, description=data.description, owner_id=user.id)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardOut)
def get_board(
    board_id: int,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

    # Владелец, участник доски или админ
    is_owner = board.owner_id == user.id

    is_member = (
        db.query(board_members)
        .filter(
            board_members.c.board_id == board_id,
            board_members.c.user_id == user.id,
        )
        .first()
        is not None
    )

    if not (is_owner or is_member or has_role(current, "admin")):
        raise HTTPException(status_code=403, detail="Нет доступа к этой доске")

    return board


@router.put("/{board_id}", response_model=BoardOut)
def update_board(
    board_id: int,
    data: BoardUpdate,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

    # Только владелец или админ могут редактировать
    if board.owner_id != user.id and not has_role(current, "admin"):
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")

    if data.name is not None:
        board.name = data.name
    if data.description is not None:
        board.description = data.description
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=204)
def delete_board(
    board_id: int,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    if board.owner_id != user.id and not has_role(current, "admin"):
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    db.delete(board)
    db.commit()
