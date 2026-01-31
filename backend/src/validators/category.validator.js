const { z } = require('zod');

/**
 * Zod Validation Schemas for Category Management
 */

// Create category schema
const createCategorySchema = z.object({
    name: z.string()
        .min(2, 'Category name must be at least 2 characters')
        .max(100, 'Category name must not exceed 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .trim()
        .optional(),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
        .optional(),
    defaultPriority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
        .optional()
        .default('Medium'),
    defaultSLA: z.number()
        .min(1, 'SLA must be at least 1 hour')
        .max(720, 'SLA cannot exceed 720 hours')
        .optional()
        .default(48)
});

// Update category schema
const updateCategorySchema = z.object({
    name: z.string()
        .min(2, 'Category name must be at least 2 characters')
        .max(100, 'Category name must not exceed 100 characters')
        .trim()
        .optional(),
    description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .trim()
        .optional(),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
        .optional(),
    defaultPriority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
        .optional(),
    defaultSLA: z.number()
        .min(1, 'SLA must be at least 1 hour')
        .max(720, 'SLA cannot exceed 720 hours')
        .optional()
});

// Category list query schema
const categoryListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
        .optional(),
    search: z.string().optional()
});

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    categoryListQuerySchema
};
