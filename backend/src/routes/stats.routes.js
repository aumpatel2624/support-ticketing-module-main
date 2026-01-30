const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getDetailedReports
} = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

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
 *     description: Retrieve metrics for dashboard visualizations
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

module.exports = router;
