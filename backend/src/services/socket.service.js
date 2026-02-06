let io;

/**
 * Socket.io Service
 */
const init = (server) => {
    const { Server } = require('socket.io');
    const redisConfig = require('../config/redis');
    const logger = require('../utils/logger');

    // Parse origins from environment variable (comma-separated)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const origins = frontendUrl.split(',').map(url => url.trim());

    const serverOptions = {
        cors: {
            origin: origins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        allowUpgrades: true,
        pingTimeout: 60000,
        pingInterval: 25000
    };

    io = new Server(server, serverOptions);

    // Attach Redis adapter if Redis is available (needed for multi-instance scaling)
    if (redisConfig.isAvailable()) {
        try {
            const { createAdapter } = require('@socket.io/redis-adapter');
            const redis = redisConfig.getClient();
            const pubClient = redis;
            const subClient = redis.duplicate();
            io.adapter(createAdapter(pubClient, subClient));
            logger.info('Socket.io using Redis adapter for scaling');
        } catch (err) {
            logger.warn(`Socket.io Redis adapter failed: ${err.message}. Running without it.`);
        }
    } else {
        logger.info('Socket.io running without Redis adapter (single instance mode)');
    }

    // Add logging middleware
    io.use((socket, next) => {
        next();
    });

    io.on('connection', (socket) => {
        logger.info(`User connected: ${socket.id}`);

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
