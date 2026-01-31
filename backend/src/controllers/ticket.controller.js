const Ticket = require('../models/Ticket');
const Category = require('../models/Category');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
const emailService = require('../services/email.service');
const socketService = require('../services/socket.service');
const s3Service = require('../services/s3.service');
const logger = require('../utils/logger');

/**
 * @desc    Get all tickets with role-based filtering
 * @route   GET /api/tickets
 * @access  Private
 */
const getTickets = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const {
        status,
        priority,
        departmentId,
        categoryId,
        assignedTo,
        createdBy,
        search,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo
    } = req.query;

    // Build filter based on role and query params
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'NormalUser') {
        filter.createdBy = req.user._id;
    } else if (req.user.role === 'TeamMember') {
        filter.assignedTo = req.user._id;
    } else if (req.user.role === 'Admin') {
        // Admins usually see their own department tickets
        if (req.user.department) {
            filter.departmentId = req.user.department;
        }
    }
    // SuperAdmin sees everything (no filter added)

    // Query-based filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (departmentId) filter.departmentId = departmentId;
    if (categoryId) filter.categoryId = categoryId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;

    // Search filter
    if (search) {
        filter.$or = [
            { ticketId: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Sorting
    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    const [tickets, total] = await Promise.all([
        Ticket.find(filter)
            .populate('createdBy', 'name email employeeId')
            .populate('assignedTo', 'name email employeeId')
            .populate('departmentId', 'name color')
            .populate('categoryId', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Ticket.countDocuments(filter)
    ]);

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: tickets,
        pagination
    });
});

/**
 * @desc    Get single ticket details
 * @route   GET /api/tickets/:id
 * @access  Private
 */
const getTicketById = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('createdBy', 'name email employeeId department')
        .populate('assignedTo', 'name email employeeId department')
        .populate('departmentId', 'name description color headUserId')
        .populate('categoryId', 'name')
        .populate('comments.userId', 'name email role')
        .populate('statusHistory.changedBy', 'name role');

    if (!ticket) {
        throw new NotFoundError('Ticket not found');
    }

    // Permission check
    const isCreator = ticket.createdBy._id.toString() === req.user._id.toString();
    const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === req.user._id.toString();
    const isAdminInDept = req.user.role === 'Admin' && req.user.department?.toString() === ticket.departmentId._id.toString();
    const isSuperAdmin = req.user.role === 'SuperAdmin';

    if (!isCreator && !isAssigned && !isAdminInDept && !isSuperAdmin) {
        throw new AuthorizationError('You do not have permission to view this ticket');
    }

    // Filter internal comments for non-staff
    const isStaff = ['SuperAdmin', 'Admin', 'TeamMember'].includes(req.user.role);
    if (!isStaff) {
        ticket.comments = ticket.comments.filter(c => !c.isInternal);
    }

    res.status(200).json({
        success: true,
        data: ticket
    });
});

/**
 * @desc    Create a new ticket
 * @route   POST /api/tickets
 * @access  Private
 */
const createTicket = asyncHandler(async (req, res) => {
    const { subject, description, departmentId, categoryId, priority } = req.body;

    // Verify department and category
    const [department, category] = await Promise.all([
        Department.findById(departmentId),
        Category.findById(categoryId)
    ]);

    if (!department) throw new NotFoundError('Department not found');
    if (!category) throw new NotFoundError('Category not found');

    const ticket = new Ticket({
        subject,
        description,
        departmentId,
        categoryId,
        priority: priority || category.defaultPriority,
        createdBy: req.user._id,
        status: 'New'
    });

    // Calculate SLA
    await ticket.calculateSLA();

    // Add initial history
    ticket.addStatusHistory('New', req.user._id, 'Ticket created');

    await ticket.save();

    // Notify Department Head/Admins
    if (department.headUserId) {
        await Notification.create({
            userId: department.headUserId,
            ticketId: ticket._id,
            type: 'TicketCreated',
            message: `New ticket created in your department: ${ticket.ticketId}`
        });
    }

    // Send confirmation email to user (non-blocking)
    emailService.sendTicketCreatedEmail(req.user, ticket).catch(err => {
        logger.error('Failed to send ticket created email:', err);
    });

    // Socket: Notify department workers
    socketService.emitToDepartment(departmentId, 'ticket_created', ticket);

    res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
    });
});

/**
 * @desc    Update ticket details
 * @route   PUT /api/tickets/:id
 * @access  Private
 */
const updateTicket = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    // Permission check: only creator or admin/superadmin can update details
    const isCreator = ticket.createdBy.toString() === req.user._id.toString();
    const isAdmin = ['SuperAdmin', 'Admin'].includes(req.user.role);

    if (!isCreator && !isAdmin) {
        throw new AuthorizationError('You do not have permission to update this ticket');
    }

    // If status is being updated, handle it with full status change logic
    if (req.body.status && req.body.status !== ticket.status) {
        const newStatus = req.body.status;

        // Validate transition
        if (!ticket.canTransitionTo(newStatus)) {
            throw new ValidationError(`Invalid status transition from ${ticket.status} to ${newStatus}`);
        }

        const oldStatus = ticket.status;
        ticket.status = newStatus;

        // Update timestamps based on status
        if (newStatus === 'Completed') ticket.resolvedAt = new Date();
        if (newStatus === 'Closed') ticket.closedAt = new Date();

        // Add to status history
        ticket.addStatusHistory(newStatus, req.user._id, req.body.comment || null);

        // Update other fields if provided
        const { status, comment, ...otherFields } = req.body;
        Object.assign(ticket, otherFields);

        await ticket.save();

        // Send notifications for status change
        if (req.user._id.toString() !== ticket.createdBy.toString()) {
            await ticket.populate('createdBy', 'name email');

            await Notification.create({
                userId: ticket.createdBy._id,
                ticketId: ticket._id,
                type: 'StatusUpdated',
                message: `Your ticket ${ticket.ticketId} status has been updated to ${newStatus}`
            });

            // Send email notification (non-blocking)
            emailService.sendStatusUpdateEmail(ticket.createdBy, ticket, oldStatus, newStatus).catch(err => {
                logger.error('Failed to send status update email:', err);
            });

            // Socket: Notify creator
            socketService.emitToUser(ticket.createdBy._id, 'notification', {
                type: 'StatusUpdated',
                message: `Your ticket ${ticket.ticketId} status has been updated to ${newStatus}`
            });
        }

        // Broadcast status change to all connected users
        socketService.emitToAll('ticketUpdated', {
            ticketId: ticket._id,
            status: newStatus,
            assignedTo: ticket.assignedTo,
            updatedBy: req.user._id,
            updatedAt: ticket.updatedAt
        });

        // Also emit to the ticket's room for viewers
        socketService.emitToTicket(ticket._id, 'ticketUpdated', {
            ticketId: ticket._id,
            status: newStatus,
            assignedTo: ticket.assignedTo,
            updatedBy: req.user._id,
            updatedAt: ticket.updatedAt
        });
    } else {
        // Just update other fields without status change
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: updatedTicket
        });
    }

    res.status(200).json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
    });
});

/**
 * @desc    Update ticket status
 * @route   PATCH /api/tickets/:id/status
 * @access  Private
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { status, comment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) throw new NotFoundError('Ticket not found');

    // Validate transition
    if (!ticket.canTransitionTo(status)) {
        throw new ValidationError(`Invalid status transition from ${ticket.status} to ${status}`);
    }

    // Permission check
    const isAssigned = ticket.assignedTo?.toString() === req.user._id.toString();
    const isAdmin = ['SuperAdmin', 'Admin'].includes(req.user.role);

    // Normal users can only close their own tickets or reopen completed ones
    const isCreator = ticket.createdBy.toString() === req.user._id.toString();

    if (!isAssigned && !isAdmin && !(isCreator && ['Closed', 'InProgress'].includes(status))) {
        throw new AuthorizationError('You do not have permission to change the status of this ticket');
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    // Update timestamps
    if (status === 'Completed') ticket.resolvedAt = new Date();
    if (status === 'Closed') ticket.closedAt = new Date();

    ticket.addStatusHistory(status, req.user._id, comment);
    await ticket.save();

    // Notify creator
    if (req.user._id.toString() !== ticket.createdBy.toString()) {
        await ticket.populate('createdBy', 'name email');

        await Notification.create({
            userId: ticket.createdBy._id,
            ticketId: ticket._id,
            type: 'StatusUpdated',
            message: `Your ticket ${ticket.ticketId} status has been updated to ${status}`
        });

        // Send email notification (non-blocking)
        emailService.sendStatusUpdateEmail(ticket.createdBy, ticket, oldStatus, status).catch(err => {
            logger.error('Failed to send status update email:', err);
        });

        // Socket: Notify creator
        socketService.emitToUser(ticket.createdBy._id, 'notification', {
            type: 'StatusUpdated',
            message: `Your ticket ${ticket.ticketId} status has been updated to ${status}`
        });
        socketService.emitToTicket(ticket._id, 'status_updated', ticket);
    }

    res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: ticket
    });
});

/**
 * @desc    Assign ticket to a user
 * @route   PATCH /api/tickets/:id/assign
 * @access  Private (Admin or higher)
 */
const assignTicket = asyncHandler(async (req, res) => {
    const { assignedTo, comment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) throw new NotFoundError('Ticket not found');

    // Permission check: SuperAdmin or Admin
    if (!['SuperAdmin', 'Admin'].includes(req.user.role)) {
        throw new AuthorizationError('Only Admins can assign tickets');
    }

    ticket.assignedTo = assignedTo;

    // Add assignment to status history (without changing the status itself)
    ticket.addStatusHistory(ticket.status, req.user._id, comment || `Ticket assigned to user`);

    await ticket.save();

    // Notify assignee
    const assignee = await User.findById(assignedTo);
    if (assignee) {
        await Notification.create({
            userId: assignedTo,
            ticketId: ticket._id,
            type: 'TicketAssigned',
            message: `You have been assigned to ticket: ${ticket.ticketId}`
        });

        // Send email notification (non-blocking)
        emailService.sendTicketAssignedEmail(assignee, ticket).catch(err => {
            logger.error('Failed to send ticket assigned email:', err);
        });

        // Socket: Notify assignee
        socketService.emitToUser(assignedTo, 'notification', {
            type: 'TicketAssigned',
            message: `You have been assigned to ticket: ${ticket.ticketId}`
        });
    }

    res.status(200).json({
        success: true,
        message: 'Ticket assigned successfully',
        data: ticket
    });
});

/**
 * @desc    Add comment to ticket
 * @route   POST /api/tickets/:id/comments
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
    const { text, isInternal } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) throw new NotFoundError('Ticket not found');

    // Internal comments only for staff
    const isStaff = ['SuperAdmin', 'Admin', 'TeamMember'].includes(req.user.role);
    if (isInternal && !isStaff) {
        throw new AuthorizationError('Only staff can add internal comments');
    }

    const comment = {
        userId: req.user._id,
        text,
        isInternal: !!isInternal,
        createdAt: new Date()
    };

    ticket.comments.push(comment);
    await ticket.save();

    // Notify relevant parties (creator if staff commented, or assignee if user commented)
    const isUserCommenting = req.user._id.toString() === ticket.createdBy.toString();
    const notifyUserId = isUserCommenting ? ticket.assignedTo : ticket.createdBy;

    if (notifyUserId && !isInternal) {
        await Notification.create({
            userId: notifyUserId,
            ticketId: ticket._id,
            type: 'NewComment',
            message: `New comment on ticket ${ticket.ticketId}`
        });

        // Socket: Notify user
        socketService.emitToUser(notifyUserId, 'notification', {
            type: 'NewComment',
            message: `New comment on ticket ${ticket.ticketId}`
        });
    }

    // Socket: Update ticket view for everyone in the room
    socketService.emitToTicket(ticket._id, 'new_comment', comment);

    res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
    });
});

/**
 * @desc    Rate and provide feedback for a resolved ticket
 * @route   POST /api/tickets/:id/rate
 * @access  Private (Creator only)
 */
const rateTicket = asyncHandler(async (req, res) => {
    const { rating, feedback } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) throw new NotFoundError('Ticket not found');

    if (ticket.createdBy.toString() !== req.user._id.toString()) {
        throw new AuthorizationError('Only the ticket creator can rate this ticket');
    }

    if (!['Completed', 'Closed'].includes(ticket.status)) {
        throw new ValidationError('Can only rate completed or closed tickets');
    }

    ticket.rating = rating;
    ticket.feedback = feedback;
    await ticket.save();

    res.status(200).json({
        success: true,
        message: 'Thank you for your feedback',
        data: { rating, feedback }
    });
});

/**
 * @desc    Upload attachment to ticket
 * @route   POST /api/tickets/:id/attachments
 * @access  Private
 */
const uploadAttachment = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ValidationError('No file uploaded');
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    // Permission check
    const isStaff = ['SuperAdmin', 'Admin', 'TeamMember'].includes(req.user.role);
    const isCreator = ticket.createdBy.toString() === req.user._id.toString();

    if (!isStaff && !isCreator) {
        throw new AuthorizationError('You do not have permission to add attachments to this ticket');
    }

    // Build attachment object - handle both S3 and local storage
    const attachment = {
        filename: req.file.filename || req.file.key?.split('/').pop(),
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
    };

    // S3 upload (if using S3 storage)
    if (req.file.location || req.file.key) {
        attachment.s3Key = req.file.key;
        attachment.s3Url = req.file.location || `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${req.file.key}`;
    } else {
        // Local storage fallback
        attachment.path = req.file.path;
    }

    ticket.attachments.push(attachment);
    await ticket.save();

    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: attachment
    });
});

/**
 * @desc    Delete attachment from ticket
 * @route   DELETE /api/tickets/:id/attachments/:attachmentId
 * @access  Private
 */
const deleteAttachment = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    const attachment = ticket.attachments.id(req.params.attachmentId);
    if (!attachment) throw new NotFoundError('Attachment not found');

    // Permission check: creator of attachment or SuperAdmin/Admin
    const isOwner = attachment.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = ['SuperAdmin', 'Admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
        throw new AuthorizationError('You do not have permission to delete this attachment');
    }

    // Delete from S3 if S3Key exists
    if (attachment.s3Key) {
        try {
            await s3Service.deleteFile(attachment.s3Key);
        } catch (error) {
            logger.error(`Failed to delete S3 file: ${error.message}`);
            // Continue anyway, remove from DB even if S3 delete fails
        }
    }

    // Delete from local filesystem (fallback/legacy)
    if (attachment.path) {
        const fs = require('fs');
        try {
            if (fs.existsSync(attachment.path)) {
                fs.unlinkSync(attachment.path);
            }
        } catch (error) {
            logger.error(`Failed to delete local file: ${error.message}`);
            // Continue anyway, remove from DB
        }
    }

    // Remove from array
    ticket.attachments.pull(req.params.attachmentId);
    await ticket.save();

    res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully'
    });
});

/**
 * @desc    Get ticket status history
 * @route   GET /api/tickets/:id/history
 * @access  Private
 */
const getTicketHistory = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .select('statusHistory')
        .populate('statusHistory.changedBy', 'name role');

    if (!ticket) throw new NotFoundError('Ticket not found');

    res.status(200).json({
        success: true,
        data: ticket.statusHistory
    });
});

/**
 * @desc    Get tickets created by current user
 * @route   GET /api/tickets/my-tickets
 * @access  Private
 */
const getMyTickets = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, priority, search, sortBy, sortOrder, dateFrom, dateTo } = req.query;

    // Build filter - only tickets created by the current user
    const filter = {
        createdBy: req.user._id
    };

    // Optional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Search filter
    if (search) {
        filter.$or = [
            { ticketId: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Sorting
    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    const [tickets, total] = await Promise.all([
        Ticket.find(filter)
            .populate('createdBy', 'name email employeeId')
            .populate('assignedTo', 'name email employeeId')
            .populate('departmentId', 'name color')
            .populate('categoryId', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Ticket.countDocuments(filter)
    ]);

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: tickets,
        pagination
    });
});

/**
 * @desc    Get tickets assigned to current user
 * @route   GET /api/tickets/assigned
 * @access  Private
 */
const getAssignedTickets = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, priority, search, sortBy, sortOrder, dateFrom, dateTo } = req.query;

    // Build filter - only tickets assigned to the current user
    const filter = {
        assignedTo: req.user._id
    };

    // Optional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Search filter
    if (search) {
        filter.$or = [
            { ticketId: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Sorting
    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    const [tickets, total] = await Promise.all([
        Ticket.find(filter)
            .populate('createdBy', 'name email employeeId')
            .populate('assignedTo', 'name email employeeId')
            .populate('departmentId', 'name color')
            .populate('categoryId', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Ticket.countDocuments(filter)
    ]);

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: tickets,
        pagination
    });
});

module.exports = {
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    updateStatus,
    assignTicket,
    addComment,
    rateTicket,
    uploadAttachment,
    deleteAttachment,
    getTicketHistory,
    getMyTickets,
    getAssignedTickets
};
