const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - message
 *       properties:
 *         userId:
 *           type: string
 *           description: User who receives the notification
 *         ticketId:
 *           type: string
 *           description: Related ticket ID
 *         type:
 *           type: string
 *           enum: [TicketCreated, TicketAssigned, StatusUpdated, NewComment, SLAWarning, TicketRated]
 *         message:
 *           type: string
 *           description: Notification message
 *         isRead:
 *           type: boolean
 *           description: Read status
 */

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: null
    },
    type: {
        type: String,
        enum: [
            'TicketCreated',
            'TicketAssigned',
            'StatusUpdated',
            'NewComment',
            'SLAWarning',
            'TicketRated',
            'TicketEscalated'
        ],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
