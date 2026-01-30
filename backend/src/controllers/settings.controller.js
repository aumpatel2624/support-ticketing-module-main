const SystemSettings = require('../models/SystemSettings');
const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * ========== SYSTEM SETTINGS CONTROLLERS (SuperAdmin Only) ==========
 */

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private - SuperAdmin only
 */
const getSystemSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne();

  // Create default settings if none exist
  if (!settings) {
    settings = await SystemSettings.create({});
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

/**
 * @desc    Update system settings
 * @route   PUT /api/admin/settings
 * @access  Private - SuperAdmin only
 */
const updateSystemSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne();

  // Create if doesn't exist
  if (!settings) {
    settings = await SystemSettings.create(req.body);
  } else {
    // Update only allowed fields
    const allowedFields = [
      'companyName', 'companyLogo', 'brandColor', 'brandSecondaryColor',
      'emailFrom', 'emailReplyTo', 'slaDefaults', 'escalationRules',
      'auditEnabled', 'auditRetentionDays', 'fileUploadMaxSize',
      'allowedFileTypes', 'ticketAutoCloseAfterDays', 'allowReopeningClosedTickets',
      'requireResolutionCommentOnClose', 'emailNotificationsEnabled',
      'inAppNotificationsEnabled', 'passwordMinLength', 'passwordRequireUppercase',
      'passwordRequireNumbers', 'passwordRequireSpecialChars', 'passwordExpiryDays',
      'sessionTimeoutMinutes', 'maxConcurrentSessions', 'timezone', 'dateFormat',
      'timeFormat', 'features', 'maintenanceMode', 'maintenanceMessage'
    ];

    allowedFields.forEach(field => {
      if (field in req.body) {
        settings[field] = req.body[field];
      }
    });
  }

  settings.updatedBy = req.user._id;
  await settings.save();

  res.status(200).json({
    success: true,
    message: 'System settings updated successfully',
    data: settings
  });
});

/**
 * @desc    Get system settings (public - non-sensitive fields only)
 * @route   GET /api/settings/public
 * @access  Public
 */
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOne();

  if (!settings) {
    return res.status(200).json({
      success: true,
      data: {}
    });
  }

  // Only return non-sensitive settings
  const publicSettings = {
    companyName: settings.companyName,
    companyLogo: settings.companyLogo,
    brandColor: settings.brandColor,
    brandSecondaryColor: settings.brandSecondaryColor,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    features: settings.features,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMode ? settings.maintenanceMessage : null
  };

  res.status(200).json({
    success: true,
    data: publicSettings
  });
});

/**
 * ========== USER PREFERENCES CONTROLLERS ==========
 */

/**
 * @desc    Get user preferences (own or admin viewing)
 * @route   GET /api/users/:id/preferences
 * @access  Private
 */
const getUserPreferences = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check permission: user can only view own preferences unless admin
  const isAdmin = ['SuperAdmin', 'Admin'].includes(req.user.role);
  if (req.user._id.toString() !== id && !isAdmin) {
    throw new AuthorizationError('You do not have permission to view these preferences');
  }

  let preferences = await UserPreferences.findOne({ userId: id });

  // Create default preferences if none exist
  if (!preferences) {
    preferences = await UserPreferences.create({ userId: id });
  }

  res.status(200).json({
    success: true,
    data: preferences
  });
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/users/:id/preferences
 * @access  Private
 */
const updateUserPreferences = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check permission: user can only update own preferences
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only update your own preferences');
  }

  let preferences = await UserPreferences.findOne({ userId: id });

  // Create if doesn't exist
  if (!preferences) {
    preferences = await UserPreferences.create({ userId: id });
  }

  // Update allowed fields
  const allowedFields = [
    'notifications', 'notificationEvents', 'theme', 'sidebarCollapsed',
    'compactMode', 'defaultTicketView', 'defaultSortBy', 'defaultSortOrder',
    'ticketsPerPage', 'dashboardWidgets', 'emailPreferences', 'language',
    'timezone', 'slackIntegration', 'teamsIntegration',
    'allowDataCollection', 'allowAnalytics'
  ];

  allowedFields.forEach(field => {
    if (field in req.body) {
      if (typeof preferences[field] === 'object' && !Array.isArray(preferences[field])) {
        // Merge nested objects
        preferences[field] = { ...preferences[field], ...req.body[field] };
      } else {
        preferences[field] = req.body[field];
      }
    }
  });

  await preferences.save();

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: preferences
  });
});

/**
 * @desc    Update notification preferences
 * @route   PUT /api/users/:id/preferences/notifications
 * @access  Private
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check permission
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only update your own preferences');
  }

  let preferences = await UserPreferences.findOne({ userId: id });

  if (!preferences) {
    preferences = await UserPreferences.create({ userId: id });
  }

  // Update notification settings
  if (req.body.notifications) {
    preferences.notifications = { ...preferences.notifications, ...req.body.notifications };
  }
  if (req.body.notificationEvents) {
    preferences.notificationEvents = { ...preferences.notificationEvents, ...req.body.notificationEvents };
  }

  await preferences.save();

  res.status(200).json({
    success: true,
    message: 'Notification preferences updated',
    data: preferences
  });
});

/**
 * @desc    Get all saved filters
 * @route   GET /api/users/:id/preferences/filters
 * @access  Private
 */
const getSavedFilters = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check permission
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only view your own filters');
  }

  const preferences = await UserPreferences.findOne({ userId: id });

  res.status(200).json({
    success: true,
    data: preferences?.savedFilters || []
  });
});

/**
 * @desc    Save a filter preset
 * @route   POST /api/users/:id/preferences/filters
 * @access  Private
 */
const saveFilter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, filters } = req.body;

  // Validate input
  if (!name || !filters) {
    throw new ValidationError('Filter name and criteria are required');
  }

  // Check permission
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only save your own filters');
  }

  let preferences = await UserPreferences.findOne({ userId: id });

  if (!preferences) {
    preferences = await UserPreferences.create({ userId: id });
  }

  // Add new filter
  preferences.savedFilters.push({
    name,
    filters,
    createdAt: new Date()
  });

  await preferences.save();

  res.status(201).json({
    success: true,
    message: 'Filter saved successfully',
    data: preferences.savedFilters
  });
});

/**
 * @desc    Delete saved filter
 * @route   DELETE /api/users/:id/preferences/filters/:filterId
 * @access  Private
 */
const deleteFilter = asyncHandler(async (req, res) => {
  const { id, filterId } = req.params;

  // Check permission
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only delete your own filters');
  }

  const preferences = await UserPreferences.findOne({ userId: id });

  if (!preferences) {
    throw new NotFoundError('Preferences not found');
  }

  preferences.savedFilters = preferences.savedFilters.filter(
    filter => filter._id.toString() !== filterId
  );

  await preferences.save();

  res.status(200).json({
    success: true,
    message: 'Filter deleted successfully'
  });
});

/**
 * @desc    Enable two-factor authentication
 * @route   POST /api/users/:id/preferences/2fa/enable
 * @access  Private
 */
const enable2FA = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check permission
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only enable 2FA for your own account');
  }

  let preferences = await UserPreferences.findOne({ userId: id });

  if (!preferences) {
    preferences = await UserPreferences.create({ userId: id });
  }

  // In a real implementation, this would generate a secret and QR code
  preferences.twoFactorEnabled = true;
  await preferences.save();

  res.status(200).json({
    success: true,
    message: '2FA enabled successfully',
    data: {
      twoFactorEnabled: preferences.twoFactorEnabled,
      // In production, would return QR code and backup codes
    }
  });
});

/**
 * @desc    Disable two-factor authentication
 * @route   POST /api/users/:id/preferences/2fa/disable
 * @access  Private
 */
const disable2FA = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check permission
  if (req.user._id.toString() !== id) {
    throw new AuthorizationError('You can only disable 2FA for your own account');
  }

  const preferences = await UserPreferences.findOne({ userId: id });

  if (!preferences) {
    throw new NotFoundError('Preferences not found');
  }

  preferences.twoFactorEnabled = false;
  await preferences.save();

  res.status(200).json({
    success: true,
    message: '2FA disabled successfully'
  });
});

module.exports = {
  // System Settings (SuperAdmin)
  getSystemSettings,
  updateSystemSettings,
  getPublicSettings,

  // User Preferences
  getUserPreferences,
  updateUserPreferences,
  updateNotificationPreferences,

  // Saved Filters
  getSavedFilters,
  saveFilter,
  deleteFilter,

  // 2FA
  enable2FA,
  disable2FA
};
