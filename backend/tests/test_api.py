"""
Базовые тесты API. Запуск: pytest
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import get_db, Base
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


client = TestClient(app)


def test_register():
    resp = client.post("/api/auth/register", json={
        "username": "testuser", "email": "test@test.com", "password": "12345"})
    assert resp.status_code == 201
    assert resp.json()["username"] == "testuser"


def test_login():
    client.post("/api/auth/register", json={
        "username": "loginuser", "email": "login@test.com", "password": "12345"})
    resp = client.post("/api/auth/login", json={
        "username": "loginuser", "password": "12345"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_create_board():
    client.post("/api/auth/register", json={
        "username": "boarduser", "email": "board@test.com", "password": "12345"})
    token = client.post("/api/auth/login", json={
        "username": "boarduser", "password": "12345"}).json()["access_token"]
    resp = client.post("/api/boards", json={"name": "My Board"},
                        headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "My Board"


def test_list_boards():
    client.post("/api/auth/register", json={
        "username": "listuser", "email": "list@test.com", "password": "12345"})
    token = client.post("/api/auth/login", json={
        "username": "listuser", "password": "12345"}).json()["access_token"]
    client.post("/api/boards", json={"name": "Board 1"},
                    headers={"Authorization": f"Bearer {token}"})
    resp = client.get("/api/boards", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_unauthorized():
    resp = client.get("/api/boards")
    assert resp.status_code == 401


def test_create_column():
    client.post("/api/auth/register", json={
        "username": "coluser", "email": "col@test.com", "password": "12345"})
    token = client.post("/api/auth/login", json={
        "username": "coluser", "password": "12345"}).json()["access_token"]
    board = client.post("/api/boards", json={"name": "Col Board"},
                        headers={"Authorization": f"Bearer {token}"}).json()
    resp = client.post(f"/api/boards/{board['id']}/columns",
                        json={"name": "To Do", "position": 0},
                        headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "To Do"


def test_create_card():
    client.post("/api/auth/register", json={
        "username": "carduser", "email": "card@test.com", "password": "12345"})
    token = client.post("/api/auth/login", json={
        "username": "carduser", "password": "12345"}).json()["access_token"]
    board = client.post("/api/boards", json={"name": "Card Board"},
                        headers={"Authorization": f"Bearer {token}"}).json()
    column = client.post(f"/api/boards/{board['id']}/columns",
                            json={"name": "Backlog", "position": 0},
                            headers={"Authorization": f"Bearer {token}"}).json()
    resp = client.post(f"/api/boards/{board['id']}/cards",
                        json={"title": "My Task", "column_id": column["id"]},
                        headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["title"] == "My Task"


def test_delete_board():
    client.post("/api/auth/register", json={
        "username": "deluser", "email": "del@test.com", "password": "12345"})
    token = client.post("/api/auth/login", json={
        "username": "deluser", "password": "12345"}).json()["access_token"]
    board = client.post("/api/boards", json={"name": "Del Board"},
                        headers={"Authorization": f"Bearer {token}"}).json()
    resp = client.delete(f"/api/boards/{board['id']}",
                            headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204
