import client from './client';

export async function listCards(boardId) {
    const { data } = await client.get(`/boards/${boardId}/cards`);
    return data;
}

export async function createCard(boardId, payload) {
    const { data } = await client.post(`/boards/${boardId}/cards`, payload);
    return data;
}

export async function updateCard(boardId, cardId, payload) {
    const { data } = await client.put(
        `/boards/${boardId}/cards/${cardId}`,
        payload
    );
    return data;
}

export async function moveCard(boardId, cardId, { column_id, position }) {
    const { data } = await client.post(
        `/boards/${boardId}/cards/${cardId}/move`,
        { column_id, position }
    );
    return data;
}

export async function deleteCard(boardId, cardId) {
    await client.delete(`/boards/${boardId}/cards/${cardId}`);
}