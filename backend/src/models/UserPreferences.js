const mongoose = require('mongoose');

/**
 * User Preferences Schema
 * Individual user settings and preferences
 * Each user can customize their experience
 */
const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Notification Preferences
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    inAppNotifications: {
      type: Boolean,
      default: true
    },
    desktopNotifications: {
      type: Boolean,
      default: false
    },
    soundNotifications: {
      type: Boolean,
      default: true
    },
    emailDigestFrequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'never'],
      default: 'immediate'
    },
    unsubscribeFromNewsletter: {
      type: Boolean,
      default: false
    }
  },

  // Notification Event Preferences
  notificationEvents: {
    ticketAssigned: {
      type: Boolean,
      default: true
    },
    ticketStatusChanged: {
      type: Boolean,
      default: true
    },
    newComment: {
      type: Boolean,
      default: true
    },
    slaBreach: {
      type: Boolean,
      default: true
    },
    departmentUpdate: {
      type: Boolean,
      default: true
    },
    systemAnnouncement: {
      type: Boolean,
      default: true
    }
  },

  // Theme & UI Preferences
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  compactMode: {
    type: Boolean,
    default: false
  },

  // Default View Settings
  defaultTicketView: {
    type: String,
    enum: ['table', 'card', 'kanban'],
    default: 'table'
  },
  defaultSortBy: {
    type: String,
    default: 'createdAt'
  },
  defaultSortOrder: {
    type: String,
    enum: ['asc', 'desc'],
    default: 'desc'
  },
  ticketsPerPage: {
    type: Number,
    default: 50
  },

  // Dashboard Settings
  dashboardWidgets: {
    type: [String],
    default: [
      'recentTickets',
      'stats',
      'performanceChart',
      'teamActivity'
    ]
  },

  // Saved Filters
  savedFilters: [{
    name: String,
    filters: mongoose.Schema.Types.Mixed, // Contains filter criteria
    createdAt: { type: Date, default: Date.now }
  }],

  // Email Preferences
  emailPreferences: {
    displayName: {
      type: String,
      default: null
    },
    replyTo: {
      type: String,
      default: null
    },
    signatureEnabled: {
      type: Boolean,
      default: false
    },
    signature: {
      type: String,
      default: null
    }
  },

  // Security Settings
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorMethod: {
    type: String,
    enum: ['email', 'authenticator', 'sms'],
    default: 'email'
  },
  lastPasswordChangeAt: {
    type: Date,
    default: null
  },
  loginAlertEnabled: {
    type: Boolean,
    default: true
  },

  // Language & Localization
  language: {
    type: String,
    default: 'en-US'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Integration Preferences
  slackIntegration: {
    enabled: { type: Boolean, default: false },
    webhookUrl: { type: String, default: null }
  },
  teamsIntegration: {
    enabled: { type: Boolean, default: false },
    webhookUrl: { type: String, default: null }
  },

  // Data & Privacy
  allowDataCollection: {
    type: Boolean,
    default: true
  },
  allowAnalytics: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create default preferences when user is created
userPreferencesSchema.statics.createDefaultPreferences = async function(userId) {
  try {
    return await this.create({ userId });
  } catch (error) {
    if (error.code !== 11000) { // Ignore duplicate key error
      throw error;
    }
  }
};

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
