"""
Сервис аудита — запись всех действий в журнал.
"""
from sqlalchemy.orm import Session
from app.models import AuditLog


def log_action(
    db: Session,
    board_id: int,
    user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    details: dict | None = None,
):
    entry = AuditLog(
        board_id=board_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
    )
    db.add(entry)
    db.commit()
