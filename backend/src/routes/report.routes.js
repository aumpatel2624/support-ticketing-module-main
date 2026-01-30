const express = require('express');
const router = express.Router();
const {
    exportTickets,
    exportAnalytics,
    generateCustomReport
} = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report generation and export endpoints
 */

/**
 * @swagger
 * /reports/tickets/export:
 *   get:
 *     summary: Export tickets report
 *     description: Export tickets data to PDF, Excel, or CSV format
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, excel, csv]
 *         default: excel
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Report file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/tickets/export', authenticate, requireAdmin, exportTickets);

/**
 * @swagger
 * /reports/analytics/export:
 *   get:
 *     summary: Export analytics report
 *     description: Export analytics data to Excel or CSV format
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *         default: excel
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics report file
 */
router.get('/analytics/export', authenticate, requireAdmin, exportAnalytics);

/**
 * @swagger
 * /reports/custom:
 *   post:
 *     summary: Generate custom report
 *     description: Generate a custom report with specified metrics and filters
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *               filters:
 *                 type: object
 *               format:
 *                 type: string
 *                 enum: [pdf, excel, csv]
 *               groupBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Custom report file
 */
router.post('/custom', authenticate, requireAdmin, generateCustomReport);

module.exports = router;
