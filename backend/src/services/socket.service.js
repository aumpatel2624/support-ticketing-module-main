let io;

/**
 * Socket.io Service
 */
const init = (server) => {
    const { Server } = require('socket.io');
    const logger = require('../utils/logger');

    // Parse origins from environment variable (comma-separated)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const origins = frontendUrl.split(',').map(url => url.trim());

    io = new Server(server, {
        cors: {
            origin: origins.length === 1 ? origins[0] : origins,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Add logging middleware
    io.use((socket, next) => {
        // Removed sensitive handshake query log
        next();
    });

    io.on('connection', (socket) => {
        logger.info(`User connected: ${socket.id}`);
        // Removed sensitive auth and headers logs

        // Join room based on user role/id if needed
        socket.on('join', (userId) => {
            socket.join(userId);
            logger.info(`User ${userId} joined their personal room`);
        });

        socket.on('join_department', (deptId) => {
            socket.join(`dept_${deptId}`);
            logger.info(`User joined department room: dept_${deptId}`);
        });

        socket.on('join_ticket', (ticketId) => {
            socket.join(`ticket_${ticketId}`);
            logger.info(`User joined ticket room: ticket_${ticketId}`);
        });

        socket.on('disconnect', (reason) => {
            logger.info(`User disconnected: ${socket.id}. Reason: ${reason}`);
        });

        socket.on('error', (err) => {
            logger.error(`Socket error for ${socket.id}: ${err}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

/**
 * Emit event to a specific user
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId.toString()).emit(event, data);
    }
};

/**
 * Emit event to a specific department
 */
const emitToDepartment = (deptId, event, data) => {
    if (io) {
        io.to(`dept_${deptId.toString()}`).emit(event, data);
    }
};

/**
 * Emit event to a specific ticket
 */
const emitToTicket = (ticketId, event, data) => {
    if (io) {
        io.to(`ticket_${ticketId.toString()}`).emit(event, data);
    }
};

/**
 * Emit event to all users
 */
const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    init,
    getIO,
    emitToUser,
    emitToDepartment,
    emitToTicket,
    emitToAll
};
