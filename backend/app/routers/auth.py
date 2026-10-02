"""
Роутер авторизации: регистрация и логин.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import insert


from app.database import get_db
from app.models import User, Role, user_roles
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first():
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    # Хешируем пароль (с защитой от длинных строк)
    safe_password = str(data.password)[:72]
    hashed_password = hash_password(safe_password)

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hashed_password,
    )

    db.add(user)
    db.flush()  # <-- получаем user.id

    member_role = db.query(Role).filter(Role.name == "member").first()
    if member_role:
        stmt = insert(user_roles).values(user_id=user.id, role_id=member_role.id)
        db.execute(stmt)

    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    roles = [r.name for r in user.roles]  # ["member"] или ["admin"]
    access_token = create_access_token(user.id, roles)
    return Token(access_token=access_token, token_type="bearer")

