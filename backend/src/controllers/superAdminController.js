const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const superAdminService = require('../services/superAdminService');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Settings = require('../models/Settings');

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

/**
 * Get Dashboard Stats
 * @route GET /api/super-admin/dashboard/stats
 * @access Private (Super Admin)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const stats = await superAdminService.getPlatformStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

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

  // Optionally create Firebase user if password is provided
  let firebaseUid = null;
  if (password) {
    try {
      const admin = require('firebase-admin');
      const firebaseUser = await admin.auth().createUser({
        email: email.toLowerCase().trim(),
        password: password,
        displayName: displayName.trim(),
        emailVerified: false
      });
      firebaseUid = firebaseUser.uid;
      userData.firebaseUid = firebaseUid;
    } catch (firebaseError) {
      Logger.error('Error creating Firebase user', firebaseError);
      // Continue with database user creation even if Firebase fails
      // The user can set up Firebase auth later
    }
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

/**
 * Create Institution (by Super Admin)
 * @route POST /api/super-admin/institutions
 * @access Private (Super Admin)
 */
const createInstitution = asyncHandler(async (req, res, next) => {
  const {
    institutionName,
    adminName,
    adminEmail,
    password,
    country,
    phoneNumber,
    institutionType,
    plan,
    billingCycle,
    customUserCount,
    status,
    endDate
  } = req.body;

  // Validation
  if (!institutionName || !adminName || !adminEmail || !password) {
    throw new AppError('Institution name, admin name, admin email, and password are required', 400, 'VALIDATION_ERROR');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
  }

  // Validate password
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
  }

  // Check if institution already exists
  const existingInstitution = await Institution.findOne({
    $or: [
      { email: adminEmail.toLowerCase() },
      { adminEmail: adminEmail.toLowerCase() }
    ]
  });

  if (existingInstitution) {
    throw new AppError('An institution with this email already exists', 409, 'DUPLICATE_ENTRY');
  }

  // Get plan details
  const INSTITUTION_PLANS = {
    'basic': {
      name: 'Basic',
      maxUsers: 10,
      price: { yearly: 548900 }
    },
    'professional': {
      name: 'Professional',
      maxUsers: 50,
      price: { yearly: 2544900 }
    },
    'enterprise': {
      name: 'Custom',
      maxUsers: null,
      price: { yearly: 49900, perUser: 49900 },
      isCustom: true,
      minUsers: 10
    }
  };

  if (!INSTITUTION_PLANS[plan]) {
    throw new AppError('Invalid institution plan selected', 400, 'VALIDATION_ERROR');
  }

  const planDetails = INSTITUTION_PLANS[plan];
  let maxUsers = planDetails.maxUsers;

  // Handle custom plan
  if (planDetails.isCustom) {
    if (!customUserCount || customUserCount < (planDetails.minUsers || 10)) {
      throw new AppError(`Minimum ${planDetails.minUsers || 10} users required for custom plan`, 400, 'VALIDATION_ERROR');
    }
    maxUsers = customUserCount;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Calculate subscription end date
  const startDate = new Date();
  let calculatedEndDate = null;
  
  if (endDate) {
    calculatedEndDate = new Date(endDate);
  } else {
    calculatedEndDate = new Date();
    if (billingCycle === 'yearly') {
      calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + 1);
    } else {
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);
    }
  }

  // Create institution (bypassing OTP and payment)
  const institution = new Institution({
    name: institutionName.trim(),
    email: adminEmail.toLowerCase().trim(),
    adminEmail: adminEmail.toLowerCase().trim(),
    adminName: adminName.trim(),
    password: hashedPassword,
    subscription: {
      plan: 'institution',
      status: status || 'active',
      startDate,
      endDate: calculatedEndDate,
      maxUsers: maxUsers,
      billingCycle: billingCycle || 'yearly',
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpayCustomerId: null
    },
    registrationStatus: 'active',
    emailVerification: {
      institutionEmailVerified: true,
      adminEmailVerified: true
    },
    registrationData: {
      country: country || null,
      phoneNumber: phoneNumber || null,
      institutionType: institutionType || null,
      billingAddress: null,
      taxId: null,
      billingEmail: adminEmail.toLowerCase()
    },
    isActive: true
  });

  await institution.save();

  // Send welcome email
  try {
    const emailService = require('../services/emailService');
    await emailService.sendInstitutionWelcomeEmail(
      institution.adminEmail,
      institution.adminName,
      institution.name
    );
  } catch (error) {
    Logger.error('Failed to send welcome email', error);
    // Don't fail creation if email fails
  }

  Logger.info('Institution created by super admin', {
    institutionId: institution._id,
    institutionName: institution.name,
    adminEmail: institution.adminEmail,
    createdBy: 'super_admin'
  });

  res.status(201).json({
    success: true,
    message: 'Institution admin account created successfully',
    data: {
      id: institution._id,
      name: institution.name,
      email: institution.email,
      adminEmail: institution.adminEmail,
      adminName: institution.adminName,
      subscription: institution.subscription
    }
  });
});

/**
 * Get Institutions List
 * @route GET /api/super-admin/institutions
 * @access Private (Super Admin)
 */
const getInstitutions = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, status, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    status,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getInstitutions(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Institution Details
 * @route GET /api/super-admin/institutions/:id
 * @access Private (Super Admin)
 */
const getInstitutionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await superAdminService.getInstitutionById(id);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Update Institution Plan
 * @route PUT /api/super-admin/institutions/:id/plan
 * @access Private (Super Admin)
 */
const updateInstitutionPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, startDate, endDate, maxUsers } = req.body;
  
  const institution = await Institution.findById(id);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'NOT_FOUND');
  }

  // Update startDate if provided
  if (startDate) {
    institution.subscription.startDate = new Date(startDate);
  }

  // Update endDate first if provided
  if (endDate) {
    institution.subscription.endDate = new Date(endDate);
    
    // Automatically recalculate status based on endDate
    // This ensures status updates correctly when endDate changes
    // Only recalculate if status is not explicitly set to 'cancelled' (cancelled should persist)
    const now = new Date();
    const newEndDate = new Date(endDate);
    // Set time to end of day for comparison
    newEndDate.setHours(23, 59, 59, 999);
    
    if (newEndDate < now) {
      // End date is in the past - set to expired (unless explicitly cancelled)
      if (status !== 'cancelled') {
        institution.subscription.status = 'expired';
      }
    } else {
      // End date is in the future - set to active (unless explicitly cancelled)
      if (status !== 'cancelled') {
        institution.subscription.status = 'active';
      }
    }
  }

  // Update status if explicitly provided (allows manual override, but endDate recalculation takes precedence)
  if (status && !endDate) {
    // Only update status if endDate wasn't provided (to avoid overriding endDate-based calculation)
    institution.subscription.status = status;
  } else if (status === 'cancelled') {
    // Always allow setting to cancelled, even if endDate is provided
    institution.subscription.status = 'cancelled';
  }

  if (maxUsers) {
    institution.subscription.maxUsers = parseInt(maxUsers);
  }

  await institution.save();
  
  res.status(200).json({
    success: true,
    message: 'Institution plan updated successfully',
    data: institution
  });
});

/**
 * Get Payments List
 * @route GET /api/super-admin/payments
 * @access Private (Super Admin)
 */
const getPayments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, status, plan, dateFrom, dateTo } = req.query;
  
  const filters = {
    status,
    plan,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getPayments(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Payment Statistics
 * @route GET /api/super-admin/payments/stats
 * @access Private (Super Admin)
 */
const getPaymentStats = asyncHandler(async (req, res, next) => {
  const stats = await superAdminService.getPaymentStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * Get Presentations List
 * @route GET /api/super-admin/presentations
 * @access Private (Super Admin)
 */
const getPresentations = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, isLive, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    isLive,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getPresentations(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Growth Trends
 * @route GET /api/super-admin/analytics/growth
 * @access Private (Super Admin)
 */
const getGrowthTrends = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;
  
  const trends = await superAdminService.getGrowthTrends(parseInt(days));
  
  res.status(200).json({
    success: true,
    data: trends
  });
});

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
  createInstitution,
  loginSuperAdmin,
  verifyToken,
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUserPlan,
  updateUserStatus,
  getInstitutions,
  getInstitutionById,
  updateInstitutionPlan,
  getPayments,
  getPaymentStats,
  getPresentations,
  getGrowthTrends,
  getSettings,
  updateSettings
};

