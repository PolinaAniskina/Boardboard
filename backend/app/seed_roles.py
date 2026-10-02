from sqlalchemy.orm import Session
from .models import Role, User
from .database import get_db, engine

ROLES_NAMES = ["admin", "member"]  # у тебя две роли

def seed_roles(db: Session):
    for name in ROLES_NAMES:
        if not db.query(Role).filter(Role.name == name).first():
            role = Role(name=name)
            db.add(role)
    db.commit()

def assign_admin_to_user(db: Session, username: str):
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    user = db.query(User).filter(User.username == username).first()

    if not admin_role or not user:
        return  # роли или пользователя нет, ничего не делаем

    # Проверяем, нет ли уже этой роли у пользователя
    if admin_role not in user.roles:
        user.roles.append(admin_role)
        db.commit()
        print(f"Пользователю {username} назначена роль admin")

