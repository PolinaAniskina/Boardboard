"""
JWT-авторизация и хеширование паролей.
"""
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

SECRET_KEY = "super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
MAX_PASSWORD_LENGTH = 72  # Bcrypt limit

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    safe_password = password[:72]
    return pwd_context.hash(safe_password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, roles: list[str], expires_days: int = 7):
    to_encode = {
        "sub": str(user_id),
        "roles": roles,  # вот тут передаём роли
        "exp": datetime.utcnow() + timedelta(days=expires_days)
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user_with_roles(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        roles = payload.get("roles", [])
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception

    return {"user": user, "roles": roles}

def require_roles(*allowed_roles: str):
    async def role_checker(current: dict = Depends(get_current_user_with_roles)):
        user_roles = current["roles"]
        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current
    return role_checker

def has_role(user: User, role_name: str) -> bool:
    return any(r.name == role_name for r in user.roles)
