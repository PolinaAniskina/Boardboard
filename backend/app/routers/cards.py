"""
Роутер карточек: создание, редактирование, перемещение, удаление.
Контроль доступа по ролям + аудит + WebSocket.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Board, Column, Card
from app.schemas import CardCreate, CardUpdate, CardMove, CardOut
from app.auth import get_current_user_with_roles, require_roles
from app.services.audit import log_action
from app.services.ws_manager import manager

router = APIRouter(prefix="/boards/{board_id}/cards", tags=["cards"])


def has_role(current: dict, role_name: str) -> bool:
    roles = current.get("roles", [])
    return role_name in roles


def get_board_or_404(board_id: int, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    return board


async def notify_board(board_id: int, event: str, data: dict):
    await manager.broadcast(board_id, {"event": event, "data": data})


@router.get("", response_model=list[CardOut])
def list_cards(
    board_id: int,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    get_board_or_404(board_id, db)

    # Доступ к карточкам: владелец доски, участник доски или админ
    board = db.query(Board).filter(Board.id == board_id).first()
    is_owner = board.owner_id == user.id

    from app.models import board_members  # импортируем локально, чтобы избежать циклических импортов
    is_member = (
        db.query(board_members)
        .filter(board_members.c.board_id == board_id, board_members.c.user_id == user.id)
        .first()
        is not None
    )

    if not (is_owner or is_member or has_role(current, "admin")):
        raise HTTPException(status_code=403, detail="Нет доступа к карточкам этой доски")

    return (
        db.query(Card)
        .join(Column, Card.column_id == Column.id)
        .filter(Column.board_id == board_id)
        .order_by(Column.position, Card.position)
        .all()
    )


@router.post("", response_model=CardOut, status_code=201)
async def create_card(
    board_id: int,
    data: CardCreate,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    board = get_board_or_404(board_id, db)

    # Создавать карточки может: владелец доски, участник доски или админ
    is_owner = board.owner_id == user.id
    from app.models import board_members
    is_member = (
        db.query(board_members)
        .filter(board_members.c.board_id == board_id, board_members.c.user_id == user.id)
        .first()
        is not None
    )
    if not (is_owner or is_member or has_role(current, "admin")):
        raise HTTPException(status_code=403, detail="Нет прав на создание карточек")

    if data.column_id:
        col = db.query(Column).filter(
            Column.id == data.column_id, Column.board_id == board_id
        ).first()
    else:
        col = db.query(Column).filter(Column.board_id == board_id).order_by(Column.position).first()

    if not col:
        raise HTTPException(status_code=400, detail="На доске нет колонок")

    card = Card(
        column_id=col.id,
        title=data.title,
        description=data.description,
        position=data.position,
        assignee_id=data.assignee_id,
        status="backlog",
    )
    db.add(card)
    db.commit()
    db.refresh(card)

    log_action(db, board_id, user.id, "create", "card", card.id, {"title": card.title})
    await notify_board(board_id, "card_created", CardOut.model_validate(card).model_dump())
    return card


@router.put("/{card_id}", response_model=CardOut)
async def update_card(
    board_id: int,
    card_id: int,
    data: CardUpdate,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    # Проверяем, что карточка принадлежит доске
    col = db.query(Column).filter(Column.id == card.column_id).first()
    if not col or col.board_id != board_id:
        raise HTTPException(status_code=400, detail="Карточка не относится к этой доске")

    board = col.board

    # Редактировать может: владелец доски, админ, либо (если есть логика) участник доски
    is_owner = board.owner_id == user.id
    from app.models import board_members
    is_member = (
        db.query(board_members)
        .filter(board_members.c.board_id == board_id, board_members.c.user_id == user.id)
        .first()
        is not None
    )

    if not (is_owner or is_member or has_role(current, "admin")):
        raise HTTPException(status_code=403, detail="Нет прав на редактирование карточки")

    if data.title is not None:
        card.title = data.title
    if data.description is not None:
        card.description = data.description
    if data.position is not None:
        card.position = data.position
    if data.status is not None:
        card.status = data.status
    if data.assignee_id is not None:
        card.assignee_id = data.assignee_id

    db.commit()
    db.refresh(card)

    log_action(db, board_id, user.id, "update", "card", card.id, {})
    await notify_board(board_id, "card_updated", CardOut.model_validate(card).model_dump())
    return card


@router.post("/{card_id}/move", response_model=CardOut)
async def move_card(
    board_id: int,
    card_id: int,
    data: CardMove,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    col = db.query(Column).filter(Column.id == data.column_id, Column.board_id == board_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Колонка не найдена")

    # Проверка принадлежности карточки доске
    card_col = db.query(Column).filter(Column.id == card.column_id).first()
    if not card_col or card_col.board_id != board_id:
        raise HTTPException(status_code=400, detail="Карточка не относится к этой доске")

    board = card_col.board
    is_owner = board.owner_id == user.id
    from app.models import board_members
    is_member = (
        db.query(board_members)
        .filter(board_members.c.board_id == board_id, board_members.c.user_id == user.id)
        .first()
        is not None
    )

    if not (is_owner or is_member or has_role(current, "admin")):
        raise HTTPException(status_code=403, detail="Нет прав на перемещение карточки")

    old_column_id = card.column_id
    card.column_id = data.column_id
    card.position = data.position

    status_map = {
        "backlog": "backlog",
        "to_do": "todo",
        "in_progress": "in_progress",
        "review": "review",
        "done": "done"
    }
    card.status = status_map.get(col.name.lower().replace(" ", "_"), card.status)

    db.commit()
    db.refresh(card)

    log_action(db, board_id, user.id, "move", "card", card.id,
                {"from_column": old_column_id, "to_column": data.column_id})
    await notify_board(board_id, "card_moved", CardOut.model_validate(card).model_dump())
    return card


@router.delete("/{card_id}", status_code=204)
async def delete_card(
    board_id: int,
    card_id: int,
    current: dict = Depends(get_current_user_with_roles),
    db: Session = Depends(get_db)
):
    user = current["user"]
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    # Проверка принадлежности карточке доски
    col = db.query(Column).filter(Column.id == card.column_id).first()
    if not col or col.board_id != board_id:
        raise HTTPException(status_code=400, detail="Карточка не относится к этой доске")

    board = col.board
    is_owner = board.owner_id == user.id
    from app.models import board_members
    is_member = (
        db.query(board_members)
        .filter(board_members.c.board_id == board_id, board_members.c.user_id == user.id)
        .first()
        is not None
    )

    # Удалять карточки: только владелец доски или админ (участник не может удалять)
    if not (is_owner or has_role(current, "admin")):
        raise HTTPException(status_code=403, detail="Нет прав на удаление карточки")

    db.delete(card)
    db.commit()

    log_action(db, board_id, user.id, "delete", "card", card_id, {})
    await notify_board(board_id, "card_deleted", {"id": card_id})
