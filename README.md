# Kanban Board

Канбан-доска с real-time обновлениями через WebSocket.

## Стек

- **Бэкенд**: FastAPI + SQLAlchemy + SQLite
- **Фронтенд**: React (Vite) + dnd-kit
- **Real-time**: WebSocket
- **Контейнеризация**: Docker Compose

## Возможности

- Регистрация и авторизация (JWT)
- Несколько досок, у каждой свои колонки и карточки
- Drag & drop карточек между колонками
- Real-time: изменения видны всем подключённым участникам
- Назначение исполнителей на карточки
- Журнал всех изменений (audit log)
- REST API с автодокументацией (Swagger)

## Запуск

```bash
# Через Docker
docker-compose up --build

# Или локально (бэкенд)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Модели БД

- **User** — пользователь (username, email, пароль, роль)
- **Board** — доска (name, description, owner)
- **Column** — колонка доски (name, position)
- **Card** — карточка (title, description, status, assignee)
- **Label** — метка (name, color), many-to-many с Card
- **AuditLog** — журнал изменений (action, entity, details)
