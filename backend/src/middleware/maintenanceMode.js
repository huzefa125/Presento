const Settings = require('../models/Settings');
const Logger = require('../utils/logger');

/**
 * Middleware to check if maintenance mode is enabled
 * Should be used after authentication but before route handlers
 */
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Allow super admin to bypass maintenance mode
    if (req.superAdmin && req.superAdmin.superAdmin === true) {
      return next();
    }

    // Allow access to health check and maintenance status endpoints
    if (req.path === '/api/health' || req.path === '/api/maintenance/status') {
      return next();
    }

    const settings = await Settings.getSettings();
    
    if (settings.system.maintenanceMode) {
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: settings.system.maintenanceMessage || 'The system is currently under maintenance. Please check back later.',
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    Logger.error('Error checking maintenance mode:', error);
    // On error, allow access (fail open) to prevent locking everyone out
    next();
  }
};

/**
 * Get maintenance mode status (public endpoint)
 */
const getMaintenanceStatus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.status(200).json({
      success: true,
      maintenance: settings.system.maintenanceMode,
      message: settings.system.maintenanceMode 
        ? (settings.system.maintenanceMessage || 'The system is currently under maintenance. Please check back later.')
        : null
    });
  } catch (error) {
    Logger.error('Error getting maintenance status:', error);
    res.status(500).json({
      success: false,
      maintenance: false,
      message: 'Unable to check maintenance status'
    });
  }
};

module.exports = {
  checkMaintenanceMode,
  getMaintenanceStatus
};

