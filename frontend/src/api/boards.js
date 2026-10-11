import client from './client';

export async function listBoards() {
    const { data } = await client.get('/boards');
    return data; // BoardOut[]
}

export async function getBoard(boardId) {
    const { data } = await client.get(`/boards/${boardId}`);
    return data; // BoardOut (с columns и cards)
}

export async function createBoard({ name, description = '' }) {
    const { data } = await client.post('/boards', { name, description });
    return data;
}

export async function updateBoard(boardId, { name, description }) {
    const { data } = await client.put(`/boards/${boardId}`, { name, description });
    return data;
}

export async function deleteBoard(boardId) {
    await client.delete(`/boards/${boardId}`);
}