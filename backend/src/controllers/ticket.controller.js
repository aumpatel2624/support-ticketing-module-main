const Ticket = require('../models/Ticket');
const Category = require('../models/Category');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
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
        // Team Members see:
        // 1. Tickets assigned to them
        // 2. Unassigned tickets in their department (so they can self-assign)
        if (req.user.department) {
            filter.$or = [
                { assignedTo: req.user._id },
                { assignedTo: null, departmentId: req.user.department },
                { assignedTo: { $exists: false }, departmentId: req.user.department } // Handle missing assignedTo field
            ];
        } else {
            // Fallback if no department: just see assigned to them
            filter.assignedTo = req.user._id;
        }
    } else if (req.user.role === 'Admin') {
        // Admins usually see their own department tickets
        if (req.user.department) {
            filter.departmentId = req.user.department;
        }
    }
    // SuperAdmin sees everything (no filter added)

    // Query-based filters
    if (status) {
        const statuses = Array.isArray(status) ? status : status.split(',');
        filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (priority) {
        const priorities = Array.isArray(priority) ? priority : priority.split(',');
        filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
    }
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

    // Refresh presigned URLs for S3 attachments (they expire after 24 hours)
    if (ticket.attachments && ticket.attachments.length > 0) {
        try {
            for (const attachment of ticket.attachments) {
                if (attachment.s3Key) {
                    attachment.s3Url = await s3Service.generatePresignedUrl(attachment.s3Key, 86400); // 24 hour expiry
                }
            }
        } catch (error) {
            logger.warn(`Failed to refresh presigned URLs: ${error.message}`);
            // Continue anyway - use existing URLs if refresh fails
        }
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

        // Populate fields before returning
        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('createdBy', 'name email employeeId department')
            .populate('assignedTo', 'name email employeeId department')
            .populate('departmentId', 'name description color headUserId')
            .populate('categoryId', 'name')
            .populate('comments.userId', 'name email role')
            .populate('statusHistory.changedBy', 'name role');

        // Send notifications for status change
        if (req.user._id.toString() !== ticket.createdBy.toString()) {
            const notification = await Notification.create({
                userId: ticket.createdBy._id,
                ticketId: ticket._id,
                type: 'StatusUpdated',
                message: `Your ticket ${ticket.ticketId} status has been updated to ${newStatus}`
            });

            // Socket: Notify creator with full notification object (includes _id)
            socketService.emitToUser(ticket.createdBy._id, 'notification', notification);
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

        return res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: populatedTicket
        });
    } else {
        // Just update other fields without status change
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email employeeId department')
            .populate('assignedTo', 'name email employeeId department')
            .populate('departmentId', 'name description color headUserId')
            .populate('categoryId', 'name')
            .populate('comments.userId', 'name email role')
            .populate('statusHistory.changedBy', 'name role');

        return res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: updatedTicket
        });
    }
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

    // Populate fields before returning
    const populatedTicket = await Ticket.findById(ticket._id)
        .populate('createdBy', 'name email employeeId department')
        .populate('assignedTo', 'name email employeeId department')
        .populate('departmentId', 'name description color headUserId')
        .populate('categoryId', 'name')
        .populate('comments.userId', 'name email role')
        .populate('statusHistory.changedBy', 'name role');

    // Notify creator
    if (req.user._id.toString() !== ticket.createdBy.toString()) {
        const notification = await Notification.create({
            userId: ticket.createdBy._id,
            ticketId: ticket._id,
            type: 'StatusUpdated',
            message: `Your ticket ${ticket.ticketId} status has been updated to ${status}`
        });

        // Socket: Notify creator with full notification object
        socketService.emitToUser(ticket.createdBy._id, 'notification', notification);
        socketService.emitToTicket(ticket._id, 'status_updated', populatedTicket);
    }

    res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: populatedTicket
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

    // Permission check: SuperAdmin, Admin, or TeamMember assigning to self
    const isSelfAssignment = req.user.role === 'TeamMember' && assignedTo === req.user._id.toString();

    console.log('DEBUG ASSIGN:', {
        role: req.user.role,
        assignedTo,
        userId: req.user._id.toString(),
        isSelfAssignment
    });

    if (!['SuperAdmin', 'Admin'].includes(req.user.role) && !isSelfAssignment) {
        throw new AuthorizationError('Only Admins can assign tickets to others');
    }

    ticket.assignedTo = assignedTo;

    // If ticket is Reopened, automatically change to InProgress when reassigned
    const wasReopened = ticket.status === 'Reopened';
    if (wasReopened) {
        ticket.status = 'InProgress';
    }

    // Add assignment to status history
    const historyComment = wasReopened
        ? `${comment || 'Ticket assigned to user'} - status changed from Reopened to InProgress`
        : (comment || `Ticket assigned to user`);

    ticket.addStatusHistory(ticket.status, req.user._id, historyComment);

    await ticket.save();

    // Populate fields before returning
    const populatedTicket = await Ticket.findById(ticket._id)
        .populate('createdBy', 'name email employeeId department')
        .populate('assignedTo', 'name email employeeId department')
        .populate('departmentId', 'name description color headUserId')
        .populate('categoryId', 'name')
        .populate('comments.userId', 'name email role')
        .populate('statusHistory.changedBy', 'name role');

    // Notify assignee
    const assignee = await User.findById(assignedTo);
    if (assignee) {
        const notification = await Notification.create({
            userId: assignedTo,
            ticketId: ticket._id,
            type: 'TicketAssigned',
            message: `You have been assigned to ticket: ${ticket.ticketId}`
        });

        // Socket: Notify assignee with full notification object
        socketService.emitToUser(assignedTo, 'notification', notification);
    }

    res.status(200).json({
        success: true,
        message: 'Ticket assigned successfully',
        data: populatedTicket
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
 * @desc    Submit feedback and decide to close or reopen ticket
 * @route   POST /api/tickets/:id/submit-feedback
 * @access  Private (Creator only)
 */
const submitFeedback = asyncHandler(async (req, res) => {
    const { rating, feedback, action } = req.body; // action: 'close' or 'reopen'

    if (!['close', 'reopen'].includes(action)) {
        throw new ValidationError('Action must be either "close" or "reopen"');
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) throw new NotFoundError('Ticket not found');

    // Only creator can submit feedback
    if (ticket.createdBy.toString() !== req.user._id.toString()) {
        throw new AuthorizationError('Only the ticket creator can submit feedback');
    }

    if (ticket.status !== 'Completed') {
        throw new ValidationError('Feedback can only be submitted for completed tickets');
    }

    // Update ticket with feedback
    ticket.rating = rating;
    ticket.feedback = feedback;
    ticket.feedbackGiven = true;
    ticket.feedbackGivenAt = new Date();

    // Handle action
    if (action === 'close') {
        // Close the ticket
        ticket.status = 'Closed';
        ticket.closedAt = new Date();
        ticket.addStatusHistory('Closed', req.user._id, 'Ticket closed based on creator feedback');
    } else if (action === 'reopen') {
        // Reopen the ticket - change to Reopened
        ticket.status = 'Reopened';
        ticket.addStatusHistory('Reopened', req.user._id, 'Ticket reopened by creator - not satisfied with completion');
    }

    await ticket.save();

    // Notify assignee of the action
    if (ticket.assignedTo) {
        await ticket.populate('assignedTo', 'name email');
        const Notification = require('../models/Notification');

        const notificationType = action === 'close' ? 'FeedbackSubmitted' : 'TicketReopened';
        const message = action === 'close'
            ? `Creator has submitted feedback and closed ticket ${ticket.ticketId}`
            : `Creator has reopened ticket ${ticket.ticketId} - not satisfied with completion`;

        await Notification.create({
            userId: ticket.assignedTo._id,
            ticketId: ticket._id,
            type: notificationType,
            message
        });

        // Socket: Notify assignee
        const socketService = require('../services/socket.service');
        socketService.emitToUser(ticket.assignedTo._id, 'notification', {
            type: notificationType,
            message,
            ticketId: ticket._id
        });
    }

    res.status(200).json({
        success: true,
        message: action === 'close' ? 'Feedback submitted and ticket closed' : 'Ticket reopened for further work',
        data: {
            ticketId: ticket._id,
            status: ticket.status,
            rating,
            feedback,
            action
        }
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
        // Generate presigned URL for S3 objects (more secure than public URLs)
        try {
            attachment.s3Url = await s3Service.generatePresignedUrl(req.file.key, 86400); // 24 hour expiry
        } catch (error) {
            logger.warn(`Failed to generate presigned URL: ${error.message}, using direct URL`);
            // Fallback to direct URL if presigned fails
            attachment.s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${req.file.key}`;
        }
    } else {
        // Local storage fallback
        attachment.path = req.file.path;
    }

    ticket.attachments.push(attachment);
    await ticket.save();

    // Get the saved attachment with the _id assigned by MongoDB
    const savedAttachment = ticket.attachments[ticket.attachments.length - 1];

    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: savedAttachment
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

    const targetId = String(req.params.attachmentId).trim();
    const attachment = ticket.attachments.find(a => String(a._id).trim() === targetId);

    if (!attachment) {
        const availableIds = ticket.attachments.map(a => String(a._id).trim()).join(', ');

        // Deep debug: Log lengths and char codes to find invisible characters
        logger.warn(`Attachment 404 Debug:`);
        logger.warn(`Target ID: "${targetId}" (len: ${targetId.length})`);

        ticket.attachments.forEach((a, i) => {
            const idStr = String(a._id).trim();
            const isMatch = idStr === targetId;
            logger.warn(`[${i}] DB ID: "${idStr}" (len: ${idStr.length}) - Match: ${isMatch}`);
            if (!isMatch && idStr.includes(targetId)) logger.warn('   -> Partial match detected!');
        });

        const targetHex = Buffer.from(targetId).toString('hex');
        const availableInfo = ticket.attachments.map(a => {
            const tempId = String(a._id).trim();
            return `${tempId} (Hex: ${Buffer.from(tempId).toString('hex')})`;
        }).join(', ');
        throw new NotFoundError(`Attachment not found. Target Hex: ${targetHex}. Available: ${availableInfo}`);
    }

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
    if (status) {
        const statuses = Array.isArray(status) ? status : status.split(',');
        filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (priority) {
        const priorities = Array.isArray(priority) ? priority : priority.split(',');
        filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
    }

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
    if (status) {
        const statuses = Array.isArray(status) ? status : status.split(',');
        filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (priority) {
        const priorities = Array.isArray(priority) ? priority : priority.split(',');
        filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
    }

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
 * @desc    Download attachment from ticket
 * @route   GET /api/tickets/:id/attachments/:attachmentId/download
 * @access  Private
 */
const downloadAttachment = asyncHandler(async (req, res) => {
    // Fetch ticket with attachment
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    // Get attachment by ID using Mongoose subdocument method
    const attachment = ticket.attachments.id(req.params.attachmentId);
    if (!attachment) throw new NotFoundError('Attachment not found');

    // Permission check: user must have access to the ticket
    const isCreator = ticket.createdBy.toString() === req.user._id.toString();
    const isAssigned = ticket.assignedTo?.toString() === req.user._id.toString();
    const isStaff = ['SuperAdmin', 'Admin', 'TeamMember'].includes(req.user.role);

    if (!isCreator && !isAssigned && !isStaff) {
        throw new AuthorizationError('You do not have permission to download this attachment');
    }

    // Handle S3 files
    if (attachment.s3Key) {
        try {
            const presignedUrl = await s3Service.generatePresignedUrl(attachment.s3Key, 3600);
            return res.redirect(presignedUrl);
        } catch (error) {
            logger.error(`S3 presigned URL generation failed: ${error.message}`);
            throw new Error('Failed to generate download link');
        }
    }

    // Handle local files
    if (attachment.path) {
        const path = require('path');
        const fs = require('fs');

        const resolvedPath = path.resolve(attachment.path);

        // Verify file exists
        if (!fs.existsSync(resolvedPath)) {
            throw new NotFoundError('File not found on server');
        }

        // Set response headers for download
        res.setHeader('Content-Type', attachment.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName || attachment.filename}"`);

        // Send file
        return res.sendFile(resolvedPath);
    }

    // No storage location found
    throw new NotFoundError('File storage location not configured');
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
    submitFeedback,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    getTicketHistory,
    getMyTickets,
    getAssignedTickets
};
