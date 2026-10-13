import { API_BASE_URL, getToken } from '../api/client';

const WS_POLICY_VIOLATION = 1008;

function buildWsUrl(boardId) {
    const token = getToken() || '';
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';

    // Если API_BASE_URL абсолютный — используем его,
    // иначе — строим от текущего origin (window.location)
    let base;
    if (API_BASE_URL.startsWith('http')) {
        base = API_BASE_URL.replace(/^http/, 'ws');
    } else {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        base = `${proto}//${window.location.host}${API_BASE_URL}`;
    }
    return `${base}/ws/${boardId}${qs}`;
}

export function openBoardSocket(boardId, onMessage, onStatus) {
    let ws = null;
    let closedByUser = false;
    let retry = 0;
    let reconnectTimer = null;
    let isOpen = false;

    const connect = () => {
        if (closedByUser) return;
        onStatus?.('connecting');

        let socket;
        try {
            socket = new WebSocket(buildWsUrl(boardId));
        } catch (e) {
            scheduleReconnect();
            return;
        }
        ws = socket;

        // Если к моменту открытия соединение уже «отменено» (StrictMode
        // размонтировал компонент или кто-то вызвал close()) — не даём
        // этому соединению жить.
        const safeClose = () => {
            try {
                if (
                    socket.readyState === WebSocket.OPEN ||
                    socket.readyState === WebSocket.CONNECTING
                ) {
                    socket.close();
                }
            } catch {
                // ignore
            }
        };

        socket.onopen = () => {
            if (closedByUser) {
                // Уже неактуально — закрываем немедленно
                safeClose();
                return;
            }
            isOpen = true;
            retry = 0;
            onStatus?.('open');
        };

        socket.onmessage = (event) => {
            if (closedByUser) return;
            try {
                const payload = JSON.parse(event.data);
                if (payload && typeof payload.event === 'string') {
                    onMessage?.(payload);
                }
            } catch {
                // ignore
            }
        };

        socket.onerror = () => {
            // onclose всё подчистит
        };

        socket.onclose = (event) => {
            // Игнорируем, если это не тот сокет, который сейчас «активен»
            if (ws !== socket) return;

            isOpen = false;

            if (event?.code === WS_POLICY_VIOLATION) {
                closedByUser = true;
                onStatus?.('auth_failed');
                return;
            }

            onStatus?.('closed');
            if (!closedByUser) scheduleReconnect();
        };
    };

    const scheduleReconnect = () => {
        retry += 1;
        const delay = Math.min(1000 * 2 ** (retry - 1), 15000);
        reconnectTimer = setTimeout(connect, delay);
    };

    const close = () => {
        closedByUser = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws) {
            try {
                if (
                    ws.readyState === WebSocket.OPEN ||
                    ws.readyState === WebSocket.CONNECTING
                ) {
                    ws.close();
                }
            } catch {
                // ignore
            }
        }
    };

    connect();

    return { close };
}