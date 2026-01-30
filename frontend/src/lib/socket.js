import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize Socket.io connection
 * Currently disabled - will be enabled when real-time features are needed
 */
export const initSocket = (token) => {
    // Socket.io disabled for now
    return null;
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
 * Currently disabled - will be enabled when real-time features are needed
 */
export const onSocketEvent = (event, callback) => {
    // Socket.io disabled - return no-op listener
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
