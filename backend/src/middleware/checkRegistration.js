const settingsService = require('../services/settingsService');
const { AppError } = require('./errorHandler');

/**
 * Middleware to check if registration is enabled
 */
const checkRegistrationEnabled = async (req, res, next) => {
  try {
    const registrationEnabled = await settingsService.isRegistrationEnabled();
    
    if (!registrationEnabled) {
      throw new AppError('Registration is currently disabled. Please contact support for assistance.', 403, 'REGISTRATION_DISABLED');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkRegistrationEnabled };

