const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { AuthorizationError } = require('../utils/ApiError');

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
        match.departmentId = userDep;
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

    if (role === 'Admin') {
        agentFilter.department = userDep;
    }

    const activeAgents = await User.countDocuments(agentFilter);
    const totalAgents = await User.countDocuments({
        role: { $in: ['Admin', 'TeamMember'] },
        ...agentFilter.department && { department: agentFilter.department }
    });

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

    // 7. Week-over-week trends
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Current week stats
    const currentWeekActive = await Ticket.countDocuments({
        ...match,
        status: { $nin: ['Closed', 'Completed'] },
        createdAt: { $gte: oneWeekAgo }
    });

    const currentWeekSLARisk = await Ticket.countDocuments({
        ...match,
        status: { $nin: ['Closed', 'Completed'] },
        $or: [
            { slaBreach: true },
            { slaDeadline: { $lte: new Date(now.getTime() + 2 * 60 * 1000) } } // ⚠️ TESTING: 2 minutes instead of 4 hours
        ]
    });

    // Previous week stats
    const previousWeekActive = await Ticket.countDocuments({
        ...match,
        status: { $nin: ['Closed', 'Completed'] },
        createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
    });

    const previousWeekSLARisk = await Ticket.countDocuments({
        ...match,
        status: { $nin: ['Closed', 'Completed'] },
        createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
        $or: [
            { slaBreach: true },
            { slaDeadline: { $lte: new Date(oneWeekAgo.getTime() + 2 * 60 * 1000) } } // ⚠️ TESTING: 2 minutes instead of 4 hours
        ]
    });

    // Calculate trends
    const calculateTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const trends = {
        activeTickets: calculateTrend(currentWeekActive, previousWeekActive),
        slaRisk: calculateTrend(currentWeekSLARisk, previousWeekSLARisk),
        responseTime: 0, // Will be calculated below
        resolutionTime: 0 // Will be calculated below
    };

    // Calculate response time trends (using first comment as response)
    const currentWeekResponseTime = await Ticket.aggregate([
        {
            $match: {
                ...match,
                createdAt: { $gte: oneWeekAgo },
                comments: { $exists: true, $ne: [] }
            }
        },
        {
            $project: {
                responseTime: { $subtract: [{ $arrayElemAt: ['$comments.createdAt', 0] }, '$createdAt'] }
            }
        },
        {
            $group: {
                _id: null,
                avgResponseTime: { $avg: '$responseTime' }
            }
        }
    ]);

    const previousWeekResponseTime = await Ticket.aggregate([
        {
            $match: {
                ...match,
                createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
                comments: { $exists: true, $ne: [] }
            }
        },
        {
            $project: {
                responseTime: { $subtract: [{ $arrayElemAt: ['$comments.createdAt', 0] }, '$createdAt'] }
            }
        },
        {
            $group: {
                _id: null,
                avgResponseTime: { $avg: '$responseTime' }
            }
        }
    ]);

    const currentAvgResponse = currentWeekResponseTime[0]?.avgResponseTime || 0;
    const previousAvgResponse = previousWeekResponseTime[0]?.avgResponseTime || 0;
    trends.responseTime = calculateTrend(currentAvgResponse, previousAvgResponse);

    // Calculate resolution time trends
    const currentWeekResolutionTime = await Ticket.aggregate([
        {
            $match: {
                ...match,
                status: { $in: ['Completed', 'Closed'] },
                resolvedAt: { $gte: oneWeekAgo }
            }
        },
        {
            $group: {
                _id: null,
                avgResolutionTime: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } }
            }
        }
    ]);

    const previousWeekResolutionTime = await Ticket.aggregate([
        {
            $match: {
                ...match,
                status: { $in: ['Completed', 'Closed'] },
                resolvedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
            }
        },
        {
            $group: {
                _id: null,
                avgResolutionTime: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } }
            }
        }
    ]);

    const currentAvgResolution = currentWeekResolutionTime[0]?.avgResolutionTime || 0;
    const previousAvgResolution = previousWeekResolutionTime[0]?.avgResolutionTime || 0;
    trends.resolutionTime = calculateTrend(currentAvgResolution, previousAvgResolution);

    // 8. Team Capacity
    const teamCapacity = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;

    // 9. First Contact Resolution (FCR)
    // Tickets resolved with only 1 comment (the resolution)
    const fcrStats = await Ticket.aggregate([
        {
            $match: {
                ...match,
                status: { $in: ['Completed', 'Closed'] }
            }
        },
        {
            $project: {
                commentCount: { $size: { $ifNull: ['$comments', []] } }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                fcrCount: { $sum: { $cond: [{ $eq: ['$commentCount', 1] }, 1, 0] } }
            }
        }
    ]);

    const fcrPercentage = fcrStats.length > 0 && fcrStats[0].total > 0
        ? Math.round((fcrStats[0].fcrCount / fcrStats[0].total) * 100)
        : 0;

    // 10. Ticket Backlog (>48h unassigned)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const backlogCount = await Ticket.countDocuments({
        ...match,
        createdAt: { $lt: fortyEightHoursAgo },
        status: 'New',
        assignedTo: null
    });

    // 11. Resolution Rate Today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const resolvedToday = await Ticket.countDocuments({
        ...match,
        status: { $in: ['Completed', 'Closed'] },
        resolvedAt: { $gte: startOfToday }
    });

    const createdToday = await Ticket.countDocuments({
        ...match,
        createdAt: { $gte: startOfToday }
    });

    const resolutionRateToday = createdToday > 0
        ? Math.round((resolvedToday / createdToday) * 100)
        : 0;

    // Calculate overall SLA compliance
    const totalClosedTickets = await Ticket.countDocuments({
        ...match,
        status: { $in: ['Closed', 'Completed'] }
    });

    const slaMetTickets = await Ticket.countDocuments({
        ...match,
        status: { $in: ['Closed', 'Completed'] },
        slaBreach: false
    });

    const slaCompliance = totalClosedTickets > 0
        ? Math.round((slaMetTickets / totalClosedTickets) * 100)
        : 100;

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
            },
            trends,
            teamCapacity: {
                active: activeAgents,
                total: totalAgents,
                percentage: teamCapacity
            },
            firstContactResolution: {
                percentage: fcrPercentage,
                totalResolved: fcrStats[0]?.total || 0,
                fcrCount: fcrStats[0]?.fcrCount || 0
            },
            ticketBacklog: backlogCount,
            resolutionRateToday: {
                percentage: resolutionRateToday,
                resolvedToday,
                createdToday
            },
            slaCompliance
        }
    });
});

/**
 * @desc    Get ticket volume trends
 * @route   GET /api/stats/trends
 * @access  Private (Admin/SuperAdmin)
 */
const getTicketTrends = asyncHandler(async (req, res) => {
    const { period = '7d' } = req.query;
    const { role, department: userDep } = req.user;

    // Validate period
    const validPeriods = ['7d', '30d', '90d'];
    if (!validPeriods.includes(period)) {
        throw new Error('Invalid period. Use 7d, 30d, or 90d');
    }

    // Calculate date range
    const days = parseInt(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Base match
    const match = {
        createdAt: { $gte: startDate, $lte: endDate }
    };

    if (role === 'Admin') {
        match.departmentId = userDep;
    }

    // Aggregate created tickets by date
    const createdTrend = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Aggregate resolved tickets by date
    const resolvedTrend = await Ticket.aggregate([
        {
            $match: {
                ...match,
                status: { $in: ['Completed', 'Closed'] },
                resolvedAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$resolvedAt' },
                    month: { $month: '$resolvedAt' },
                    day: { $dayOfMonth: '$resolvedAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format data for chart
    const formatData = (data) => {
        return data.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            count: item.count
        }));
    };

    res.status(200).json({
        success: true,
        data: {
            period,
            startDate,
            endDate,
            created: formatData(createdTrend),
            resolved: formatData(resolvedTrend)
        }
    });
});

/**
 * @desc    Get agent performance metrics
 * @route   GET /api/stats/agents
 * @access  Private (Admin/SuperAdmin)
 */
const getAgentStats = asyncHandler(async (req, res) => {
    const { role, department: userDep } = req.user;

    if (!['SuperAdmin', 'Admin'].includes(role)) {
        throw new AuthorizationError('Not authorized to access agent stats');
    }

    // Base filter for agents
    const agentFilter = {
        role: { $in: ['Admin', 'TeamMember'] },
        isActive: true
    };

    if (role === 'Admin') {
        agentFilter.department = userDep;
    }

    // Get all agents
    const agents = await User.find(agentFilter).select('name email department');

    // Calculate stats for each agent
    const agentStats = await Promise.all(
        agents.map(async (agent) => {
            const agentId = agent._id;

            // Tickets assigned
            const assignedTickets = await Ticket.countDocuments({ assignedTo: agentId });

            // Tickets resolved
            const resolvedTickets = await Ticket.countDocuments({
                assignedTo: agentId,
                status: { $in: ['Completed', 'Closed'] }
            });

            // Average resolution time
            const avgResolution = await Ticket.aggregate([
                {
                    $match: {
                        assignedTo: agentId,
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

            const avgResolutionHours = avgResolution.length > 0
                ? Math.round(avgResolution[0].avgTime / (1000 * 60 * 60))
                : 0;

            // SLA compliance
            const slaStats = await Ticket.aggregate([
                {
                    $match: {
                        assignedTo: agentId,
                        status: { $in: ['Completed', 'Closed'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        breached: { $sum: { $cond: [{ $eq: ['$slaBreach', true] }, 1, 0] } }
                    }
                }
            ]);

            const slaCompliance = slaStats.length > 0 && slaStats[0].total > 0
                ? Math.round(((slaStats[0].total - slaStats[0].breached) / slaStats[0].total) * 100)
                : 100;

            // Current workload (active tickets)
            const currentWorkload = await Ticket.countDocuments({
                assignedTo: agentId,
                status: { $nin: ['Closed', 'Completed'] }
            });

            return {
                agentId: agentId.toString(),
                name: agent.name,
                email: agent.email,
                assignedTickets,
                resolvedTickets,
                avgResolutionHours,
                slaCompliance,
                currentWorkload
            };
        })
    );

    res.status(200).json({
        success: true,
        data: agentStats
    });
});

/**
 * @desc    Get critical/high priority tickets with SLA status
 * @route   GET /api/stats/critical-tickets
 * @access  Private (Admin/SuperAdmin/TeamMember)
 */
const getCriticalTickets = asyncHandler(async (req, res) => {
    const { role, department: userDep, _id: userId } = req.user;

    // Base match for critical/high priority tickets
    const match = {
        priority: { $in: ['High', 'Urgent'] },
        status: { $nin: ['Closed', 'Completed'] }
    };

    if (role === 'Admin' && userDep) {
        match.departmentId = userDep;
    } else if (role === 'TeamMember') {
        match.assignedTo = userId;
    }

    const tickets = await Ticket.find(match)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('departmentId', 'name')
        .populate('categoryId', 'name')
        .sort({ priority: -1, createdAt: -1 })
        .limit(50);

    // Add SLA status to each ticket
    const ticketsWithSLA = tickets.map(ticket => {
        const now = new Date();
        const slaDeadline = ticket.slaDeadline;
        let slaStatus = 'On Track';

        if (ticket.slaBreach) {
            slaStatus = 'Breached';
        } else if (slaDeadline && slaDeadline < new Date(now.getTime() + 2 * 60 * 1000)) { // ⚠️ TESTING: 2 minutes instead of 4 hours
            slaStatus = 'At Risk';
        }

        return {
            ...ticket.toObject(),
            slaStatus,
            timeRemaining: slaDeadline ? Math.max(0, Math.ceil((slaDeadline - now) / (1000 * 60 * 60))) : null
        };
    });

    res.status(200).json({
        success: true,
        count: ticketsWithSLA.length,
        data: ticketsWithSLA
    });
});

/**
 * @desc    Get category volume analysis
 * @route   GET /api/stats/categories
 * @access  Private (Admin/SuperAdmin)
 */
const getCategoryStats = asyncHandler(async (req, res) => {
    const { role, department: userDep } = req.user;

    if (!['SuperAdmin', 'Admin'].includes(role)) {
        throw new AuthorizationError('Not authorized to access category stats');
    }

    const match = {};
    if (role === 'Admin') {
        match.departmentId = userDep;
    }

    const categoryStats = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$categoryId',
                totalTickets: { $sum: 1 },
                openTickets: { $sum: { $cond: [{ $not: { $in: ['$status', ['Closed', 'Completed']] } }, 1, 0] } },
                resolvedTickets: { $sum: { $cond: [{ $in: ['$status', ['Closed', 'Completed']] }, 1, 0] } },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $and: [{ $in: ['$status', ['Closed', 'Completed']] }, { $ne: ['$resolvedAt', null] }] },
                            { $subtract: ['$resolvedAt', '$createdAt'] },
                            null
                        ]
                    }
                }
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
                categoryId: '$_id',
                categoryName: '$category.name',
                totalTickets: 1,
                openTickets: 1,
                resolvedTickets: 1,
                avgResolutionHours: { $round: [{ $divide: ['$avgResolutionTime', 1000 * 60 * 60] }, 1] }
            }
        },
        { $sort: { totalTickets: -1 } },
        { $limit: 10 }
    ]);

    res.status(200).json({
        success: true,
        data: categoryStats
    });
});

/**
 * @desc    Get SLA performance by priority
 * @route   GET /api/stats/sla-performance
 * @access  Private (Admin/SuperAdmin)
 */
const getSLAPerformance = asyncHandler(async (req, res) => {
    const { role, department: userDep } = req.user;

    if (!['SuperAdmin', 'Admin'].includes(role)) {
        throw new AuthorizationError('Not authorized to access SLA stats');
    }

    const match = {};
    if (role === 'Admin') {
        match.departmentId = userDep;
    }

    const slaByPriority = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$priority',
                total: { $sum: 1 },
                met: { $sum: { $cond: [{ $eq: ['$slaBreach', false] }, 1, 0] } },
                breached: { $sum: { $cond: [{ $eq: ['$slaBreach', true] }, 1, 0] } },
                atRisk: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$slaBreach', false] },
                                    { $ne: ['$slaDeadline', null] },
                                    { $lt: ['$slaDeadline', { $add: [new Date(), 2 * 60 * 1000] }] } // ⚠️ TESTING: 2 minutes instead of 4 hours
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                priority: '$_id',
                total: 1,
                met: 1,
                breached: 1,
                atRisk: 1,
                metPercentage: { $round: [{ $multiply: [{ $divide: ['$met', '$total'] }, 100] }, 1] },
                breachedPercentage: { $round: [{ $multiply: [{ $divide: ['$breached', '$total'] }, 100] }, 1] }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Overall SLA stats
    const overallStats = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                met: { $sum: { $cond: [{ $eq: ['$slaBreach', false] }, 1, 0] } },
                breached: { $sum: { $cond: [{ $eq: ['$slaBreach', true] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                met: 1,
                breached: 1,
                complianceRate: { $round: [{ $multiply: [{ $divide: ['$met', '$total'] }, 100] }, 1] }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            overall: overallStats[0] || { total: 0, met: 0, breached: 0, complianceRate: 0 },
            byPriority: slaByPriority
        }
    });
});

/**
 * @desc    Get peak hours ticket creation heatmap
 * @route   GET /api/stats/peak-hours
 * @access  Private (Admin/SuperAdmin)
 */
const getPeakHours = asyncHandler(async (req, res) => {
    const { role, department: userDep } = req.user;

    if (!['SuperAdmin', 'Admin'].includes(role)) {
        throw new AuthorizationError('Not authorized to access peak hours stats');
    }

    const match = {};
    if (role === 'Admin') {
        match.departmentId = userDep;
    }

    // Get ticket creation by hour and day of week
    const peakHoursData = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    hour: { $hour: '$createdAt' },
                    dayOfWeek: { $dayOfWeek: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ]);

    // Format data for heatmap (7 days x 24 hours)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmapData = [];

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const dataPoint = peakHoursData.find(
                d => d._id.dayOfWeek === day + 1 && d._id.hour === hour
            );
            heatmapData.push({
                day: days[day],
                dayIndex: day,
                hour,
                count: dataPoint ? dataPoint.count : 0
            });
        }
    }

    // Calculate peak hours summary
    const hourlyTotals = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $hour: '$createdAt' },
                total: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } },
        { $limit: 5 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            heatmap: heatmapData,
            peakHours: hourlyTotals.map(h => ({
                hour: h._id,
                total: h.total
            }))
        }
    });
});

/**
 * @desc    Get specific agent KPIs
 * @route   GET /api/stats/agent/:agentId
 * @access  Private (Admin/SuperAdmin/Agent themselves)
 */
const getAgentKPIs = asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const { role, department: userDep, _id: userId } = req.user;

    // Check authorization
    if (role === 'NormalUser') {
        throw new AuthorizationError('Not authorized to access agent KPIs');
    }

    if (role === 'TeamMember' && userId.toString() !== agentId) {
        throw new AuthorizationError('Not authorized to view other agent KPIs');
    }

    if (role === 'Admin' && userDep) {
        const agent = await User.findById(agentId);
        if (!agent || agent.department?.toString() !== userDep.toString()) {
            throw new AuthorizationError('Not authorized to view agents from other departments');
        }
    }

    // Get agent details
    const agent = await User.findById(agentId).select('name email department role');
    if (!agent) {
        throw new Error('Agent not found');
    }

    // Calculate KPIs
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total tickets assigned
    const totalAssigned = await Ticket.countDocuments({ assignedTo: agentId });

    // Tickets resolved
    const totalResolved = await Ticket.countDocuments({
        assignedTo: agentId,
        status: { $in: ['Completed', 'Closed'] }
    });

    // Tickets resolved in last 30 days
    const recentResolved = await Ticket.countDocuments({
        assignedTo: agentId,
        status: { $in: ['Completed', 'Closed'] },
        resolvedAt: { $gte: thirtyDaysAgo }
    });

    // Current workload
    const currentWorkload = await Ticket.countDocuments({
        assignedTo: agentId,
        status: { $nin: ['Closed', 'Completed'] }
    });

    // Average resolution time
    const avgResolution = await Ticket.aggregate([
        {
            $match: {
                assignedTo: new mongoose.Types.ObjectId(agentId),
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

    const avgResolutionHours = avgResolution.length > 0
        ? Math.round(avgResolution[0].avgTime / (1000 * 60 * 60))
        : 0;

    // SLA compliance
    const slaStats = await Ticket.aggregate([
        {
            $match: {
                assignedTo: new mongoose.Types.ObjectId(agentId),
                status: { $in: ['Completed', 'Closed'] }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                breached: { $sum: { $cond: [{ $eq: ['$slaBreach', true] }, 1, 0] } }
            }
        }
    ]);

    const slaCompliance = slaStats.length > 0 && slaStats[0].total > 0
        ? Math.round(((slaStats[0].total - slaStats[0].breached) / slaStats[0].total) * 100)
        : 100;

    // First Contact Resolution
    const fcrStats = await Ticket.aggregate([
        {
            $match: {
                assignedTo: new mongoose.Types.ObjectId(agentId),
                status: { $in: ['Completed', 'Closed'] }
            }
        },
        {
            $project: {
                commentCount: { $size: { $ifNull: ['$comments', []] } }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                fcrCount: { $sum: { $cond: [{ $eq: ['$commentCount', 1] }, 1, 0] } }
            }
        }
    ]);

    const fcrPercentage = fcrStats.length > 0 && fcrStats[0].total > 0
        ? Math.round((fcrStats[0].fcrCount / fcrStats[0].total) * 100)
        : 0;

    // Customer satisfaction (average rating)
    const ratingStats = await Ticket.aggregate([
        {
            $match: {
                assignedTo: new mongoose.Types.ObjectId(agentId),
                rating: { $ne: null }
            }
        },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalRated: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                role: agent.role
            },
            kpis: {
                totalAssigned,
                totalResolved,
                recentResolved,
                currentWorkload,
                avgResolutionHours,
                slaCompliance,
                firstContactResolution: fcrPercentage,
                customerSatisfaction: ratingStats[0]?.avgRating
                    ? Math.round(ratingStats[0].avgRating * 10) / 10
                    : null,
                totalRated: ratingStats[0]?.totalRated || 0
            }
        }
    });
});

/**
 * @desc    Get team performance leaderboard
 * @route   GET /api/stats/leaderboard
 * @access  Private (Admin/SuperAdmin/TeamMember)
 */
const getLeaderboard = asyncHandler(async (req, res) => {
    const { role, department: userDep } = req.user;

    if (!['SuperAdmin', 'Admin', 'TeamMember'].includes(role)) {
        throw new AuthorizationError('Not authorized to access leaderboard');
    }

    const agentFilter = {
        role: { $in: ['Admin', 'TeamMember'] },
        isActive: true
    };

    if (role === 'Admin') {
        agentFilter.department = userDep;
    }

    const agents = await User.find(agentFilter).select('name email department');

    // Calculate scores for each agent
    const leaderboard = await Promise.all(
        agents.map(async (agent) => {
            const agentId = agent._id;

            // Tickets resolved this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyResolved = await Ticket.countDocuments({
                assignedTo: agentId,
                status: { $in: ['Completed', 'Closed'] },
                resolvedAt: { $gte: startOfMonth }
            });

            // SLA compliance
            const slaStats = await Ticket.aggregate([
                {
                    $match: {
                        assignedTo: agentId,
                        status: { $in: ['Completed', 'Closed'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        breached: { $sum: { $cond: [{ $eq: ['$slaBreach', true] }, 1, 0] } }
                    }
                }
            ]);

            const slaCompliance = slaStats.length > 0 && slaStats[0].total > 0
                ? Math.round(((slaStats[0].total - slaStats[0].breached) / slaStats[0].total) * 100)
                : 100;

            // Average rating
            const ratingStats = await Ticket.aggregate([
                {
                    $match: {
                        assignedTo: agentId,
                        rating: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' }
                    }
                }
            ]);

            const avgRating = ratingStats[0]?.avgRating || 0;

            // Calculate performance score (weighted)
            // 40% resolution count, 40% SLA compliance, 20% customer satisfaction
            const score = Math.round(
                (monthlyResolved * 0.4) +
                (slaCompliance * 0.4) +
                (avgRating * 20 * 0.2)
            );

            return {
                agentId: agentId.toString(),
                name: agent.name,
                monthlyResolved,
                slaCompliance,
                avgRating: Math.round(avgRating * 10) / 10,
                score
            };
        })
    );

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));

    res.status(200).json({
        success: true,
        data: rankedLeaderboard
    });
});

/**
 * @desc    Get user-specific ticket stats
 * @route   GET /api/stats/user/:userId
 * @access  Private
 */
const getUserStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role, _id: currentUserId } = req.user;

    // Users can only view their own stats unless they're admin
    if (role === 'NormalUser' && currentUserId.toString() !== userId) {
        throw new AuthorizationError('Not authorized to view other user stats');
    }

    // Get user's tickets
    const totalTickets = await Ticket.countDocuments({ createdBy: userId });
    const openTickets = await Ticket.countDocuments({
        createdBy: userId,
        status: { $nin: ['Closed', 'Completed'] }
    });
    const resolvedTickets = await Ticket.countDocuments({
        createdBy: userId,
        status: { $in: ['Closed', 'Completed'] }
    });

    // Average resolution time for user's tickets
    const avgResolution = await Ticket.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId),
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

    const avgResolutionHours = avgResolution.length > 0
        ? Math.round(avgResolution[0].avgTime / (1000 * 60 * 60))
        : 0;

    // Tickets by status
    const ticketsByStatus = await Ticket.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusStats = ticketsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // Tickets by priority
    const ticketsByPriority = await Ticket.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const priorityStats = ticketsByPriority.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // Recent tickets
    const recentTickets = await Ticket.find({ createdBy: userId })
        .select('ticketId subject status priority createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        data: {
            overview: {
                totalTickets,
                openTickets,
                resolvedTickets,
                avgResolutionHours
            },
            statusStats,
            priorityStats,
            recentTickets
        }
    });
});

/**
 * @desc    Get system health metrics
 * @route   GET /api/system/health
 * @access  Private (SuperAdmin only)
 */
const getSystemHealth = asyncHandler(async (req, res) => {
    const { role } = req.user;

    if (role !== 'SuperAdmin') {
        throw new AuthorizationError('Not authorized to access system health');
    }

    // Database stats
    const dbStats = {
        tickets: await Ticket.countDocuments(),
        users: await User.countDocuments(),
        activeUsers: await User.countDocuments({ isActive: true }),
        departments: await Department.countDocuments(),
        categories: await Category.countDocuments()
    };

    // Ticket stats
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const ticketStats = {
        createdToday: await Ticket.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        resolvedToday: await Ticket.countDocuments({
            status: { $in: ['Completed', 'Closed'] },
            resolvedAt: { $gte: twentyFourHoursAgo }
        }),
        openTickets: await Ticket.countDocuments({ status: { $nin: ['Closed', 'Completed'] } }),
        overdueTickets: await Ticket.countDocuments({
            status: { $nin: ['Closed', 'Completed'] },
            slaBreach: true
        })
    };

    // User activity
    const userActivity = {
        totalAgents: await User.countDocuments({ role: { $in: ['Admin', 'TeamMember'] } }),
        activeAgents: await User.countDocuments({
            role: { $in: ['Admin', 'TeamMember'] },
            isActive: true
        }),
        onlineAgents: await User.countDocuments({
            role: { $in: ['Admin', 'TeamMember'] },
            lastLogin: { $gte: twentyFourHoursAgo }
        })
    };

    // System status
    const systemStatus = {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
    };

    res.status(200).json({
        success: true,
        data: {
            database: dbStats,
            tickets: ticketStats,
            users: userActivity,
            system: systemStatus
        }
    });
});

/**
 * @desc    Get recent audit log entries
 * @route   GET /api/stats/system/audit-log
 * @access  Private (SuperAdmin only)
 */
const getAuditLog = asyncHandler(async (req, res) => {
    const { role } = req.user;

    if (role !== 'SuperAdmin') {
        throw new AuthorizationError('Not authorized to access audit log');
    }

    const { limit = 50, skip = 0, action, resource } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const auditLogs = await AuditLog.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
        success: true,
        data: {
            logs: auditLogs,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > parseInt(skip) + parseInt(limit)
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
    } else if (req.user.role === 'SuperAdmin' && departmentId) {
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

// Import mongoose for ObjectId
const mongoose = require('mongoose');

module.exports = {
    getDashboardStats,
    getDetailedReports,
    getTicketTrends,
    getAgentStats,
    getCriticalTickets,
    getCategoryStats,
    getSLAPerformance,
    getPeakHours,
    getAgentKPIs,
    getLeaderboard,
    getUserStats,
    getSystemHealth,
    getAuditLog
};
