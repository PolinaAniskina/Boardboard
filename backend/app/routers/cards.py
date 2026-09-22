"""
Роутер карточек: создание, редактирование, перемещение, удаление.
При любом изменении пишем в audit log и отправляем WebSocket-событие.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Board, Column, Card
from app.schemas import CardCreate, CardUpdate, CardMove, CardOut
from app.auth import get_current_user
from app.services.audit import log_action
from app.services.ws_manager import manager

router = APIRouter(prefix="/boards/{board_id}/cards", tags=["cards"])


def get_board_or_404(board_id: int, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    return board


async def notify_board(board_id: int, event: str, data: dict):
    await manager.broadcast(board_id, {"event": event, "data": data})


@router.get("", response_model=list[CardOut])
def list_cards(board_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    get_board_or_404(board_id, db)
    return (
        db.query(Card)
        .join(Column, Card.column_id == Column.id)
        .filter(Column.board_id == board_id)
        .order_by(Column.position, Card.position)
        .all()
    )


@router.post("", response_model=CardOut, status_code=201)
async def create_card(board_id: int, data: CardCreate,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_board_or_404(board_id, db)
    if data.column_id:
        col = db.query(Column).filter(Column.id == data.column_id,
                                        Column.board_id == board_id).first()
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
async def update_card(board_id: int, card_id: int, data: CardUpdate,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

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
async def move_card(board_id: int, card_id: int, data: CardMove,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    old_column_id = card.column_id
    col = db.query(Column).filter(Column.id == data.column_id,
                                    Column.board_id == board_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Колонка не найдена")

    card.column_id = data.column_id
    card.position = data.position

    status_map = {"backlog": "backlog", "to_do": "todo", "in_progress": "in_progress",
                    "review": "review", "done": "done"}
    card.status = status_map.get(col.name.lower().replace(" ", "_"), card.status)

    db.commit()
    db.refresh(card)

    log_action(db, board_id, user.id, "move", "card", card.id,
                {"from_column": old_column_id, "to_column": data.column_id})
    await notify_board(board_id, "card_moved", CardOut.model_validate(card).model_dump())
    return card


@router.delete("/{card_id}", status_code=204)
async def delete_card(board_id: int, card_id: int,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    db.delete(card)
    db.commit()

    log_action(db, board_id, user.id, "delete", "card", card_id, {})
    await notify_board(board_id, "card_deleted", {"id": card_id})
