const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategoryById,
    getCategoriesByDepartment,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, requireAdmin } = require('../middleware/rbac');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const {
    createCategorySchema,
    updateCategorySchema,
    categoryListQuerySchema
} = require('../validators/category.validator');
const { objectIdSchema } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Get list of all categories with optional department filter
 *     tags: [Categories]
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
 *         name: departmentId
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
 *         description: Categories list retrieved
 */
router.get('/', authenticate, validateQuery(categoryListQuerySchema), getCategories);

/**
 * @swagger
 * /categories/department/{deptId}:
 *   get:
 *     summary: Get categories by department
 *     description: Get all active categories for a specific department
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categories retrieved
 *       404:
 *         description: Department not found
 */
router.get('/department/:deptId', authenticate, getCategoriesByDepartment);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create category
 *     description: Create a new category (SuperAdmin or Admin with permission)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       404:
 *         description: Department not found
 *       409:
 *         description: Category name already exists in department
 */
router.post('/', authenticate, requireAdmin, validateBody(createCategorySchema), createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Get single category details
 *     tags: [Categories]
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
 *         description: Category retrieved
 *       404:
 *         description: Category not found
 */
router.get('/:id', authenticate, validateParams(objectIdSchema), getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update category details (SuperAdmin or Admin with permission)
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.put('/:id', authenticate, requireAdmin, validateParams(objectIdSchema), validateBody(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Deactivate category (SuperAdmin or Admin with permission)
 *     tags: [Categories]
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
 *         description: Category deactivated successfully
 *       400:
 *         description: Cannot delete category with active tickets
 */
router.delete('/:id', authenticate, requireAdmin, validateParams(objectIdSchema), deleteCategory);

module.exports = router;
