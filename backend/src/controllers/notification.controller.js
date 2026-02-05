const Notification = require('../models/Notification');
const { NotFoundError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { isRead, type } = req.query;

    const filter = { userId: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .populate('ticketId', 'ticketId subject priority')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments(filter)
    ]);

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: notifications,
        pagination
    });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!notification) {
        throw new NotFoundError('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    // Socket: Notify user that notification is read (for other tabs)
    const socketService = require('../services/socket.service');
    socketService.emitToUser(req.user._id, 'notification_read', notification._id);

    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
    });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
    });

    // Socket: Notify user that all notifications are read (for other tabs)
    const socketService = require('../services/socket.service');
    socketService.emitToUser(req.user._id, 'notification_all_read', null);
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!notification) {
        throw new NotFoundError('Notification not found');
    }

    res.status(200).json({
        success: true,
        message: 'Notification deleted'
    });
});

/**
 * @desc    Delete all notifications for user
 * @route   DELETE /api/notifications
 * @access  Private
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ userId: req.user._id });

    res.status(200).json({
        success: true,
        message: 'All notifications deleted'
    });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};
