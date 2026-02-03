const express = require('express');
const router = express.Router();
const {
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
    getAuditLog,
    getDepartmentBreakdown,
    getMyPerformance
} = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requireTeamMember } = require('../middleware/rbac');

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Statistics and reporting endpoints
 */

/**
 * @swagger
 * /stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve metrics for dashboard visualizations including trends, team capacity, FCR, backlog, and resolution rates
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved
 */
router.get('/dashboard', authenticate, getDashboardStats);

/**
 * @swagger
 * /stats/trends:
 *   get:
 *     summary: Get ticket volume trends
 *     description: Retrieve ticket creation vs resolution trends over time (7d, 30d, 90d)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Time period for trends
 *     responses:
 *       200:
 *         description: Trends data retrieved
 */
router.get('/trends', authenticate, requireAdmin, getTicketTrends);

/**
 * @swagger
 * /stats/agents:
 *   get:
 *     summary: Get agent performance metrics
 *     description: Retrieve performance metrics for all agents (Admin/SuperAdmin only)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent stats retrieved
 */
router.get('/agents', authenticate, requireAdmin, getAgentStats);

/**
 * @swagger
 * /stats/critical-tickets:
 *   get:
 *     summary: Get critical/high priority tickets
 *     description: Retrieve critical and high priority tickets with SLA status
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Critical tickets retrieved
 */
router.get('/critical-tickets', authenticate, requireTeamMember, getCriticalTickets);

/**
 * @swagger
 * /stats/categories:
 *   get:
 *     summary: Get category volume analysis
 *     description: Retrieve ticket volume analysis by category (top 10)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category stats retrieved
 */
router.get('/categories', authenticate, requireAdmin, getCategoryStats);

/**
 * @swagger
 * /stats/sla-performance:
 *   get:
 *     summary: Get SLA performance metrics
 *     description: Retrieve SLA met/at-risk/breached statistics by priority
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA performance data retrieved
 */
router.get('/sla-performance', authenticate, requireAdmin, getSLAPerformance);

/**
 * @swagger
 * /stats/peak-hours:
 *   get:
 *     summary: Get peak hours heatmap data
 *     description: Retrieve ticket creation heatmap data by day and hour
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Peak hours data retrieved
 */
router.get('/peak-hours', authenticate, requireAdmin, getPeakHours);

/**
 * @swagger
 * /stats/agent/{agentId}:
 *   get:
 *     summary: Get specific agent KPIs
 *     description: Retrieve detailed KPIs for a specific agent
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent KPIs retrieved
 */
router.get('/agent/:agentId', authenticate, requireTeamMember, getAgentKPIs);

/**
 * @swagger
 * /stats/leaderboard:
 *   get:
 *     summary: Get team performance leaderboard
 *     description: Retrieve team performance ranking with scores
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
 */
router.get('/leaderboard', authenticate, requireTeamMember, getLeaderboard);

/**
 * @swagger
 * /stats/user/{userId}:
 *   get:
 *     summary: Get user-specific ticket stats
 *     description: Retrieve ticket statistics for a specific user
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User stats retrieved
 */
router.get('/user/:userId', authenticate, getUserStats);

/**
 * @swagger
 * /stats/reports:
 *   get:
 *     summary: Get detailed reports
 *     description: Retrieve advanced reporting data (Admin only)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reporting data retrieved
 */
router.get('/reports', authenticate, requireAdmin, getDetailedReports);

/**
 * @swagger
 * /system/health:
 *   get:
 *     summary: Get system health metrics
 *     description: Retrieve system health and performance metrics (SuperAdmin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health data retrieved
 */
router.get('/system/health', authenticate, requireSuperAdmin, getSystemHealth);

/**
 * @swagger
 * /system/audit-log:
 *   get:
 *     summary: Get audit log
 *     description: Retrieve recent admin actions and system events (SuperAdmin only)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log retrieved
 */
router.get('/system/audit-log', authenticate, requireSuperAdmin, getAuditLog);

/**
 * @swagger
 * /stats/department-breakdown:
 *   get:
 *     summary: Get department-wise statistics breakdown
 *     description: Retrieve ticket statistics broken down by department (SuperAdmin only)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department breakdown retrieved
 */
router.get('/department-breakdown', authenticate, requireSuperAdmin, getDepartmentBreakdown);

/**
 * @swagger
 * /stats/my-performance:
 *   get:
 *     summary: Get personal performance statistics
 *     description: Retrieve personal ticket performance metrics for the authenticated user
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal performance stats retrieved
 */
router.get('/my-performance', authenticate, requireTeamMember, getMyPerformance);

module.exports = router;

