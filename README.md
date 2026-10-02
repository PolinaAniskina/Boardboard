# Kanban Board

Канбан-доска (пока что с очень ограниченным функционалом).

## Стек

- **Бэкенд**: FastAPI + SQLAlchemy + SQLite
- **Фронтенд**: React
- **Контейнеризация**: Docker Compose

## Возможности

- Регистрация и авторизация (JWT)
- Несколько досок, у каждой свои колонки и карточки
- REST API с автодокументацией (Swagger)

## Запуск

```bash
# Через Docker
docker-compose up --build

# Или локально (бэкенд)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# В втором терминале (фронтенд)
cd frontend
npm start
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Модели БД

- **User** — пользователь (username, email, пароль, роль)
- **Board** — доска (name, description, owner)
- **Column** — колонка доски (name, position)
- **Card** — карточка (title, description, status, assignee)
- **Label** — метка (name, color), many-to-many с Card
- **AuditLog** — журнал изменений (action, entity, details)
