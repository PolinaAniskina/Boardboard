from sqlalchemy.orm import Session
from .models import Role, User
from .database import get_db, engine

ROLES_NAMES = ["admin", "member"]


def seed_roles(db: Session) -> list[str]:
    created = []
    for name in ROLES_NAMES:
        if not db.query(Role).filter(Role.name == name).first():
            db.add(Role(name=name))
            created.append(name)
    if created:
        db.commit()
    return created


def assign_admin_to_user(db: Session, username: str) -> bool:
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    user = db.query(User).filter(User.username == username).first()
    if not admin_role or not user:
        return False
    if admin_role not in user.roles:
        user.roles.append(admin_role)
        db.commit()
    return True