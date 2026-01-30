const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/stats/dashboard
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    const { role, department: userDep, _id: userId } = req.user;

    // Base match for filtering by role/department
    const match = {};
    if (role === 'NormalUser') {
        match.createdBy = userId;
    } else if (role === 'Admin') {
        if (userDep) match.departmentId = userDep;
    } else if (role === 'TeamMember') {
        match.assignedTo = userId;
    }
    // SuperAdmin gets all stats

    // 1. Ticket status counts
    const statusCounts = await Ticket.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Transform to object { New: 5, Assigned: 2, ... }
    const statusStats = statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // 2. Priority counts
    const priorityCounts = await Ticket.aggregate([
        { $match: match },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const priorityStats = priorityCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // 3. Department distribution (for Admin/SuperAdmin)
    let departmentStats = [];
    if (['SuperAdmin', 'Admin'].includes(role)) {
        departmentStats = await Ticket.aggregate([
            { $match: match },
            { $group: { _id: '$departmentId', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'departments',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'dept'
                }
            },
            { $unwind: '$dept' },
            {
                $project: {
                    name: '$dept.name',
                    count: 1
                }
            }
        ]);
    }

    // 4. Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Ticket.aggregate([
        {
            $match: {
                ...match,
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 5. Active Agents count
    const agentFilter = {
        role: { $in: ['Admin', 'TeamMember'] },
        isActive: true
    };

    if (role === 'Admin' && userDep) {
        agentFilter.department = userDep;
    }

    const activeAgents = await User.countDocuments(agentFilter);

    // 6. Calculate Average Resolution Time
    const resolutionStats = await Ticket.aggregate([
        {
            $match: {
                ...match,
                status: { $in: ['Completed', 'Closed'] },
                resolvedAt: { $ne: null }
            }
        },
        {
            $group: {
                _id: null,
                avgTime: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } }
            }
        }
    ]);

    const avgResolutionTime = resolutionStats.length > 0
        ? Math.round(resolutionStats[0].avgTime / (1000 * 60 * 60)) // Convert to hours
        : 0;

    res.status(200).json({
        success: true,
        data: {
            statusStats,
            priorityStats,
            departmentStats,
            monthlyTrend,
            activeAgents,
            overview: {
                total: await Ticket.countDocuments(match),
                open: await Ticket.countDocuments({ ...match, status: { $nin: ['Closed', 'Completed'] } }),
                atRisk: await Ticket.countDocuments({ ...match, status: { $nin: ['Closed', 'Completed'] }, slaBreach: true }),
                resolved: await Ticket.countDocuments({ ...match, status: { $in: ['Closed', 'Completed'] } }),
                avgResolutionTime
            }
        }
    });
});

/**
 * @desc    Get detailed department reports
 * @route   GET /api/stats/reports
 * @access  Private (Admin/SuperAdmin)
 */
const getDetailedReports = asyncHandler(async (req, res) => {
    if (!['SuperAdmin', 'Admin'].includes(req.user.role)) {
        throw new AuthorizationError('Not authorized to access reports');
    }

    const { departmentId, dateFrom, dateTo } = req.query;
    const filter = {};

    if (req.user.role === 'Admin') {
        filter.departmentId = req.user.department;
    } else if (departmentId) {
        filter.departmentId = departmentId;
    }

    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // 1. Avg Resolution Time by Category
    const categoryPerformance = await Ticket.aggregate([
        { $match: { ...filter, status: { $in: ['Completed', 'Closed'] }, resolvedAt: { $ne: null } } },
        {
            $group: {
                _id: '$categoryId',
                avgTime: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                name: '$category.name',
                avgHours: { $divide: ['$avgTime', 1000 * 60 * 60] },
                count: 1
            }
        }
    ]);

    // 2. SLA Compliance Rate
    const slaCompliance = await Ticket.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                breached: { $sum: { $cond: [{ $eq: ['$slaBreach', true] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                breached: 1,
                rate: {
                    $multiply: [
                        { $divide: [{ $subtract: ['$total', '$breached'] }, '$total'] },
                        100
                    ]
                }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            categoryPerformance,
            slaCompliance: slaCompliance[0] || { total: 0, breached: 0, rate: 0 }
        }
    });
});

module.exports = {
    getDashboardStats,
    getDetailedReports
};
