"""
Сериализация Board в BoardOut с полным деревом:
колонки, карточки, участники.
"""
from sqlalchemy.orm import Session

from app.models import Board, User, board_members
from app.schemas import BoardOut, BoardMemberOut


def build_members_list(board: Board, db: Session) -> list[BoardMemberOut]:
    """
    Собирает список участников доски:
    - владелец (owner_id) с ролью "owner" и флагом is_owner=True
    - все записи из board_members с их ролями
    """
    result: list[BoardMemberOut] = []
    seen_user_ids: set[int] = set()

    # 1. Владелец
    owner = db.query(User).filter(User.id == board.owner_id).first()
    if owner:
        result.append(
            BoardMemberOut(
                user_id=owner.id,
                username=owner.username,
                email=owner.email,
                role="owner",
                is_owner=True,
            )
        )
        seen_user_ids.add(owner.id)

    # 2. Участники из board_members
    rows = (
        db.query(User, board_members.c.role)
        .join(board_members, board_members.c.user_id == User.id)
        .filter(board_members.c.board_id == board.id)
        .all()
    )
    for user, role in rows:
        if user.id in seen_user_ids:
            # Если owner уже был — не дублируем.
            # (Теоретически возможно, если владельца зачем-то добавили в members.)
            continue
        result.append(
            BoardMemberOut(
                user_id=user.id,
                username=user.username,
                email=user.email,
                role=role or "member",
                is_owner=False,
            )
        )
        seen_user_ids.add(user.id)

    return result


def serialize_board(
    board: Board,
    db: Session,
    *,
    include_members: bool = True,
) -> BoardOut:
    return BoardOut(
        id=board.id,
        name=board.name,
        description=board.description,
        owner_id=board.owner_id,
        created_at=board.created_at,
        columns=board.columns,
        members=build_members_list(board, db) if include_members else [],
    )