import client from './client';

export async function listMembers(boardId) {
    const { data } = await client.get(`/boards/${boardId}/members`);
    return data;
}

export async function addMember(boardId, { username, role = 'member' }) {
    const { data } = await client.post(`/boards/${boardId}/members`, {
        username,
        role,
    });
    return data;
}

export async function removeMember(boardId, userId) {
    await client.delete(`/boards/${boardId}/members/${userId}`);
}