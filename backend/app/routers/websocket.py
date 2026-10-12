"""
WebSocket-эндпоинт для real-time обновлений доски.

"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError

from app.routers.jwt import decode_access_token
from app.database import SessionLocal
from app.models import User, Board, board_members
from app.services.ws_manager import manager

router = APIRouter(tags=["websocket"])

# Код закрытия WS: «политика нарушена» — используется для
# ошибок аутентификации/авторизации, чтобы клиент не пытался
# переподключиться автоматически.
WS_POLICY_VIOLATION = 1008


def _check_board_access(db, user_id: int, board_id: int) -> tuple[bool, str]:
    """
    Проверяет, имеет ли пользователь доступ к доске.
    Возвращает (ok, reason).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False, "user_not_found"

    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        return False, "board_not_found"

    # Глобальный админ — доступ ко всему
    role_names = {r.name for r in user.roles}
    if "admin" in role_names:
        return True, ""

    if board.owner_id == user.id:
        return True, ""

    is_member = (
        db.query(board_members)
        .filter(
            board_members.c.board_id == board_id,
            board_members.c.user_id == user.id,
        )
        .first()
        is not None
    )
    if is_member:
        return True, ""

    return False, "no_access"


@router.websocket("/ws/{board_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    board_id: int,
    token: str = Query(default=""),
):
    # --- 1. Проверка токена ---
    if not token:
        await websocket.close(
            code=WS_POLICY_VIOLATION, reason="Token is required"
        )
        return

    try:
        payload = decode_access_token(token)
    except JWTError:
        await websocket.close(
            code=WS_POLICY_VIOLATION, reason="Invalid token"
        )
        return

    sub = payload.get("sub")
    if not sub:
        await websocket.close(
            code=WS_POLICY_VIOLATION, reason="Invalid token payload"
        )
        return

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        await websocket.close(
            code=WS_POLICY_VIOLATION, reason="Invalid user id"
        )
        return

    # --- 2. Проверка доступа к доске ---
    db = SessionLocal()
    try:
        ok, reason = _check_board_access(db, user_id, board_id)
    finally:
        db.close()

    if not ok:
        await websocket.close(
            code=WS_POLICY_VIOLATION, reason=reason or "Forbidden"
        )
        return

    # --- 3. Всё ок — принимаем соединение ---
    await manager.connect(board_id, websocket)
    try:
        while True:
            # Клиент ничего не шлёт, но цикл нужен,
            # чтобы держать соединение открытым и ловить disconnect.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(board_id, websocket)