import client from './client';

export async function listColumns(boardId) {
    const { data } = await client.get(`/boards/${boardId}/columns`);
    return data;
}

export async function createColumn(boardId, { name, position = 0 }) {
    const { data } = await client.post(`/boards/${boardId}/columns`, {
        name,
        position,
    });
    return data;
}

export async function updateColumn(boardId, columnId, payload) {
    const { data } = await client.put(
        `/boards/${boardId}/columns/${columnId}`,
        payload
    );
    return data;
}

export async function deleteColumn(boardId, columnId) {
    await client.delete(`/boards/${boardId}/columns/${columnId}`);
}