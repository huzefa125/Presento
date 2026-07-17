const mongoose = require('mongoose');

/**
 * Settings Schema
 * Stores system-wide settings for the platform
 */
const settingsSchema = new mongoose.Schema({
  // System Settings
  system: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    maxUsersPerInstitution: {
      type: Number,
      default: 100,
      min: 1,
      max: 10000
    },
    maintenanceMessage: {
      type: String,
      default: 'The system is currently under maintenance. Please check back later.',
      maxlength: 500
    }
  },
  
  // Notification Settings
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    newUserAlerts: {
      type: Boolean,
      default: true
    },
    paymentAlerts: {
      type: Boolean,
      default: true
    },
    systemAlerts: {
      type: Boolean,
      default: true
    },
    adminEmail: {
      type: String,
      default: 'admin@inavora.com',
      trim: true,
      lowercase: true
    }
  },
  
  // Security Settings
  security: {
    sessionTimeout: {
      type: Number,
      default: 30, // minutes
      min: 5,
      max: 480
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    enable2FA: {
      type: Boolean,
      default: false
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 32
    }
  },
  
  // Platform Settings
  platform: {
    siteName: {
      type: String,
      default: 'Inavora',
      maxlength: 100
    },
    siteDescription: {
      type: String,
      default: 'Professional presentation platform',
      maxlength: 500
    },
    supportEmail: {
      type: String,
      default: 'support@inavora.com',
      trim: true,
      lowercase: true
    },
    supportPhone: {
      type: String,
      default: '+91 9043411110',
      maxlength: 20
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

