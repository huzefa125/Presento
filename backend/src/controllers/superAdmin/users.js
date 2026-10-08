/**
 * Super Admin Controller - users
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const bcrypt = require('bcryptjs');
const Logger = require('../../utils/logger');
const superAdminService = require('../../services/superAdminService');
const User = require('../../models/User');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get Users List
 * @route GET /api/super-admin/users
 * @access Private (Super Admin)
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, plan, status, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    plan,
    status,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getUsers(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get User Details
 * @route GET /api/super-admin/users/:id
 * @access Private (Super Admin)
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await superAdminService.getUserById(id);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Update User Plan
 * @route PUT /api/super-admin/users/:id/plan
 * @access Private (Super Admin)
 */
const updateUserPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { plan, status, endDate } = req.body;
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // Warn if trying to update institution user's plan directly
  if (user.isInstitutionUser && user.institutionId && plan) {
    Logger.warn(`Attempting to update plan for institution user ${id}. Institution users should be managed through their institution.`);
    // Still allow the update, but log a warning
  }

  if (plan) {
    user.subscription.plan = plan;
  }
  if (status) {
    user.subscription.status = status;
  }
  if (endDate) {
    user.subscription.endDate = new Date(endDate);
  }

  await user.save();
  
  res.status(200).json({
    success: true,
    message: user.isInstitutionUser ? 
      'User plan updated successfully. Note: This user is linked to an institution. Changes may be overridden by institution plan.' :
      'User plan updated successfully',
    data: user
  });
});

/**
 * Update User Status
 * @route PUT /api/super-admin/users/:id/status
 * @access Private (Super Admin)
 */
const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  user.subscription.status = status;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: user
  });
});

/**
 * Create New User
 * @route POST /api/super-admin/users
 * @access Private (Super Admin)
 */
const createUser = asyncHandler(async (req, res, next) => {
  const { email, displayName, plan, status, endDate, billingCycle, password } = req.body;

  // Validation
  if (!email || !displayName) {
    throw new AppError('Email and display name are required', 400, 'VALIDATION_ERROR');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
  }

  // Validate plan
  const validPlans = ['free', 'pro', 'lifetime', 'institution'];
  if (plan && !validPlans.includes(plan)) {
    throw new AppError(`Invalid plan. Must be one of: ${validPlans.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'DUPLICATE_ENTRY');
  }

  // Calculate end date based on billing cycle
  let calculatedEndDate = null;
  if (endDate) {
    calculatedEndDate = new Date(endDate);
  } else if (billingCycle && plan !== 'free' && plan !== 'lifetime') {
    const now = new Date();
    if (billingCycle === 'monthly') {
      calculatedEndDate = new Date(now.setMonth(now.getMonth() + 1));
    } else if (billingCycle === 'yearly') {
      calculatedEndDate = new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }

  // Create user
  const userData = {
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    subscription: {
      plan: plan || 'free',
      status: status || 'active',
      startDate: new Date(),
      endDate: calculatedEndDate,
      billingCycle: billingCycle || (plan === 'lifetime' ? 'lifetime' : null)
    }
  };

  // Optionally set an initial password so the user can log in immediately
  if (password) {
    userData.password = await bcrypt.hash(password, 10);
    userData.emailVerified = true; // Admin-created accounts skip email verification
  }

  const user = new User(userData);
  await user.save();

  Logger.info('User created by super admin', {
    userId: user._id,
    email: user.email,
    plan: user.subscription.plan,
    createdBy: 'super_admin'
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUserPlan,
  updateUserStatus,
  createUser
};
