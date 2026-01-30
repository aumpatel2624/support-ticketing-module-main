const mongoose = require('mongoose');

/**
 * System Settings Schema
 * Global configuration for the entire ticketing system
 * SuperAdmin only
 */
const systemSettingsSchema = new mongoose.Schema({
  // Company Branding
  companyName: {
    type: String,
    default: 'Ticketing System'
  },
  companyLogo: {
    type: String, // URL to logo image
    default: null
  },
  brandColor: {
    type: String, // Hex color code
    default: '#3b82f6'
  },
  brandSecondaryColor: {
    type: String,
    default: '#1e40af'
  },

  // Email Configuration
  emailFrom: {
    type: String,
    default: 'noreply@ticketing-system.com'
  },
  emailReplyTo: {
    type: String,
    default: null
  },

  // SLA Defaults (in hours)
  slaDefaults: {
    lowPriority: {
      type: Number,
      default: 72 // 3 days
    },
    mediumPriority: {
      type: Number,
      default: 48 // 2 days
    },
    highPriority: {
      type: Number,
      default: 24 // 1 day
    },
    criticalPriority: {
      type: Number,
      default: 4 // 4 hours
    }
  },

  // Escalation Rules
  escalationRules: [{
    afterHours: {
      type: Number,
      required: true // Hours before escalation triggers
    },
    escalateTo: {
      type: String,
      enum: ['supervisor', 'manager', 'admin'],
      required: true
    },
    notifyVia: {
      type: String,
      enum: ['email', 'in-app', 'both'],
      default: 'both'
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Audit & Logging
  auditEnabled: {
    type: Boolean,
    default: true
  },
  auditRetentionDays: {
    type: Number,
    default: 365 // Keep audit logs for 1 year
  },

  // File Upload Settings
  fileUploadMaxSize: {
    type: Number,
    default: 5242880 // 5MB in bytes
  },
  allowedFileTypes: {
    type: [String],
    default: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  },

  // Ticket Workflow
  ticketAutoCloseAfterDays: {
    type: Number,
    default: null // null = disabled
  },
  allowReopeningClosedTickets: {
    type: Boolean,
    default: true
  },
  requireResolutionCommentOnClose: {
    type: Boolean,
    default: false
  },

  // Notifications
  emailNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  inAppNotificationsEnabled: {
    type: Boolean,
    default: true
  },

  // Password Policy
  passwordMinLength: {
    type: Number,
    default: 8
  },
  passwordRequireUppercase: {
    type: Boolean,
    default: true
  },
  passwordRequireNumbers: {
    type: Boolean,
    default: true
  },
  passwordRequireSpecialChars: {
    type: Boolean,
    default: true
  },
  passwordExpiryDays: {
    type: Number,
    default: null // null = no expiry
  },

  // Session Management
  sessionTimeoutMinutes: {
    type: Number,
    default: 30
  },
  maxConcurrentSessions: {
    type: Number,
    default: 5 // Max sessions per user
  },

  // Timezone & Localization
  timezone: {
    type: String,
    default: 'UTC'
  },
  dateFormat: {
    type: String,
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    default: 'DD/MM/YYYY'
  },
  timeFormat: {
    type: String,
    enum: ['12h', '24h'],
    default: '24h'
  },

  // System Features (Toggles)
  features: {
    kanbanView: { type: Boolean, default: true },
    cardView: { type: Boolean, default: true },
    tableView: { type: Boolean, default: true },
    advancedFilters: { type: Boolean, default: true },
    bulkOperations: { type: Boolean, default: true },
    reportExport: { type: Boolean, default: true },
    globalSearch: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },

  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'System is under maintenance. Please try again later.'
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update the updatedAt field before saving
systemSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
