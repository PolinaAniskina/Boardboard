"""
WebSocket-эндпоинт для real-time обновлений доски.
Клиент подключается к /api/ws/{board_id} и получает события:
    card_created, card_updated, card_moved, card_deleted
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{board_id}")
async def websocket_endpoint(websocket: WebSocket, board_id: int):
    await manager.connect(board_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(board_id, websocket)
