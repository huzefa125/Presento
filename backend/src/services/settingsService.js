const Settings = require('../models/Settings');
const Logger = require('../utils/logger');

let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get settings with caching
 */
const getSettings = async () => {
  try {
    const now = Date.now();
    
    // Return cached settings if still valid
    if (settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return settingsCache;
    }
    
    // Fetch fresh settings
    const settings = await Settings.getSettings();
    settingsCache = settings;
    cacheTimestamp = now;
    
    return settings;
  } catch (error) {
    Logger.error('Error getting settings:', error);
    // Return default settings on error
    return await Settings.getSettings();
  }
};

/**
 * Clear settings cache (call after updating settings)
 */
const clearCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
};

/**
 * Check if registration is enabled
 */
const isRegistrationEnabled = async () => {
  const settings = await getSettings();
  return settings.system.registrationEnabled !== false;
};

/**
 * Get max users per institution
 */
const getMaxUsersPerInstitution = async () => {
  const settings = await getSettings();
  return settings.system.maxUsersPerInstitution || 100;
};

/**
 * Get password minimum length
 */
const getPasswordMinLength = async () => {
  const settings = await getSettings();
  return settings.security.passwordMinLength || 8;
};

/**
 * Check if email verification is required
 */
const isEmailVerificationRequired = async () => {
  const settings = await getSettings();
  return settings.security.requireEmailVerification !== false;
};

/**
 * Get session timeout in minutes
 */
const getSessionTimeout = async () => {
  const settings = await getSettings();
  return settings.security.sessionTimeout || 30;
};

/**
 * Get max login attempts
 */
const getMaxLoginAttempts = async () => {
  const settings = await getSettings();
  return settings.security.maxLoginAttempts || 5;
};

/**
 * Check if email notifications are enabled
 */
const areEmailNotificationsEnabled = async () => {
  const settings = await getSettings();
  return settings.notifications.emailNotifications !== false;
};

/**
 * Get admin email for notifications
 */
const getAdminEmail = async () => {
  const settings = await getSettings();
  return settings.notifications.adminEmail || 'admin@inavora.com';
};

/**
 * Get platform settings
 */
const getPlatformSettings = async () => {
  const settings = await getSettings();
  return {
    siteName: settings.platform.siteName || 'Inavora',
    siteDescription: settings.platform.siteDescription || 'Professional presentation platform',
    supportEmail: settings.platform.supportEmail || 'support@inavora.com',
    supportPhone: settings.platform.supportPhone || '+91 9043411110'
  };
};

module.exports = {
  getSettings,
  clearCache,
  isRegistrationEnabled,
  getMaxUsersPerInstitution,
  getPasswordMinLength,
  isEmailVerificationRequired,
  getSessionTimeout,
  getMaxLoginAttempts,
  areEmailNotificationsEnabled,
  getAdminEmail,
  getPlatformSettings
};

