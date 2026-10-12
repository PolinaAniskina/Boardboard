import { useEffect, useRef, useState } from 'react';
import { openBoardSocket } from '../ws/boardSocket';

/**
 * Подписывается на WS-события доски.
 *
 * @param {number|string} boardId
 * @param {(payload) => void} onEvent
 */
export function useBoardSocket(boardId, onEvent) {
    const [status, setStatus] = useState('connecting');
    const onEventRef = useRef(onEvent);

    // Всегда держим актуальный onEvent без пересоздания сокета
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!boardId) return;
        const { close } = openBoardSocket(
            boardId,
            (payload) => onEventRef.current?.(payload),
            (s) => setStatus(s)
        );
        return () => close();
    }, [boardId]);

    return status;
}