const AuditLog = require('../models/AuditLog');

/**
 * Log a system action
 * @param {Object} data - Audit log data
 * @param {string} data.userId - ID of user performing action
 * @param {string} data.action - Action type (CREATE, UPDATE, DELETE, etc)
 * @param {string} data.resource - Resource type (USER, TICKET, etc)
 * @param {string} [data.resourceId] - ID of resource (optional)
 * @param {Object} [data.oldValue] - Previous state (optional)
 * @param {Object} [data.newValue] - New state (optional)
 * @param {Object} [data.req] - Express request object for IP and User Agent (optional)
 * @param {string} [data.details] - Additional details (optional)
 */
const logAudit = async ({
    userId,
    action,
    resource,
    resourceId,
    oldValue,
    newValue,
    req,
    details
}) => {
    try {
        const auditData = {
            userId,
            action,
            resource,
            resourceId,
            oldValue,
            newValue,
            details,
            ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
            userAgent: req ? req.headers['user-agent'] : null
        };

        await AuditLog.create(auditData);
    } catch (error) {
        console.error('Audit Logging Error:', error);
        // Silent fail to not interrupt main flow
    }
};

module.exports = { logAudit };
