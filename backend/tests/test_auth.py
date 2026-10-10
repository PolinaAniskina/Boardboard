def test_register_success(client):
    payload = {
        "username": "test_reg",
        "email": "test@example.com",
        "password": "Pass123!",
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    # Только проверяем, что пользователь создан
    assert data["username"] == "test_reg"
    assert "id" in data
    # НЕ проверяем access_token здесь!


def test_register_duplicate(client, test_user):
    payload = {
        "username": "user_test_duplicate",
        "email": test_user.email,  # берём email существующего юзера
        "password": "user123"
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code in (400, 409, 422)



def test_login_success(client, test_user):
    payload = {
        "username": test_user.username,   # <-- берём из фикстуры
        "password": "user123"
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 200, f"Логин не прошёл: {resp.json()}"
    data = resp.json()
    assert "access_token" in data



def test_login_wrong_password(client, test_user):
    payload = {"username": "user_test", "password": "wrong"}
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 401
