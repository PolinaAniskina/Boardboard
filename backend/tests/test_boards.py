def test_create_board_as_member(auth_client):
    payload = { "name": "My Board",
               "description": "Test"
               }
    resp = auth_client.post("/api/boards", json=payload)
    assert resp.status_code in (201, 403)


def test_delete_board_as_admin(auth_admin_client, admin_user):
    # Создаёт и удаляет админ
    create_resp = auth_admin_client.post("/api/boards", json={"name": "ToDelete", "description": ""})
    assert create_resp.status_code == 201
    board_id = create_resp.json()["id"]

    delete_resp = auth_admin_client.delete(f"/api/boards/{board_id}")
    assert delete_resp.status_code in (200, 204)

    get_resp = auth_admin_client.get(f"/api/boards/{board_id}")
    assert get_resp.status_code == 404


