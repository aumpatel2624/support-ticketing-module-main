const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User who performed the action
 *         action:
 *           type: string
 *           description: Action performed (CREATE, UPDATE, DELETE, LOGIN, etc)
 *         resource:
 *           type: string
 *           description: Resource type (TICKET, USER, DEPARTMENT, etc)
 *         resourceId:
 *           type: string
 *           description: ID of the resource
 *         oldValue:
 *           type: object
 *           description: Previous state
 *         newValue:
 *           type: object
 *           description: New state
 *         ipAddress:
 *           type: string
 *         userAgent:
 *           type: string
 */

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'STATUS_CHANGE', 'PASSWORD_CHANGE', 'UPLOAD', 'DOWNLOAD'],
        index: true
    },
    resource: {
        type: String,
        required: true,
        enum: ['USER', 'TICKET', 'DEPARTMENT', 'CATEGORY', 'NOTIFICATION', 'system'],
        index: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    ipAddress: String,
    userAgent: String,
    details: String
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for common queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
