const express = require('express');
const router = express.Router();
const {
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    updateStatus,
    assignTicket,
    addComment,
    rateTicket,
    submitFeedback,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    getTicketHistory,
    getMyTickets,
    getAssignedTickets
} = require('../controllers/ticket.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requireTeamMember } = require('../middleware/rbac');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const {
    createTicketSchema,
    updateTicketSchema,
    updateStatusSchema,
    assignTicketSchema,
    addCommentSchema,
    rateTicketSchema,
    submitFeedbackSchema,
    ticketListQuerySchema
} = require('../validators/ticket.validator');
const { objectIdSchema, nestedObjectIdSchema } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get all tickets
 *     description: Retrieve list of tickets with role-based filtering and pagination
 *     tags: [Tickets]
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tickets retrieved successfully
 */
router.get('/', authenticate, validateQuery(ticketListQuerySchema), getTickets);

/**
 * @swagger
 * /tickets/my-tickets:
 *   get:
 *     summary: Get my tickets
 *     description: Retrieve tickets created by the current user
 *     tags: [Tickets]
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
 *     responses:
 *       200:
 *         description: User's tickets retrieved successfully
 */
router.get('/my-tickets', authenticate, validateQuery(ticketListQuerySchema), getMyTickets);

/**
 * @swagger
 * /tickets/assigned:
 *   get:
 *     summary: Get assigned tickets
 *     description: Retrieve tickets assigned to the current user
 *     tags: [Tickets]
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
 *     responses:
 *       200:
 *         description: Assigned tickets retrieved successfully
 */
router.get('/assigned', authenticate, validateQuery(ticketListQuerySchema), getAssignedTickets);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket details
 *     description: Retrieve full details of a specific ticket
 *     tags: [Tickets]
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
 *         description: Ticket details retrieved
 */
router.get('/:id', authenticate, validateParams(objectIdSchema), getTicketById);

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     description: Normal users and staff can create support tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       201:
 *         description: Ticket created successfully
 */
router.post('/', authenticate, validateBody(createTicketSchema), createTicket);

/**
 * @swagger
 * /tickets/{id}:
 *   put:
 *     summary: Update ticket details
 *     description: Update subject or description (Creator or Admin only)
 *     tags: [Tickets]
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
 *         description: Ticket updated successfully
 */
router.put('/:id', authenticate, validateParams(objectIdSchema), validateBody(updateTicketSchema), updateTicket);

/**
 * @swagger
 * /tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status
 *     description: Update ticket status through valid transitions
 *     tags: [Tickets]
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
 *         description: Status updated successfully
 */
router.patch('/:id/status', authenticate, validateParams(objectIdSchema), validateBody(updateStatusSchema), updateStatus);

/**
 * @swagger
 * /tickets/{id}/assign:
 *   patch:
 *     summary: Assign ticket
 *     description: Assign ticket to a staff member (Admin only)
 *     tags: [Tickets]
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
 *         description: Ticket assigned successfully
 */
router.patch('/:id/assign', authenticate, requireTeamMember, validateParams(objectIdSchema), validateBody(assignTicketSchema), assignTicket);

/**
 * @swagger
 * /tickets/{id}/comments:
 *   post:
 *     summary: Add comment
 *     description: Add a public or internal comment to the ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.post('/:id/comments', authenticate, validateParams(objectIdSchema), validateBody(addCommentSchema), addComment);

/**
 * @swagger
 * /tickets/{id}/rate:
 *   post:
 *     summary: Rate ticket
 *     description: Rate a resolved/closed ticket (Creator only)
 *     tags: [Tickets]
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
 *         description: Feedback submitted successfully
 */
router.post('/:id/rate', authenticate, validateParams(objectIdSchema), validateBody(rateTicketSchema), rateTicket);

/**
 * @swagger
 * /tickets/{id}/submit-feedback:
 *   post:
 *     summary: Submit feedback and close or reopen ticket
 *     description: Creator submits feedback and decides to close or reopen the ticket
 *     tags: [Tickets]
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
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *                 maxLength: 500
 *               action:
 *                 type: string
 *                 enum: [close, reopen]
 *     responses:
 *       200:
 *         description: Feedback submitted and ticket status updated
 */
router.post('/:id/submit-feedback', authenticate, validateParams(objectIdSchema), validateBody(submitFeedbackSchema), submitFeedback);

/**
 * @swagger
 * /tickets/{id}/attachments:
 *   post:
 *     summary: Upload attachment
 *     description: Upload a file attachment to the ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post('/:id/attachments', authenticate, validateParams(objectIdSchema), uploadSingle, handleUploadError, uploadAttachment);

/**
 * @swagger
 * /tickets/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete attachment
 *     description: Delete an attachment from the ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 */
router.delete('/:id/attachments/:attachmentId', authenticate, validateParams(nestedObjectIdSchema), deleteAttachment);

/**
 * @swagger
 * /tickets/{id}/attachments/{attachmentId}/download:
 *   get:
 *     summary: Download attachment
 *     description: Download an attachment from the ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 */
router.get('/:id/attachments/:attachmentId/download', authenticate, validateParams(nestedObjectIdSchema), downloadAttachment);

/**
 * @swagger
 * /tickets/{id}/history:
 *   get:
 *     summary: Get ticket history
 *     description: Retrieve status history of the ticket
 *     tags: [Tickets]
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
 *         description: Ticket history retrieved
 */
router.get('/:id/history', authenticate, validateParams(objectIdSchema), getTicketHistory);

module.exports = router;
