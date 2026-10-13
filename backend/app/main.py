from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, boards, columns, cards, websocket, members, labels
from app.seed_roles import seed_roles
from app.seed_labels import seed_labels
import logging

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Создаём таблицы
    Base.metadata.create_all(bind=engine)

    # 2. Засеваем роли
    db = SessionLocal()
    try:
        seed_roles(db)
        created_labels = seed_labels(db)
        logger.info("Labels seeded: %s", created_labels or "already present")
    except Exception as e:
        logger.exception("Failed to seed roles/labels: %s", e)
        db.rollback()
    finally:
        db.close()

    yield


app = FastAPI(
    title="Kanban Board API",
    description="Канбан-доска с real-time обновлениями через WebSocket",
    version="1.0.0",
    lifespan=lifespan,
)

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
app.include_router(members.router, prefix="/api")
app.include_router(labels.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Kanban Board API", "docs": "/docs"}