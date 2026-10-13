import client from './client';

export async function listLabels() {
    const { data } = await client.get('/labels');
    return data;
}

export async function setCardLabels(boardId, cardId, labelIds) {
    const { data } = await client.put(
        `/boards/${boardId}/cards/${cardId}/labels`,
        { label_ids: labelIds }
    );
    return data;
}