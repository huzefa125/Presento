/**
 * Super Admin Controller - settings
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const Logger = require('../../utils/logger');
const Settings = require('../../models/Settings');
const { asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get Settings
 * @route GET /api/super-admin/settings
 * @access Private (Super Admin)
 */
const getSettings = asyncHandler(async (req, res, next) => {
  const settings = await Settings.getSettings();
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

/**
 * Update Settings
 * @route PUT /api/super-admin/settings
 * @access Private (Super Admin)
 */
const updateSettings = asyncHandler(async (req, res, next) => {
  const { system, notifications, security, platform } = req.body;
  
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings({});
  }
  
  // Update system settings
  if (system) {
    if (system.maintenanceMode !== undefined) {
      settings.system.maintenanceMode = system.maintenanceMode;
    }
    if (system.registrationEnabled !== undefined) {
      settings.system.registrationEnabled = system.registrationEnabled;
    }
    if (system.maxUsersPerInstitution !== undefined) {
      settings.system.maxUsersPerInstitution = system.maxUsersPerInstitution;
    }
    if (system.maintenanceMessage !== undefined) {
      settings.system.maintenanceMessage = system.maintenanceMessage;
    }
  }
  
  // Update notification settings
  if (notifications) {
    if (notifications.emailNotifications !== undefined) {
      settings.notifications.emailNotifications = notifications.emailNotifications;
    }
    if (notifications.newUserAlerts !== undefined) {
      settings.notifications.newUserAlerts = notifications.newUserAlerts;
    }
    if (notifications.paymentAlerts !== undefined) {
      settings.notifications.paymentAlerts = notifications.paymentAlerts;
    }
    if (notifications.systemAlerts !== undefined) {
      settings.notifications.systemAlerts = notifications.systemAlerts;
    }
    if (notifications.adminEmail !== undefined) {
      settings.notifications.adminEmail = notifications.adminEmail;
    }
  }
  
  // Update security settings
  if (security) {
    if (security.sessionTimeout !== undefined) {
      settings.security.sessionTimeout = security.sessionTimeout;
    }
    if (security.requireEmailVerification !== undefined) {
      settings.security.requireEmailVerification = security.requireEmailVerification;
    }
    if (security.enable2FA !== undefined) {
      settings.security.enable2FA = security.enable2FA;
    }
    if (security.maxLoginAttempts !== undefined) {
      settings.security.maxLoginAttempts = security.maxLoginAttempts;
    }
    if (security.passwordMinLength !== undefined) {
      settings.security.passwordMinLength = security.passwordMinLength;
    }
  }
  
  // Update platform settings
  if (platform) {
    if (platform.siteName !== undefined) {
      settings.platform.siteName = platform.siteName;
    }
    if (platform.siteDescription !== undefined) {
      settings.platform.siteDescription = platform.siteDescription;
    }
    if (platform.supportEmail !== undefined) {
      settings.platform.supportEmail = platform.supportEmail;
    }
    if (platform.supportPhone !== undefined) {
      settings.platform.supportPhone = platform.supportPhone;
    }
  }
  
  await settings.save();
  
  // Clear settings cache to ensure fresh data
  const settingsService = require('../services/settingsService');
  settingsService.clearCache();
  
  Logger.info('Settings updated by super admin', {
    updatedBy: req.superAdmin?.email || 'unknown',
    changes: { system, notifications, security, platform }
  });
  
  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: settings
  });
});

module.exports = {
  getSettings,
  updateSettings
};
