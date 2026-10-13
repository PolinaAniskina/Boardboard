"""
Засев предопределённых меток.
Вызывается из lifespan при старте приложения.
"""
from sqlalchemy.orm import Session
from .models import Label

PRESET_LABELS = [
    ("Не начато", "#d93a3a"),
    ("В процессе", "#3b6cf6"),
    ("Сделано", "#2e7d3a"),
]


def seed_labels(db: Session) -> list[str]:
    created = []
    for name, color in PRESET_LABELS:
        if not db.query(Label).filter(Label.name == name).first():
            db.add(Label(name=name, color=color))
            created.append(name)
    if created:
        db.commit()
    return created