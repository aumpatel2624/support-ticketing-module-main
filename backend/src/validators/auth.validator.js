const { z } = require('zod');

/**
 * Zod Validation Schemas for Authentication
 */

// Login schema
const loginSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .min(1, 'Email is required'),
    password: z.string()
        .min(1, 'Password is required')
});

// Register schema
const registerSchema = z.object({
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
    role: z.enum(['SuperAdmin', 'Admin', 'TeamMember', 'NormalUser'])
        .optional()
        .default('NormalUser'),
    department: z.string()
        .optional()
        .nullable(),
    permissions: z.object({
        canAddMembers: z.boolean().optional().default(false),
        canAssignTickets: z.boolean().optional().default(false),
        canManageCategories: z.boolean().optional().default(false),
        accessLevel: z.enum(['read', 'edit', 'full']).optional().default('read')
    }).optional()
});

// Forgot password schema
const forgotPasswordSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .min(1, 'Email is required')
});

// Reset password schema
const resetPasswordSchema = z.object({
    token: z.string()
        .min(1, 'Reset token is required'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters')
});

// Change password schema
const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),
    newPassword: z.string()
        .min(6, 'New password must be at least 6 characters')
        .max(100, 'New password must not exceed 100 characters')
});

// Refresh token schema
const refreshTokenSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token is required')
});

module.exports = {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema
};
