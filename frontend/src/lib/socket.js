import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

/**
 * Initialize Socket.io connection
 */
export const initSocket = (token) => {
    // If socket exists with same token, reuse it
    if (socket && socket.connected && currentToken === token) {
        return socket;
    }

    // If token changed or socket is stale, disconnect old one
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    if (!token) return null;

    try {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Remove /api suffix for socket connection
        if (apiUrl.endsWith('/api')) {
            apiUrl = apiUrl.replace(/\/api$/, '');
        }

        currentToken = token;

        socket = io(apiUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'], // WebSocket first, polling fallback
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
            timeout: 20000,
            auth: {
                token: token
            }
        });

        socket.on('connect', () => {
            // Socket connected
        });

        socket.on('connect_error', (error) => {
            // Silent error for socket connection
        });

        socket.on('disconnect', (reason) => {
            // If server disconnected us, try to reconnect
            if (reason === 'io server disconnect') {
                socket.connect();
            }
        });

        return socket;
    } catch (error) {
        socket = null;
        currentToken = null;
        return null;
    }
};

/**
 * Get active socket instance
 */
export const getSocket = () => {
    return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentToken = null;
    }
};

/**
 * Emit event to server
 */
export const emitSocketEvent = (event, data) => {
    if (socket && socket.connected) {
        socket.emit(event, data);
    }
};

/**
 * Listen for socket events
 */
export const onSocketEvent = (event, callback) => {
    if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
    }
    return () => { };
};

/**
 * Stop listening for socket events
 */
export const offSocketEvent = (event, callback) => {
    if (socket) {
        socket.off(event, callback);
    }
};
