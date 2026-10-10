import uuid

import pytest
from sqlalchemy import create_engine, insert, select
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from app.models import User, Role, user_roles  # пути под свой проект
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture
def db_with_roles(db):
    result = db.execute(select(Role)).scalars().all()
    member_role = None
    admin_role = None

    if not result:
        member_role = Role(name="member")
        admin_role = Role(name="admin")
        db.add_all([member_role, admin_role])
        db.commit()
        db.refresh(member_role)
        db.refresh(admin_role)
    else:
        member_role = next((r for r in result if r.name == "member"), None)
        admin_role = next((r for r in result if r.name == "admin"), None)

    yield db, member_role, admin_role


@pytest.fixture(scope="session")
def db():
    # 1. Создаём все таблицы ОДИН РАЗ на всю сессию тестов
    Base.metadata.drop_all(bind=test_engine)  # опционально: сбрасывать перед запуском
    Base.metadata.create_all(bind=test_engine)

    # 2. Создаём сессию
    db = TestingSessionLocal()
    yield db
    # 3. После всех тестов закрываем сессию
    db.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def admin_user(db_with_roles):
    db, _, admin_role = db_with_roles
    unique_username = f"admin-{uuid.uuid4().hex[:8]}"
    unique_email = f"{unique_username}@example.com"
    hashed_password = pwd_context.hash("admin123")

    user = User(
        username=unique_username,
        email=unique_email,
        hashed_password=hashed_password,
        roles=[admin_role],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user



@pytest.fixture
def test_user(db_with_roles):
    db, member_role, _ = db_with_roles
    unique_username = f"user-{uuid.uuid4().hex[:8]}"   # уникальный username
    unique_email = f"{unique_username}@example.com"
    hashed_password = pwd_context.hash("user123")

    user = User(
        username=unique_username,
        email=unique_email,
        hashed_password=hashed_password,
        roles=[member_role],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user


@pytest.fixture
def test_admin(db):
    hashed_password = pwd_context.hash("admin123")
    user = User(username="admin_test", email="admin@example.com", hashed_password=hashed_password)
    db.add(user)
    db.flush()

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()

    stmt = insert(user_roles).values(user_id=user.id, role_id=admin_role.id)
    db.execute(stmt)

    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_client(client, test_user):
    payload = {
        "username": test_user.username,
        "password": "user123",
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 200, f"Логин не прошёл: {resp.json()}"
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client



@pytest.fixture
def auth_admin_client(client, admin_user):
    payload = {
        "username": admin_user.username,
        "password": "admin123",
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


