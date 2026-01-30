const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getMe,
    updateMe,
    bulkImportUsers
} = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, requireAdmin } = require('../middleware/rbac');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const {
    createUserSchema,
    updateUserSchema,
    updateProfileSchema,
    userListQuerySchema,
    objectIdSchema
} = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

// Current user routes (must be before /:id routes)
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update own profile
 *     description: Update current user's profile (limited fields)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/me', authenticate, validateBody(updateProfileSchema), updateMe);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Get list of all users with pagination and filters (SuperAdmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SuperAdmin, Admin, TeamMember, NormalUser]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users list retrieved
 *       403:
 *         description: Access denied
 */
router.get('/', authenticate, requireAdmin, validateQuery(userListQuerySchema), getUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new user
 *     description: Create a new user (SuperAdmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               employeeId:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [SuperAdmin, Admin, TeamMember, NormalUser]
 *               department:
 *                 type: string
 *               permissions:
 *                 type: object
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or Employee ID already exists
 */
router.post('/', authenticate, requireSuperAdmin, validateBody(createUserSchema), createUser);

/**
 * @swagger
 * /users/bulk-import:
 *   post:
 *     summary: Bulk import users
 *     description: Import multiple users from CSV (SuperAdmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Users imported successfully
 *       400:
 *         description: Invalid file or data
 */
router.post('/bulk-import', authenticate, requireAdmin, bulkImportUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Get single user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, validateParams(objectIdSchema), getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user details (SuperAdmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *               permissions:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', authenticate, requireAdmin, validateParams(objectIdSchema), validateBody(updateUserSchema), updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Deactivate user (soft delete) (SuperAdmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate, requireSuperAdmin, validateParams(objectIdSchema), deleteUser);

module.exports = router;
