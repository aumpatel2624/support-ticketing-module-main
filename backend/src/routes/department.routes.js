const express = require('express');
const router = express.Router();
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
} = require('../controllers/department.controller');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, requireAdmin } = require('../middleware/rbac');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const {
    createDepartmentSchema,
    updateDepartmentSchema,
    departmentListQuerySchema
} = require('../validators/department.validator');
const { objectIdSchema } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management endpoints
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     description: Get list of all departments with pagination
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *         description: Departments list retrieved
 */
router.get('/', authenticate, validateQuery(departmentListQuerySchema), getDepartments);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create department
 *     description: Create a new department (SuperAdmin only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       201:
 *         description: Department created successfully
 *       409:
 *         description: Department name already exists
 */
router.post('/', authenticate, requireSuperAdmin, validateBody(createDepartmentSchema), createDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     description: Get single department details
 *     tags: [Departments]
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
 *         description: Department retrieved
 *       404:
 *         description: Department not found
 */
router.get('/:id', authenticate, validateParams(objectIdSchema), getDepartmentById);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update department
 *     description: Update department details (SuperAdmin only)
 *     tags: [Departments]
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
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 */
router.put('/:id', authenticate, requireSuperAdmin, validateParams(objectIdSchema), validateBody(updateDepartmentSchema), updateDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete department
 *     description: Deactivate department (SuperAdmin only)
 *     tags: [Departments]
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
 *         description: Department deactivated successfully
 *       400:
 *         description: Cannot delete department with active tickets
 */
router.delete('/:id', authenticate, requireSuperAdmin, validateParams(objectIdSchema), deleteDepartment);

/**
 * @swagger
 * /departments/{id}/stats:
 *   get:
 *     summary: Get department statistics
 *     description: Get ticket statistics for a department
 *     tags: [Departments]
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
 *         description: Statistics retrieved
 */
router.get('/:id/stats', authenticate, validateParams(objectIdSchema), getDepartmentStats);

module.exports = router;
