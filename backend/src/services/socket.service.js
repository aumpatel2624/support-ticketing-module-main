let io;

/**
 * Socket.io Service
 */
const init = (server) => {
    const { Server } = require('socket.io');

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Add logging middleware
    io.use((socket, next) => {
        console.log(`Socket attempting connection: ${socket.id} (handshake: ${JSON.stringify(socket.handshake.query)})`);
        next();
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        console.log('Socket Handshake Auth:', socket.handshake.auth);
        console.log('Socket Handshake Headers:', socket.handshake.headers);

        // Join room based on user role/id if needed
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room`);
        });

        socket.on('join_department', (deptId) => {
            socket.join(`dept_${deptId}`);
            console.log(`User joined department room: dept_${deptId}`);
        });

        socket.on('join_ticket', (ticketId) => {
            socket.join(`ticket_${ticketId}`);
            console.log(`User joined ticket room: ticket_${ticketId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.id}. Reason: ${reason}`);
        });

        socket.on('error', (err) => {
            console.error(`Socket error for ${socket.id}:`, err);
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
