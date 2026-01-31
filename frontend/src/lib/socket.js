import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize Socket.io connection
 */
export const initSocket = (token) => {
    if (socket) return socket;

    try {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Remove /api suffix for socket connection to avoid namespace error
        if (apiUrl.endsWith('/api')) {
            apiUrl = apiUrl.replace(/\/api$/, '');
        }

        socket = io(apiUrl, {
            path: '/socket.io/',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return socket;
    } catch (error) {
        console.error('Failed to initialize socket:', error);
        socket = null;
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
    }
};

/**
 * Emit event to server
 */
export const emitSocketEvent = (event, data) => {
    if (socket) {
        socket.emit(event, data);
    }
};

/**
 * Listen for socket events
 */
export const onSocketEvent = (event, callback) => {
    if (socket) {
        socket.on(event, callback);
    }
};

/**
 * Stop listening for socket events
 */
export const offSocketEvent = (event, callback) => {
    if (socket) {
        socket.off(event, callback);
    }
};
