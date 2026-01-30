import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize Socket.io connection
 */
export const initSocket = (token) => {
    if (socket?.connected) return socket;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    socket = io(apiUrl, {
        auth: {
            token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    return socket;
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
        return () => socket.off(event, callback);
    }
    return () => {};
};

/**
 * Stop listening for socket events
 */
export const offSocketEvent = (event, callback) => {
    if (socket) {
        socket.off(event, callback);
    }
};
