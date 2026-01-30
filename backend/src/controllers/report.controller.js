const Ticket = require('../models/Ticket');
const exportService = require('../services/export.service');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams } = require('../utils/pagination');

/**
 * @desc    Export tickets report
 * @route   GET /api/reports/tickets/export
 * @access  Private (Admin/SuperAdmin)
 */
const exportTickets = asyncHandler(async (req, res) => {
    const { format = 'excel', status, priority, departmentId, dateFrom, dateTo } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (departmentId) filter.departmentId = departmentId;

    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Fetch tickets
    const tickets = await Ticket.find(filter)
        .populate('createdBy', 'name email employeeId')
        .populate('assignedTo', 'name email employeeId')
        .populate('departmentId', 'name')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 });

    // Generate summary
    const summary = {
        'Total Tickets': tickets.length,
        'New': tickets.filter(t => t.status === 'New').length,
        'In Progress': tickets.filter(t => t.status === 'In Progress').length,
        'Completed': tickets.filter(t => t.status === 'Completed').length,
        'Closed': tickets.filter(t => t.status === 'Closed').length,
    };

    // Export based on format
    let exportData;
    let contentType;
    let fileExtension;

    switch (format.toLowerCase()) {
        case 'pdf':
            exportData = await exportService.exportTickets(tickets, 'pdf', {
                title: 'Tickets Report',
                summary
            });
            contentType = 'application/pdf';
            fileExtension = 'pdf';
            break;
        case 'csv':
            exportData = exportService.exportTickets(tickets, 'csv', { title: 'Tickets Report' });
            contentType = 'text/csv';
            fileExtension = 'csv';
            break;
        case 'excel':
        default:
            exportData = await exportService.exportTickets(tickets, 'excel', {
                title: 'Tickets Report',
                summary
            });
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileExtension = 'xlsx';
            break;
    }

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="tickets-report-${timestamp}.${fileExtension}"`);

    res.send(exportData);
});

/**
 * @desc    Export analytics report
 * @route   GET /api/reports/analytics/export
 * @access  Private (Admin/SuperAdmin)
 */
const exportAnalytics = asyncHandler(async (req, res) => {
    const { format = 'excel', dateFrom, dateTo } = req.query;

    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
        dateFilter.createdAt = {};
        if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Aggregate data
    const [
        totalTickets,
        statusDistribution,
        priorityDistribution,
        monthlyTrend,
        avgResolutionTime
    ] = await Promise.all([
        Ticket.countDocuments(dateFilter),
        Ticket.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Ticket.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Ticket.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Ticket.aggregate([
            { $match: { ...dateFilter, resolvedAt: { $exists: true } } },
            {
                $project: {
                    resolutionTime: {
                        $divide: [
                            { $subtract: ['$resolvedAt', '$createdAt'] },
                            1000 * 60 * 60 // Convert to hours
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgHours: { $avg: '$resolutionTime' }
                }
            }
        ])
    ]);

    const analyticsData = {
        summary: {
            'Total Tickets': totalTickets,
            'Average Resolution Time': avgResolutionTime[0]?.avgHours
                ? `${Math.round(avgResolutionTime[0].avgHours)} hours`
                : 'N/A'
        },
        statusDistribution,
        priorityDistribution,
        monthlyTrend
    };

    // Export
    let exportData;
    let contentType;
    let fileExtension;

    switch (format.toLowerCase()) {
        case 'csv':
            // For CSV, export just the summary as a simple format
            let csv = 'Metric,Value\n';
            Object.entries(analyticsData.summary).forEach(([key, value]) => {
                csv += `"${key}","${value}"\n`;
            });
            exportData = csv;
            contentType = 'text/csv';
            fileExtension = 'csv';
            break;
        case 'excel':
        default:
            exportData = await exportService.exportAnalytics(analyticsData, 'excel');
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileExtension = 'xlsx';
            break;
    }

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${timestamp}.${fileExtension}"`);

    res.send(exportData);
});

/**
 * @desc    Generate custom report
 * @route   POST /api/reports/custom
 * @access  Private (Admin/SuperAdmin)
 */
const generateCustomReport = asyncHandler(async (req, res) => {
    const {
        metrics = [],
        filters = {},
        format = 'excel',
        groupBy = null
    } = req.body;

    // Build query based on filters
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.departmentId) query.departmentId = filters.departmentId;
    if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    // Fetch data
    let tickets = await Ticket.find(query)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('departmentId', 'name')
        .populate('categoryId', 'name');

    // Apply grouping if specified
    let reportData = tickets;
    if (groupBy) {
        const grouped = {};
        tickets.forEach(ticket => {
            const key = ticket[groupBy]?.name || ticket[groupBy] || 'Unspecified';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(ticket);
        });
        reportData = Object.entries(grouped).map(([key, items]) => ({
            group: key,
            count: items.length,
            items
        }));
    }

    // Export based on format
    let exportData;
    let contentType;
    let fileExtension;

    const exportOptions = {
        title: 'Custom Report',
        headers: metrics.length > 0 ? metrics : ['Ticket ID', 'Subject', 'Status', 'Priority'],
        columns: metrics.length > 0
            ? metrics.map(m => ({ key: m.toLowerCase().replace(/\s+/g, ''), width: 20 }))
            : [
                { key: 'ticketId', width: 15 },
                { key: 'subject', width: 40 },
                { key: 'status', width: 15 },
                { key: 'priority', width: 12 }
            ]
    };

    switch (format.toLowerCase()) {
        case 'pdf':
            exportData = await exportService.exportToPDF(reportData, exportOptions);
            contentType = 'application/pdf';
            fileExtension = 'pdf';
            break;
        case 'csv':
            exportData = exportService.exportToCSV(reportData, exportOptions);
            contentType = 'text/csv';
            fileExtension = 'csv';
            break;
        case 'excel':
        default:
            exportData = await exportService.exportToExcel(reportData, exportOptions);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileExtension = 'xlsx';
            break;
    }

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="custom-report-${timestamp}.${fileExtension}"`);

    res.send(exportData);
});

module.exports = {
    exportTickets,
    exportAnalytics,
    generateCustomReport
};
