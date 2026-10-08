/**
 * Super Admin Controller - auth
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const jwt = require('jsonwebtoken');
const Logger = require('../../utils/logger');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');

/**
 * Login Super Admin
 * @route POST /api/super-admin/login
 * @access Public
 */
const loginSuperAdmin = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
  }

  const correctPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!correctPassword) {
    Logger.error('SUPER_ADMIN_PASSWORD not configured in environment variables');
    throw new AppError('Server configuration error. Please contact administrator.', 500, 'CONFIG_ERROR');
  }

  if (password !== correctPassword) {
    throw new AppError('Invalid password', 401, 'UNAUTHORIZED');
  }

  const token = jwt.sign(
    { 
      superAdmin: true,
      type: 'super_admin',
      timestamp: Date.now()
    },
    process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.SUPER_ADMIN_TOKEN_EXPIRES_IN || '8h' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    expiresIn: process.env.SUPER_ADMIN_TOKEN_EXPIRES_IN || '8h'
  });
});

/**
 * Verify Super Admin Token
 * @route GET /api/super-admin/verify
 * @access Private (Super Admin)
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    authenticated: true
  });
});

module.exports = {
  loginSuperAdmin,
  verifyToken
};
