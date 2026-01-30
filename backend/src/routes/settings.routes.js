const express = require('express');
const {
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  getPublicSettings,

  // User Preferences
  getUserPreferences,
  updateUserPreferences,
  updateNotificationPreferences,

  // Saved Filters
  getSavedFilters,
  saveFilter,
  deleteFilter,

  // 2FA
  enable2FA,
  disable2FA
} = require('../controllers/settings.controller');

const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Settings]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: System settings retrieved
 *   put:
 *     summary: Update system settings
 *     tags: [Settings]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.get('/admin/settings', authenticate, requireSuperAdmin, getSystemSettings);
router.put('/admin/settings', authenticate, requireSuperAdmin, updateSystemSettings);

/**
 * @swagger
 * /api/settings/public:
 *   get:
 *     summary: Get public settings (no auth required)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public settings retrieved
 */
router.get('/settings/public', getPublicSettings);

/**
 * @swagger
 * /api/users/{id}/preferences:
 *   get:
 *     summary: Get user preferences
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User preferences retrieved
 *   put:
 *     summary: Update user preferences
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.get('/users/:id/preferences', authenticate, getUserPreferences);
router.put('/users/:id/preferences', authenticate, updateUserPreferences);

/**
 * @swagger
 * /api/users/{id}/preferences/notifications:
 *   put:
 *     summary: Update notification preferences
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 */
router.put('/users/:id/preferences/notifications', authenticate, updateNotificationPreferences);

/**
 * @swagger
 * /api/users/{id}/preferences/filters:
 *   get:
 *     summary: Get saved filter presets
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 *   post:
 *     summary: Save a filter preset
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - filters
 *             properties:
 *               name:
 *                 type: string
 *               filters:
 *                 type: object
 */
router.get('/users/:id/preferences/filters', authenticate, getSavedFilters);
router.post('/users/:id/preferences/filters', authenticate, saveFilter);

/**
 * @swagger
 * /api/users/{id}/preferences/filters/{filterId}:
 *   delete:
 *     summary: Delete saved filter
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 */
router.delete('/users/:id/preferences/filters/:filterId', authenticate, deleteFilter);

/**
 * @swagger
 * /api/users/{id}/preferences/2fa/enable:
 *   post:
 *     summary: Enable two-factor authentication
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 */
router.post('/users/:id/preferences/2fa/enable', authenticate, enable2FA);

/**
 * @swagger
 * /api/users/{id}/preferences/2fa/disable:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [User Preferences]
 *     security:
 *       - Bearer: []
 */
router.post('/users/:id/preferences/2fa/disable', authenticate, disable2FA);

module.exports = router;
