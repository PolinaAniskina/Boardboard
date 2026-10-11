import { useCallback, useEffect, useState } from 'react';
import { getBoard } from '../api/boards';
import {
    createColumn as apiCreateColumn,
    updateColumn as apiUpdateColumn,
    deleteColumn as apiDeleteColumn,
} from '../api/columns';
import {
    createCard as apiCreateCard,
    updateCard as apiUpdateCard,
    deleteCard as apiDeleteCard,
    moveCard as apiMoveCard,
} from '../api/cards';

function sortColumns(columns) {
    return [...columns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function sortCards(cards) {
    return [...cards].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function normalizeBoard(board) {
    return {
        ...board,
        columns: sortColumns(board.columns || []).map((c) => ({
            ...c,
            cards: sortCards(c.cards || []),
        })),
    };
}
// Локальный arrayMove — чтобы не тянуть импорт из dnd-kit в хук
function arrayMoveLocal(arr, from, to) {
    const next = arr.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}

export function useBoardData(boardId) {
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getBoard(boardId);
            setBoard(normalizeBoard(data));
        } catch (e) {
            setError(e?.response?.data?.detail || 'Не удалось загрузить доску');
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        load();
    }, [load]);

    // --- Колонки ---

    const addColumn = useCallback(
        async ({ name }) => {
            const current = board?.columns ?? [];
            const position =
                current.length > 0
                    ? Math.max(...current.map((c) => c.position ?? 0)) + 1
                    : 0;
            const created = await apiCreateColumn(boardId, { name, position });
            setBoard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    columns: sortColumns([...prev.columns, { ...created, cards: [] }]),
                };
            });
            return created;
        },
        [boardId, board]
    );

    const editColumn = useCallback(
        async (columnId, { name }) => {
            const updated = await apiUpdateColumn(boardId, columnId, { name });
            setBoard((prev) => {
                if (!prev) return prev;
                const columns = prev.columns.map((c) =>
                    c.id === updated.id ? { ...c, ...updated, cards: c.cards } : c
                );
                return { ...prev, columns };
            });
            return updated;
        },
        [boardId]
    );

    const removeColumn = useCallback(
        async (columnId) => {
            await apiDeleteColumn(boardId, columnId);
            setBoard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    columns: prev.columns.filter((c) => c.id !== columnId),
                };
            });
        },
        [boardId]
    );

    // --- Карточки ---

    const addCard = useCallback(
        async (payload) => {
            const created = await apiCreateCard(boardId, payload);
            setBoard((prev) => {
                if (!prev) return prev;
                const columns = prev.columns.map((c) => {
                    if (c.id !== created.column_id) return c;
                    return { ...c, cards: sortCards([...c.cards, created]) };
                });
                return { ...prev, columns };
            });
            return created;
        },
        [boardId]
    );

    const editCard = useCallback(
        async (cardId, payload) => {
            const updated = await apiUpdateCard(boardId, cardId, payload);
            setBoard((prev) => {
                if (!prev) return prev;
                const columns = prev.columns.map((c) => {
                    if (c.id !== updated.column_id) return c;
                    return {
                        ...c,
                        cards: sortCards(
                            c.cards.map((card) => (card.id === updated.id ? updated : card))
                        ),
                    };
                });
                return { ...prev, columns };
            });
            return updated;
        },
        [boardId]
    );

    const removeCard = useCallback(
        async (cardId) => {
            await apiDeleteCard(boardId, cardId);
            setBoard((prev) => {
                if (!prev) return prev;
                const columns = prev.columns.map((c) => ({
                    ...c,
                    cards: c.cards.filter((card) => card.id !== cardId),
                }));
                return { ...prev, columns };
            });
        },
        [boardId]
    );

    // --- Перемещение карточки (dnd) ---
    const moveCard = useCallback(
        async ({ cardId, fromColumnId, toColumnId, toIndex }) => {
            // Снимок для отката
            let snapshot = null;
            let nextColumns = null;

            setBoard((prev) => {
                if (!prev) return prev;
                snapshot = prev;

                const fromCol = prev.columns.find((c) => c.id === fromColumnId);
                const toCol = prev.columns.find((c) => c.id === toColumnId);
                if (!fromCol || !toCol) return prev;

                const card = fromCol.cards.find((c) => c.id === cardId);
                if (!card) return prev;

                if (fromColumnId === toColumnId) {
                    // Перемещение внутри колонки
                    const oldIndex = fromCol.cards.findIndex((c) => c.id === cardId);
                    // Клампим индекс
                    const clampedIndex = Math.max(
                        0,
                        Math.min(toIndex, fromCol.cards.length - 1)
                    );
                    if (oldIndex === clampedIndex) return prev;

                    const newCards = arrayMoveLocal(fromCol.cards, oldIndex, clampedIndex);
                    const columns = prev.columns.map((c) =>
                        c.id === fromColumnId ? { ...c, cards: newCards } : c
                    );
                    nextColumns = columns;
                    return { ...prev, columns };
                }

                // Перемещение между колонками
                const fromCards = fromCol.cards.filter((c) => c.id !== cardId);
                const movedCard = { ...card, column_id: toColumnId };
                const toCards = [...toCol.cards];
                const insertAt = Math.max(0, Math.min(toIndex, toCards.length));
                toCards.splice(insertAt, 0, movedCard);

                const columns = prev.columns.map((c) => {
                    if (c.id === fromColumnId) return { ...c, cards: fromCards };
                    if (c.id === toColumnId) return { ...c, cards: toCards };
                    return c;
                });
                nextColumns = columns;
                return { ...prev, columns };
            });

            try {
                const updated = await apiMoveCard(boardId, cardId, {
                    column_id: toColumnId,
                    position: toIndex,
                });

                // Обновляем только саму карточку (её status / position / column_id),
                // НЕ трогая порядок остальных карточек
                setBoard((prev) => {
                    if (!prev) return prev;
                    const columns = prev.columns.map((c) => ({
                        ...c,
                        cards: c.cards.map((x) =>
                            x.id === updated.id ? { ...x, ...updated } : x
                        ),
                    }));
                    return { ...prev, columns };
                });
            } catch (e) {
                if (snapshot) setBoard(snapshot);
                alert(e?.response?.data?.detail || 'Не удалось переместить карточку');
            }
        },
        [boardId]
    );

    // --- Перестановка колонок (dnd) ---
    const reorderColumns = useCallback(
        async (orderedIds) => {
            let snapshot = null;
            setBoard((prev) => {
                if (!prev) return prev;
                snapshot = prev;
                const map = new Map(prev.columns.map((c) => [c.id, c]));
                const columns = orderedIds
                    .map((id, index) => {
                        const col = map.get(id);
                        if (!col) return null;
                        return { ...col, position: index };
                    })
                    .filter(Boolean);
                return { ...prev, columns };
            });

            try {
                // Обновляем только те колонки, у которых реально изменилась позиция
                await Promise.all(
                    orderedIds.map((id, index) =>
                        apiUpdateColumn(boardId, id, { position: index })
                    )
                );
            } catch (e) {
                if (snapshot) setBoard(snapshot);
                alert(e?.response?.data?.detail || 'Не удалось переставить колонки');
            }
        },
        [boardId]
    );

    return {
        board,
        loading,
        error,
        reload: load,
        addColumn,
        editColumn,
        removeColumn,
        addCard,
        editCard,
        removeCard,
        moveCard,
        reorderColumns,
    };
}