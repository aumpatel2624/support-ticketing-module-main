const express = require('express');
const router = express.Router();
const {
    getAuditLogs,
    getSystemStats
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbac');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: SuperAdmin management tools
 */

router.use(authenticate, requireSuperAdmin);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve system-wide action logs (SuperAdmin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @swagger
 * /admin/system-stats:
 *   get:
 *     summary: Get system stats
 *     description: Retrieve total counts of users, tickets, and departments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved
 */
router.get('/system-stats', getSystemStats);

module.exports = router;
