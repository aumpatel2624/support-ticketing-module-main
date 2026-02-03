const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');

/**
 * @desc    Get all audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (SuperAdmin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { userId, action, resource, dateFrom, dateTo } = req.query;

    const filter = {};
    if (userId) {
        filter.userId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;
    }
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .populate('userId', 'name email employeeId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(filter)
    ]);

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: logs,
        pagination
    });
});

/**
 * @desc    Get system statistics for admin
 * @route   GET /api/admin/system-stats
 * @access  Private (SuperAdmin)
 */
const getSystemStats = asyncHandler(async (req, res) => {
    const [userCount, ticketCount, deptCount] = await Promise.all([
        require('../models/User').countDocuments(),
        require('../models/Ticket').countDocuments(),
        require('../models/Department').countDocuments()
    ]);

    res.status(200).json({
        success: true,
        data: {
            users: userCount,
            tickets: ticketCount,
            departments: deptCount
        }
    });
});

module.exports = {
    getAuditLogs,
    getSystemStats
};
