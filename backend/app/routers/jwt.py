# app/routers/jwt.py
from datetime import datetime, timedelta
from typing import Any, Dict
from jose import jwt

SECRET_KEY = "твой_секрет"  # лучше вынести в env
ALGORITHM = "HS256"

def create_access_token(user_id: int, roles: list[str], expires_days: int = 7) -> str:
    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "roles": roles,
        "exp": datetime.utcnow() + timedelta(days=expires_days),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload
