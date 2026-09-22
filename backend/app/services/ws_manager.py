"""
Менеджер WebSocket-соединений.
Хранит активные соединения, сгруппированные по board_id.
"""
import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = {}

    def connect(self, board_id: int, ws: WebSocket):
        ws.accept()
        if board_id not in self.active:
            self.active[board_id] = []
        self.active[board_id].append(ws)

    def disconnect(self, board_id: int, ws: WebSocket):
        if board_id in self.active and ws in self.active[board_id]:
            self.active[board_id].remove(ws)

    async def broadcast(self, board_id: int, message: dict):
        if board_id not in self.active:
            return
        text = json.dumps(message, ensure_ascii=False, default=str)
        dead = []
        for ws in self.active[board_id]:
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(board_id, ws)


manager = ConnectionManager()
