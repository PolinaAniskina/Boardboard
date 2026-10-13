"""
Роутер участников доски.

Префикс: /boards/{board_id}/members
Права:
    - GET  — owner / участник / глобальный admin
    - POST / DELETE — owner доски / глобальный admin
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert, delete
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Board, board_members
from app.schemas import BoardMemberOut, BoardMemberCreate
from app.auth import get_current_user_with_roles
from app.services.board_serializer import build_members_list

router = APIRouter(
    prefix="/boards/{board_id}/members",
    tags=["members"],
)


def has_role(current: dict, role_name: str) -> bool:
    return role_name in current.get("roles", [])


def get_board_or_404(board_id: int, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    return board


def ensure_board_access(board: Board, current: dict, db: Session) -> None:
    """Owner, участник доски или глобальный admin."""
    user = current["user"]
    if board.owner_id == user.id or has_role(current, "admin"):
        return
    is_member = (
        db.query(board_members)
        .filter(
            board_members.c.board_id == board.id,
            board_members.c.user_id == user.id,
        )
        .first()
        is not None
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Нет доступа к этой доске")


def ensure_can_manage(board: Board, current: dict) -> None:
    """Только owner доски или глобальный admin."""
    user = current["user"]
    if board.owner_id != user.id and not has_role(current, "admin"):
        raise HTTPException(
            status_code=403, detail="Нет прав на управление участниками"
        )


@router.get("", response_model=list[BoardMemberOut])
def list_members(
    board_id: int,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db),
):
    board = get_board_or_404(board_id, db)
    ensure_board_access(board, current, db)
    return build_members_list(board, db)


@router.post("", response_model=BoardMemberOut, status_code=201)
def add_member(
    board_id: int,
    data: BoardMemberCreate,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db),
):
    board = get_board_or_404(board_id, db)
    ensure_can_manage(board, current)

    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == board.owner_id:
        raise HTTPException(
            status_code=400, detail="Владелец уже имеет доступ к доске"
        )

    already = (
        db.query(board_members)
        .filter(
            board_members.c.board_id == board_id,
            board_members.c.user_id == user.id,
        )
        .first()
    )
    if already:
        raise HTTPException(
            status_code=400, detail="Пользователь уже добавлен в доску"
        )

    role = (data.role or "member").lower()
    if role not in ("member", "admin"):
        role = "member"

    stmt = insert(board_members).values(
        board_id=board_id,
        user_id=user.id,
        role=role,
    )
    db.execute(stmt)
    db.commit()

    return BoardMemberOut(
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=role,
        is_owner=False,
    )


@router.delete("/{user_id}", status_code=204)
def remove_member(
    board_id: int,
    user_id: int,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db),
):
    board = get_board_or_404(board_id, db)
    ensure_can_manage(board, current)

    if user_id == board.owner_id:
        raise HTTPException(
            status_code=400, detail="Нельзя удалить владельца доски"
        )

    stmt = delete(board_members).where(
        board_members.c.board_id == board_id,
        board_members.c.user_id == user_id,
    )
    result = db.execute(stmt)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Участник не найден")