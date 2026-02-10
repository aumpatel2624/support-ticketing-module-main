const express = require('express');
const router = express.Router();
const {
    getNotifications,
    deleteNotification,
    deleteAllNotifications
} = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const { validateParams } = require('../middleware/validate');
const { objectIdSchema } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve list of notifications for the logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved
 * */
router.get('/', authenticate, getNotifications);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', authenticate, validateParams(objectIdSchema), deleteNotification);

/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Delete all notifications
 *     description: Delete all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 */
router.delete('/', authenticate, deleteAllNotifications);

module.exports = router;
