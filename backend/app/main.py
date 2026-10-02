"""
Точка входа: FastAPI-приложение, роутеры, инициализация БД.
Запуск: uvicorn app.main:app --reload
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, boards, columns, cards, websocket
from app.seed_roles import seed_roles


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Kanban Board API",
    description="Канбан-доска с real-time обновлениями через WebSocket",
    version="1.0.0",
    lifespan=lifespan,
)

from sqlalchemy.exc import IntegrityError

@app.on_event("startup")
def startup_event():
    from app.database import get_db
    db = next(get_db())
    try:
        seed_roles(db)
    except IntegrityError:
        # Роли уже есть — нормально
        pass
    finally:
        db.close()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api")
app.include_router(boards.router, prefix="/api")
app.include_router(columns.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(websocket.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Kanban Board API", "docs": "/docs"}
