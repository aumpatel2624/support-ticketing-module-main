const { z } = require('zod');

/**
 * Zod Validation Schemas for User Management
 */

// Create user schema (SuperAdmin)
const createUserSchema = z.object({
    employeeId: z.string()
        .min(1, 'Employee ID is required')
        .trim(),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim(),
    email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters'),
    role: z.enum(['SuperAdmin', 'Admin', 'TeamMember', 'NormalUser']),
    department: z.string()
        .optional()
        .nullable(),
    shift: z.enum(['US', 'UK']),
    permissions: z.object({
        canAddMembers: z.boolean().optional().default(false),
        canAssignTickets: z.boolean().optional().default(false),
        canManageCategories: z.boolean().optional().default(false),
        accessLevel: z.enum(['read', 'edit', 'full']).optional().default('read')
    }).optional()
});

// Update user schema (SuperAdmin)
const updateUserSchema = z.object({
    employeeId: z.string().trim().optional(),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim()
        .optional(),
    email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .optional(),
    role: z.enum(['SuperAdmin', 'Admin', 'TeamMember', 'NormalUser']).optional(),
    department: z.string().optional().nullable(),
    shift: z.enum(['US', 'UK']).optional(),
    permissions: z.object({
        canAddMembers: z.boolean().optional(),
        canAssignTickets: z.boolean().optional(),
        canManageCategories: z.boolean().optional(),
        accessLevel: z.enum(['read', 'edit', 'full']).optional()
    }).optional(),
    isActive: z.boolean().optional()
});

// Update own profile schema (limited fields)
const updateProfileSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim()
        .optional(),
    email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .optional()
});

// User list query schema
const userListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    role: z.enum(['SuperAdmin', 'Admin', 'TeamMember', 'NormalUser']).optional(),
    department: z.string().optional(),
    isActive: z.string().optional().transform(val => val === undefined ? undefined : val === 'true'),
    search: z.string().optional()
});

// MongoDB ObjectId validation
const objectIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
});

// Nested resource validation (ticket and nested resource ID)
const nestedObjectIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
    attachmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attachment ID format')
});

const toggleStatusSchema = z.object({
    isActive: z.boolean({
        required_error: "isActive status is required",
        invalid_type_error: "isActive must be a boolean"
    })
});

module.exports = {
    createUserSchema,
    updateUserSchema,
    updateProfileSchema,
    userListQuerySchema,
    objectIdSchema,
    nestedObjectIdSchema,
    toggleStatusSchema
};
