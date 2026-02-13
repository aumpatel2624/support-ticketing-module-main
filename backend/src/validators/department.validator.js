const { z } = require('zod');

/**
 * Zod Validation Schemas for Department Management
 */

// Create department schema
const createDepartmentSchema = z.object({
    code: z.string()
        .min(2, 'Department code must be at least 2 characters')
        .max(3, 'Department code must not exceed 3 characters')
        .trim()
        .toUpperCase(),
    name: z.string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name must not exceed 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .trim()
        .optional(),
    icon: z.string()
        .trim()
        .optional(),
    color: z.string()
        .regex(/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code')
        .optional(),
    headUserId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        .optional()
        .nullable()
});

// Update department schema
const updateDepartmentSchema = z.object({
    code: z.string()
        .min(2, 'Department code must be at least 2 characters')
        .max(10, 'Department code must not exceed 10 characters')
        .trim()
        .toUpperCase()
        .optional(),
    name: z.string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name must not exceed 100 characters')
        .trim()
        .optional(),
    description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .trim()
        .optional(),
    icon: z.string()
        .trim()
        .optional(),
    color: z.string()
        .regex(/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code')
        .optional(),
    headUserId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        .optional()
        .nullable(),
    isActive: z.boolean()
        .optional()
});

// Department list query schema
const departmentListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    isActive: z.string().optional().transform(val => val === undefined ? undefined : val === 'true'),
    search: z.string().optional()
});

const toggleStatusSchema = z.object({
    isActive: z.boolean({
        required_error: "isActive status is required",
        invalid_type_error: "isActive must be a boolean"
    })
});

module.exports = {
    createDepartmentSchema,
    updateDepartmentSchema,
    departmentListQuerySchema,
    toggleStatusSchema
};
