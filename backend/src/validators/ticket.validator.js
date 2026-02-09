const { z } = require('zod');

/**
 * Zod Validation Schemas for Ticket Management
 */

// Create ticket schema
const createTicketSchema = z.object({
    subject: z.string()
        .min(5, 'Subject must be at least 5 characters')
        .max(200, 'Subject must not exceed 200 characters')
        .trim(),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .trim(),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
    categoryId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
        .optional()
        .default('Medium')
});

// Update ticket schema
const updateTicketSchema = z.object({
    subject: z.string()
        .min(5, 'Subject must be at least 5 characters')
        .max(200, 'Subject must not exceed 200 characters')
        .trim()
        .optional(),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .trim()
        .optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
        .optional(),
    status: z.enum(['New', 'Assigned', 'InProgress', 'Resolved', 'Reopened', 'Escalated', 'Closed'])
        .optional(),
    assignedTo: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        .optional()
        .nullable()
});

// Update status schema
const updateStatusSchema = z.object({
    status: z.enum(['New', 'Assigned', 'InProgress', 'Resolved', 'Reopened', 'Escalated', 'Closed']),
    comment: z.string()
        .max(500, 'Comment must not exceed 500 characters')
        .trim()
        .optional()
});

// Assign ticket schema
const assignTicketSchema = z.object({
    assignedTo: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    comment: z.string()
        .max(500, 'Comment must not exceed 500 characters')
        .trim()
        .optional()
});

// Add comment schema
const addCommentSchema = z.object({
    text: z.string()
        .min(1, 'Comment text is required')
        .max(2000, 'Comment must not exceed 2000 characters')
        .trim(),
    isInternal: z.boolean()
        .optional()
        .default(false)
});

// Rate ticket schema
const rateTicketSchema = z.object({
    rating: z.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must not exceed 5'),
    feedback: z.string()
        .max(500, 'Feedback must not exceed 500 characters')
        .trim()
        .optional()
});

// Submit feedback schema
const submitFeedbackSchema = z.object({
    rating: z.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must not exceed 5'),
    feedback: z.string()
        .max(500, 'Feedback must not exceed 500 characters')
        .trim(),
    action: z.enum(['close', 'reopen'], {
        errorMap: () => ({ message: 'Action must be either "close" or "reopen"' })
    })
});

// Ticket list query schema
const ticketListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    status: z.string().optional(),
    priority: z.string().optional(),
    departmentId: z.string().optional(),
    categoryId: z.string().optional(),
    assignedTo: z.string().optional(),
    createdBy: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional()
});

// Escalate ticket schema
const escalateTicketSchema = z.object({
    reason: z.string()
        .min(5, 'Escalation reason must be at least 5 characters')
        .max(500, 'Reason must not exceed 500 characters')
        .trim(),
    escalateTo: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        .optional()
});

module.exports = {
    createTicketSchema,
    updateTicketSchema,
    updateStatusSchema,
    assignTicketSchema,
    addCommentSchema,
    rateTicketSchema,
    submitFeedbackSchema,
    ticketListQuerySchema,
    escalateTicketSchema
};
