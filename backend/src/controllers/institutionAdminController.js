const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Institution = require('../models/Institution');
const User = require('../models/User');
const Presentation = require('../models/Presentation');
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const Payment = require('../models/Payment');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const { applyInstitutionPlan, removeInstitutionPlan, isInstitutionSubscriptionActive, updateInstitutionUsersPlans, getEffectivePlan } = require('../services/institutionPlanService');
const settingsService = require('../services/settingsService');

// Initialize Razorpay only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    Logger.startup('Razorpay initialized successfully for additional users payment');
  } catch (error) {
    Logger.error('Failed to initialize Razorpay', {
      message: error.message,
      error: error
    });
  }
} else {
  Logger.warn('Razorpay not initialized: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
}

// Price per additional user (₹499 in paise)
const ADDITIONAL_USER_PRICE = 49900; // ₹499 in paise

/**
 * Login Institution Admin
 * @route POST /api/institution-admin/login
 * @access Public
 */
const loginInstitutionAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
  }

  // Only allow login with admin email (the person managing the dashboard)
  const institution = await Institution.findOne({ 
    adminEmail: email.toLowerCase(),
    isActive: true
  });

  if (!institution) {
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  // Check password - support both plain text (legacy) and bcrypt hashed
  let isPasswordValid = false;
  if (institution.password && institution.password.startsWith('$2')) {
    // Password is hashed with bcrypt
    isPasswordValid = await bcrypt.compare(password, institution.password);
  } else {
    // Plain text password (legacy support)
    isPasswordValid = password === institution.password;
  }

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  const token = jwt.sign(
    { 
      institutionAdmin: true,
      institutionId: institution._id.toString(),
      email: institution.adminEmail,
      type: 'institution_admin',
      timestamp: Date.now()
    },
    process.env.JWT_SECRET
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    institution: {
      id: institution._id,
      name: institution.name,
      email: institution.email,
      adminEmail: institution.adminEmail,
      adminName: institution.adminName
    }
  });
});

/**
 * Check if email belongs to an institution admin
 * @route POST /api/institution-admin/check
 * @access Public
 */
const checkInstitutionAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  // Check if email belongs to an institution admin (only admin email can login)
  const institution = await Institution.findOne({
    adminEmail: email.toLowerCase(),
    isActive: true
  }).select('_id name email adminEmail').lean();

  if (institution) {
    return res.status(200).json({
      success: true,
      isInstitutionAdmin: true,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        adminEmail: institution.adminEmail
      }
    });
  }

  res.status(200).json({
    success: true,
    isInstitutionAdmin: false
  });
});

/**
 * Verify Institution Admin Token
 * @route GET /api/institution-admin/verify
 * @access Private (Institution Admin)
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  // Get fresh institution data with subscription
  const institution = await Institution.findById(req.institution._id)
    .select('-password -__v')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Token is valid',
    authenticated: true,
    institution: {
      id: institution._id,
      name: institution.name,
      email: institution.email,
      adminEmail: institution.adminEmail,
      adminName: institution.adminName,
      subscription: institution.subscription || {
        plan: 'institution',
        status: 'active',
        billingCycle: 'yearly',
        maxUsers: 10,
        currentUsers: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      branding: institution.branding || {
        primaryColor: '#3b82f6',
        secondaryColor: '#14b8a6',
        logoUrl: null,
        customDomain: null
      },
      settings: institution.settings || {
        aiFeaturesEnabled: true,
        exportEnabled: true,
        watermarkEnabled: false,
        analyticsEnabled: true
      },
      securitySettings: institution.securitySettings || {
        twoFactorEnabled: false,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: false,
        sessionTimeout: 30,
        requireEmailVerification: true
      }
    }
  });
});

/**
 * Get Dashboard Statistics
 * @route GET /api/institution-admin/dashboard/stats
 * @access Private (Institution Admin)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;

  const totalUsers = await User.countDocuments({ 
    institutionId,
    isInstitutionUser: true 
  });

  const institutionUsers = await User.find({ 
    institutionId,
    isInstitutionUser: true 
  }).select('_id').lean();

  const userIds = institutionUsers.map(user => user._id);

  const totalPresentations = await Presentation.countDocuments({ 
    userId: { $in: userIds } 
  });

  const livePresentations = await Presentation.countDocuments({ 
    userId: { $in: userIds },
    isLive: true 
  });

  const presentations = await Presentation.find({ 
    userId: { $in: userIds } 
  }).select('_id').lean();

  const presentationIds = presentations.map(p => p._id);
  const totalSlides = await Slide.countDocuments({ 
    presentationId: { $in: presentationIds } 
  });

  const totalResponses = await Response.countDocuments({ 
    presentationId: { $in: presentationIds } 
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await Presentation.distinct('userId', {
    userId: { $in: userIds },
    createdAt: { $gte: thirtyDaysAgo }
  });

  const recentPresentations = await Presentation.countDocuments({
    userId: { $in: userIds },
    createdAt: { $gte: thirtyDaysAgo }
  });

  const recentResponses = await Response.countDocuments({
    presentationId: { $in: presentationIds },
    submittedAt: { $gte: thirtyDaysAgo }
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalPresentations,
      livePresentations,
      totalSlides,
      totalResponses,
      activeUsers: activeUsers.length,
      recentPresentations,
      recentResponses
    }
  });
});

/**
 * Get All Institution Users
 * @route GET /api/institution-admin/users
 * @access Private (Institution Admin)
 */
const getInstitutionUsers = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { page = 1, limit = 20, search = '' } = req.query;

  const query = {
    institutionId,
    isInstitutionUser: true
  };

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(query)
    .select('-__v')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(query);

  const userIds = users.map(u => u._id);
  const presentationCounts = await Presentation.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);
  const presentationCountMap = new Map(presentationCounts.map(pc => [pc._id.toString(), pc.count]));

  const presentationIds = await Presentation.find({ userId: { $in: userIds } }).select('_id').lean();
  const pidArray = presentationIds.map(p => p._id);
  const slideCounts = await Slide.aggregate([
    { $match: { presentationId: { $in: pidArray } } },
    { $group: { _id: '$presentationId', count: { $sum: 1 } } }
  ]);
  const userSlideCountMap = new Map();
  presentationIds.forEach(p => {
    const userId = p.userId?.toString();
    if (userId) {
      const slideCount = slideCounts.filter(sc => sc._id.toString() === p._id.toString()).reduce((sum, sc) => sum + sc.count, 0);
      userSlideCountMap.set(userId, (userSlideCountMap.get(userId) || 0) + slideCount);
    }
  });

  // Get effective plans for all users
  const usersWithStats = await Promise.all(users.map(async (user) => {
    let subscription = user.subscription;
    if (user.isInstitutionUser && user.institutionId) {
      try {
        const effectivePlan = await getEffectivePlan(user);
        subscription = {
          ...user.subscription,
          plan: effectivePlan.plan,
          status: effectivePlan.status,
          endDate: effectivePlan.endDate
        };
      } catch (error) {
        Logger.error(`Error getting effective plan for user ${user._id}`, error);
      }
    }
    
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      subscription: subscription,
      presentationCount: presentationCountMap.get(user._id.toString()) || 0,
      slideCount: userSlideCountMap.get(user._id.toString()) || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }));

  res.status(200).json({
    success: true,
    data: {
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * Add User to Institution
 * @route POST /api/institution-admin/users
 * @access Private (Institution Admin)
 */
const addInstitutionUser = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if institution subscription is active
  if (!isInstitutionSubscriptionActive(institution)) {
    throw new AppError('Institution subscription is not active. Please renew your subscription to add users.', 400, 'SUBSCRIPTION_INACTIVE');
  }

  const currentUserCount = await User.countDocuments({ 
    institutionId,
    isInstitutionUser: true 
  });

  // Check system-wide max users per institution setting
  const maxUsersPerInstitution = await settingsService.getMaxUsersPerInstitution();
  
  if (currentUserCount >= maxUsersPerInstitution) {
    throw new AppError(`User limit reached. Maximum ${maxUsersPerInstitution} users allowed per institution.`, 400, 'LIMIT_REACHED');
  }

  // Also check institution-specific limit
  if (currentUserCount >= institution.subscription.maxUsers) {
    throw new AppError(`User limit reached. Maximum ${institution.subscription.maxUsers} users allowed.`, 400, 'LIMIT_REACHED');
  }

  // IMPORTANT: Only link existing users, do not create new accounts
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError('User account not found. The user must first create an account on the platform before they can be added to the institution.', 404, 'USER_NOT_FOUND');
  }

  // Check if user already belongs to this institution
  if (user.institutionId && user.institutionId.toString() === institutionId.toString()) {
    throw new AppError('User already exists in this institution', 400, 'DUPLICATE_ENTRY');
  }

  // Check if user belongs to another institution
  if (user.institutionId && user.institutionId.toString() !== institutionId.toString()) {
    throw new AppError('User already belongs to another institution. Please remove them from the other institution first.', 400, 'USER_IN_OTHER_INSTITUTION');
  }

  // Apply institution plan to user (gives them institution plan benefits)
  await applyInstitutionPlan(user, institution);

  // Update institution user count
  institution.subscription.currentUsers = currentUserCount + 1;
  await institution.save();

  // Emit real-time notification to user if they're online
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${user._id}`).emit('plan-updated', {
      plan: 'institution',
      source: 'institution',
      institutionId: institution._id,
      institutionName: institution.name,
      message: 'You have been granted institution plan access through your institution'
    });
  }

  // Log audit
  if (!institution.auditLogs) {
    institution.auditLogs = [];
  }
  institution.auditLogs.push({
    timestamp: new Date(),
    action: 'user_added',
    user: req.institutionAdmin?.email || req.institution?.adminEmail || 'System',
    details: `User ${user.email} added to institution and granted institution plan access`,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  await institution.save();

  res.status(201).json({
    success: true,
    message: 'User added successfully and granted institution plan access',
    data: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      plan: 'institution', // Institution users get institution plan
      institutionPlanActive: true
    }
  });
});

/**
 * Remove User from Institution
 * @route DELETE /api/institution-admin/users/:userId
 * @access Private (Institution Admin)
 */
const removeInstitutionUser = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { userId } = req.params;

  const user = await User.findOne({ 
    _id: userId,
    institutionId,
    isInstitutionUser: true 
  });

  if (!user) {
    throw new AppError('User not found in this institution', 404, 'RESOURCE_NOT_FOUND');
  }

  // Remove institution plan and restore original plan
  await removeInstitutionPlan(user);

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  institution.subscription.currentUsers = Math.max(0, (institution.subscription.currentUsers || 0) - 1);
  await institution.save();

  // Log audit
  if (!institution.auditLogs) {
    institution.auditLogs = [];
  }
  institution.auditLogs.push({
    timestamp: new Date(),
    action: 'user_removed',
    user: req.institutionAdmin?.email || req.institution?.adminEmail || 'System',
    details: `User ${user.email} removed from institution. Plan reverted to original.`,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  await institution.save();

  // Emit real-time notification to user if they're online
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${user._id}`).emit('plan-updated', {
      plan: user.subscription.plan,
      source: 'personal',
      message: 'Your institution plan access has been removed. Your plan has been reverted to your original subscription.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User removed successfully'
  });
});

/**
 * Get All Presentations by Institution Users
 * @route GET /api/institution-admin/presentations
 * @access Private (Institution Admin)
 */
const getInstitutionPresentations = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { page = 1, limit = 20, search = '', status = 'all', userId } = req.query;

  // Get all users that are properly linked to this institution
  // Must have both institutionId matching AND isInstitutionUser flag set
  const institutionUsers = await User.find({ 
    institutionId: mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId,
    isInstitutionUser: true 
  }).select('_id email displayName institutionId').lean();

  // Also get admin user account if it exists and verify it belongs to this institution
  const adminEmail = req.institutionAdmin?.email || req.institution?.adminEmail;
  let adminUser = null;
  if (adminEmail) {
    adminUser = await User.findOne({ 
      email: adminEmail.toLowerCase(),
      institutionId: mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId
    }).select('_id email displayName institutionId isInstitutionUser').lean();
    
    // Only add admin user if it actually belongs to this institution
    // Must have matching institutionId (already filtered in query above)
    if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
      const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
      if (!adminInList) {
        institutionUsers.push({
          _id: adminUser._id,
          email: adminUser.email,
          displayName: adminUser.displayName,
          institutionId: adminUser.institutionId
        });
      }
    }
  }

  // Only include userIds from users that are confirmed to belong to this institution
  const userIds = institutionUsers
    .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
    .map(user => user._id);
  
  const userMap = new Map(institutionUsers
    .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
    .map(user => [user._id.toString(), user]));

  // If userId is provided, filter by that specific user (for "My Presentations")
  // Otherwise, show all institution users' presentations
  let query;
  if (userId) {
    // Verify the userId belongs to this institution
    // Only allow if the user is in the verified institutionUsers list with matching institutionId
    const targetUser = institutionUsers.find(u => 
      u._id.toString() === userId.toString() && 
      u.institutionId && 
      u.institutionId.toString() === institutionId.toString()
    );
    
    if (!targetUser) {
      // User not found or doesn't belong to this institution, return empty result
      return res.status(200).json({
        success: true,
        data: {
          presentations: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    // Convert userId string to ObjectId for MongoDB query
    query = { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId };
  } else {
    // Only query presentations from users that are confirmed to belong to this institution
    if (userIds.length === 0) {
      // No valid institution users, return empty result
      return res.status(200).json({
        success: true,
        data: {
          presentations: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    query = { userId: { $in: userIds } };
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (status === 'live') {
    query.isLive = true;
  } else if (status === 'ended') {
    query.isLive = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const presentations = await Presentation.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Presentation.countDocuments(query);

  const presentationIds = presentations.map(p => p._id);
  const slideCounts = await Slide.aggregate([
    { $match: { presentationId: { $in: presentationIds } } },
    { $group: { _id: '$presentationId', count: { $sum: 1 } } }
  ]);
  const slideCountMap = new Map(slideCounts.map(sc => [sc._id.toString(), sc.count]));

  const responseCounts = await Response.aggregate([
    { $match: { presentationId: { $in: presentationIds } } },
    { $group: { _id: '$presentationId', count: { $sum: 1 } } }
  ]);
  const responseCountMap = new Map(responseCounts.map(rc => [rc._id.toString(), rc.count]));

  const presentationsWithStats = presentations.map((presentation) => {
    const user = userMap.get(presentation.userId.toString());
    return {
      id: presentation._id,
      title: presentation.title,
      accessCode: presentation.accessCode,
      isLive: presentation.isLive,
      currentSlideIndex: presentation.currentSlideIndex,
      showResults: presentation.showResults,
      slideCount: slideCountMap.get(presentation._id.toString()) || 0,
      responseCount: responseCountMap.get(presentation._id.toString()) || 0,
      createdBy: {
        id: user?._id,
        email: user?.email,
        displayName: user?.displayName
      },
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt
    };
  });

  res.status(200).json({
    success: true,
    data: {
      presentations: presentationsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * Get Admin User Account
 * @route GET /api/institution-admin/my-account
 * @access Private (Institution Admin)
 */
const getAdminUserAccount = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const adminEmail = req.institutionAdmin?.email || req.institution?.adminEmail;

  if (!adminEmail) {
    throw new AppError('Admin email not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // First, try to find user by email and institutionId
  let user = await User.findOne({ 
    email: adminEmail.toLowerCase(),
    institutionId 
  }).select('_id email displayName').lean();

  // If not found, try to find by email only (user might exist but not be linked to institution yet)
  if (!user) {
    user = await User.findOne({ 
      email: adminEmail.toLowerCase()
    }).select('_id email displayName institutionId').lean();
    
    // If user exists but doesn't belong to this institution, still return it
    // (they might be the admin but the account wasn't properly linked)
    if (user && user.institutionId && user.institutionId.toString() !== institutionId.toString()) {
      // User belongs to different institution, don't return it
      user = null;
    }
  }

  if (!user) {
    // Admin might not have a user account yet, return null
    return res.status(200).json({
      success: true,
      data: {
        userId: null,
        email: adminEmail,
        hasUserAccount: false
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      hasUserAccount: true
    }
  });
});

/**
 * Get Analytics Data
 * @route GET /api/institution-admin/analytics
 * @access Private (Institution Admin)
 */
const getAnalytics = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { period = '30' } = req.query;

  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const institutionUsers = await User.find({ 
    institutionId,
    isInstitutionUser: true 
  }).select('_id').lean();

  const userIds = institutionUsers.map(user => user._id);

  const presentations = await Presentation.find({
    userId: { $in: userIds },
    createdAt: { $gte: startDate }
  }).select('_id createdAt').lean();

  const presentationIds = presentations.map(p => p._id);

  const responses = await Response.find({
    presentationId: { $in: presentationIds },
    submittedAt: { $gte: startDate }
  }).select('submittedAt').lean();

  const presentationStats = {};
  const responseStats = {};

  presentations.forEach(presentation => {
    const date = presentation.createdAt.toISOString().split('T')[0];
    presentationStats[date] = (presentationStats[date] || 0) + 1;
  });

  responses.forEach(response => {
    if (response.submittedAt) {
      const date = response.submittedAt.toISOString().split('T')[0];
      responseStats[date] = (responseStats[date] || 0) + 1;
    }
  });

  const topPresentations = await Response.aggregate([
    {
      $match: {
        presentationId: { $in: presentationIds },
        submittedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$presentationId',
        responseCount: { $sum: 1 }
      }
    },
    {
      $sort: { responseCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  const topPresentationIds = topPresentations.map(tp => tp._id);
  const topPresentationDetails = await Presentation.find({
    _id: { $in: topPresentationIds }
  }).select('title accessCode').lean();

  const topPresentationsWithDetails = topPresentations.map(tp => {
    const details = topPresentationDetails.find(p => p._id.toString() === tp._id.toString());
    return {
      presentationId: tp._id,
      title: details?.title || 'Unknown',
      accessCode: details?.accessCode || 'N/A',
      responseCount: tp.responseCount
    };
  });

  res.status(200).json({
    success: true,
    data: {
      period: days,
      presentationStats,
      responseStats,
      topPresentations: topPresentationsWithDetails,
      totalPresentations: presentations.length,
      totalResponses: responses.length
    }
  });
});

/**
 * Update Institution Branding
 * @route PUT /api/institution-admin/branding
 * @access Private (Institution Admin)
 */
const updateBranding = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { primaryColor, secondaryColor, logoUrl, customDomain } = req.body;

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (primaryColor) institution.branding.primaryColor = primaryColor;
  if (secondaryColor) institution.branding.secondaryColor = secondaryColor;
  if (logoUrl !== undefined) institution.branding.logoUrl = logoUrl;
  if (customDomain !== undefined) institution.branding.customDomain = customDomain;

  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Branding updated successfully',
    data: {
      branding: institution.branding
    }
  });
});

/**
 * Upload Logo for Institution Branding
 * @route POST /api/institution-admin/branding/upload-logo
 * @access Private (Institution Admin)
 */
const uploadLogo = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { image } = req.body;

  if (!image) {
    throw new AppError('Image data is required', 400, 'VALIDATION_ERROR');
  }

  if (!image.startsWith('data:image/')) {
    throw new AppError('Invalid image format. Must be base64 encoded image.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (image.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 10) {
    throw new AppError(`Image too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB.`, 400, 'VALIDATION_ERROR');
  }

  const cloudinaryService = require('../services/cloudinaryService');
  const result = await cloudinaryService.uploadImage(image, 'inavora/institution-logos');

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  institution.branding.logoUrl = result.url;
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Logo uploaded successfully',
    data: {
      logoUrl: result.url,
      publicId: result.publicId
    }
  });
});

/**
 * Update Institution Settings
 * @route PUT /api/institution-admin/settings
 * @access Private (Institution Admin)
 */
const updateSettings = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { aiFeaturesEnabled, exportEnabled, watermarkEnabled, analyticsEnabled } = req.body;

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (aiFeaturesEnabled !== undefined) institution.settings.aiFeaturesEnabled = aiFeaturesEnabled;
  if (exportEnabled !== undefined) institution.settings.exportEnabled = exportEnabled;
  if (watermarkEnabled !== undefined) institution.settings.watermarkEnabled = watermarkEnabled;
  if (analyticsEnabled !== undefined) institution.settings.analyticsEnabled = analyticsEnabled;

  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      settings: institution.settings
    }
  });
});

/**
 * Export Data
 * @route GET /api/institution-admin/export
 * @access Private (Institution Admin)
 */
const exportData = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { type = 'presentations', format = 'json' } = req.query;

  if (!['presentations', 'users'].includes(type)) {
    throw new AppError('Invalid export type', 400, 'VALIDATION_ERROR');
  }

  if (!['json', 'csv', 'excel'].includes(format)) {
    throw new AppError('Invalid export format. Use: json, csv, or excel', 400, 'VALIDATION_ERROR');
  }

  const institutionUsers = await User.find({ 
    institutionId,
    isInstitutionUser: true 
  }).select('_id email displayName').lean();

  const userIds = institutionUsers.map(user => user._id);

  if (type === 'presentations') {
    const presentations = await Presentation.find({ userId: { $in: userIds } })
      .populate('userId', 'email displayName')
      .sort({ createdAt: -1 })
      .lean();

    const presentationIds = presentations.map(p => p._id);
    const slideCounts = await Slide.aggregate([
      { $match: { presentationId: { $in: presentationIds } } },
      { $group: { _id: '$presentationId', count: { $sum: 1 } } }
    ]);
    const slideCountMap = new Map(slideCounts.map(sc => [sc._id.toString(), sc.count]));

    const responseCounts = await Response.aggregate([
      { $match: { presentationId: { $in: presentationIds } } },
      { $group: { _id: '$presentationId', count: { $sum: 1 } } }
    ]);
    const responseCountMap = new Map(responseCounts.map(rc => [rc._id.toString(), rc.count]));

    const presentationsData = presentations.map((presentation) => ({
      Title: presentation.title,
      'Access Code': presentation.accessCode,
      'Is Live': presentation.isLive ? 'Yes' : 'No',
      'Slide Count': slideCountMap.get(presentation._id.toString()) || 0,
      'Response Count': responseCountMap.get(presentation._id.toString()) || 0,
      'Created By': presentation.userId?.email || 'Unknown',
      'Created At': new Date(presentation.createdAt).toLocaleString(),
      'Updated At': new Date(presentation.updatedAt).toLocaleString()
    }));

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          type: 'presentations',
          exportedAt: new Date(),
          count: presentationsData.length,
          presentations: presentationsData
        }
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(presentationsData[0] || {});
      const csvRows = [
        headers.join(','),
        ...presentationsData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];
      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=institution-presentations-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    } else if (format === 'excel') {
      // Convert to Excel
      const worksheet = XLSX.utils.json_to_sheet(presentationsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Presentations');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=institution-presentations-${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(excelBuffer);
    }
  } else {
    const userIdsArray = institutionUsers.map(u => u._id);
    const presentationCounts = await Presentation.aggregate([
      { $match: { userId: { $in: userIdsArray } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const presentationCountMap = new Map(presentationCounts.map(pc => [pc._id.toString(), pc.count]));

    const usersData = institutionUsers.map((user) => ({
      Email: user.email,
      'Display Name': user.displayName || '',
      'Presentation Count': presentationCountMap.get(user._id.toString()) || 0,
      'Created At': new Date(user.createdAt).toLocaleString()
    }));

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          type: 'users',
          exportedAt: new Date(),
          count: usersData.length,
          users: usersData
        }
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(usersData[0] || {});
      const csvRows = [
        headers.join(','),
        ...usersData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];
      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=institution-users-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    } else if (format === 'excel') {
      // Convert to Excel
      const worksheet = XLSX.utils.json_to_sheet(usersData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=institution-users-${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(excelBuffer);
    }
  }
});

/**
 * Bulk Import Users
 * @route POST /api/institution-admin/users/bulk-import
 * @access Private (Institution Admin)
 */
const bulkImportUsers = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  
  if (!req.file) {
    throw new AppError('CSV file is required', 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Parse CSV file
  const csvContent = req.file.buffer.toString('utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new AppError('CSV file must contain at least a header and one data row', 400, 'VALIDATION_ERROR');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const emailIndex = headers.findIndex(h => h === 'email' || h === 'email address');
  const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('display'));

  if (emailIndex === -1) {
    throw new AppError('CSV must contain an "email" column', 400, 'VALIDATION_ERROR');
  }

  const currentUserCount = await User.countDocuments({ 
    institutionId,
    isInstitutionUser: true 
  });

  let added = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const email = values[emailIndex];
    const displayName = values[nameIndex] || email.split('@')[0];

    if (!email || !email.includes('@')) {
      skipped++;
      errors.push(`Row ${i + 1}: Invalid email`);
      continue;
    }

    if (currentUserCount + added >= institution.subscription.maxUsers) {
      errors.push(`Row ${i + 1} and beyond: User limit reached`);
      break;
    }

    try {
      let user = await User.findOne({ email: email.toLowerCase() });

      if (user && user.isInstitutionUser && user.institutionId?.toString() === institutionId.toString()) {
        skipped++;
        continue;
      }

      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          displayName,
          institutionId,
          isInstitutionUser: true,
          subscription: {
            plan: 'institution',
            status: 'active'
          }
        });
      } else {
        user.institutionId = institutionId;
        user.isInstitutionUser = true;
        user.subscription.plan = 'institution';
        user.subscription.status = 'active';
        if (!user.displayName) {
          user.displayName = displayName;
        }
      }

      await user.save();
      added++;

      // Log audit
      if (!institution.auditLogs) {
        institution.auditLogs = [];
      }
      institution.auditLogs.push({
        timestamp: new Date(),
        action: 'user_added',
        user: req.institutionAdmin?.email || 'System',
        details: `User ${email} added via bulk import`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      });
    } catch (error) {
      skipped++;
      errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  if (added > 0) {
    await institution.save();
  }

  res.status(200).json({
    success: true,
    message: `Bulk import completed. ${added} users added, ${skipped} skipped.`,
    data: {
      added,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

/**
 * Get Audit Logs
 * @route GET /api/institution-admin/audit-logs
 * @access Private (Institution Admin)
 */
const getAuditLogs = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const institution = await Institution.findById(req.institutionId);

  let logs = institution.auditLogs || [];

  // Filter by date range if provided
  if (startDate || endDate) {
    logs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (startDate && logDate < new Date(startDate)) return false;
      if (endDate && logDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Sort by timestamp descending (most recent first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit to last 100 logs for performance
  logs = logs.slice(0, 100);

  res.status(200).json({
    success: true,
    logs
  });
});

/**
 * Get API Keys
 * @route GET /api/institution-admin/api-keys
 * @access Private (Institution Admin)
 */
const getApiKeys = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findById(req.institutionId);
  const apiKeys = institution.apiKeys || [];

  res.status(200).json({
    success: true,
    keys: apiKeys
  });
});

/**
 * Create API Key
 * @route POST /api/institution-admin/api-keys
 * @access Private (Institution Admin)
 */
const createApiKey = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!name) {
    throw new AppError('API key name is required', 400, 'VALIDATION_ERROR');
  }

  // Generate API key (in production, use crypto.randomBytes)
  const apiKey = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  const newApiKey = {
    id: Date.now().toString(),
    name,
    key: apiKey,
    active: true,
    createdAt: new Date()
  };

  if (!institution.apiKeys) {
    institution.apiKeys = [];
  }
  institution.apiKeys.push(newApiKey);
  await institution.save();

  res.status(201).json({
    success: true,
    key: newApiKey
  });
});

/**
 * Delete API Key
 * @route DELETE /api/institution-admin/api-keys/:keyId
 * @access Private (Institution Admin)
 */
const deleteApiKey = asyncHandler(async (req, res, next) => {
  const { keyId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.apiKeys) {
    institution.apiKeys = [];
  }

  institution.apiKeys = institution.apiKeys.filter(key => key.id !== keyId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'API key deleted successfully'
  });
});

/**
 * Get Webhooks
 * @route GET /api/institution-admin/webhooks
 * @access Private (Institution Admin)
 */
const getWebhooks = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findById(req.institutionId);
  const webhooks = institution.webhooks || [];

  res.status(200).json({
    success: true,
    webhooks
  });
});

/**
 * Create Webhook
 * @route POST /api/institution-admin/webhooks
 * @access Private (Institution Admin)
 */
const createWebhook = asyncHandler(async (req, res, next) => {
  const { url, events, secret } = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!url) {
    throw new AppError('Webhook URL is required', 400, 'VALIDATION_ERROR');
  }

  const newWebhook = {
    id: Date.now().toString(),
    url,
    events: events || [],
    secret: secret || '',
    active: true,
    createdAt: new Date()
  };

  if (!institution.webhooks) {
    institution.webhooks = [];
  }
  institution.webhooks.push(newWebhook);
  await institution.save();

  res.status(201).json({
    success: true,
    webhook: newWebhook
  });
});

/**
 * Delete Webhook
 * @route DELETE /api/institution-admin/webhooks/:webhookId
 * @access Private (Institution Admin)
 */
const deleteWebhook = asyncHandler(async (req, res, next) => {
  const { webhookId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.webhooks) {
    institution.webhooks = [];
  }

  institution.webhooks = institution.webhooks.filter(webhook => webhook.id !== webhookId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Webhook deleted successfully'
  });
});

/**
 * Get Custom Reports
 * @route GET /api/institution-admin/custom-reports
 * @access Private (Institution Admin)
 */
const getCustomReports = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findById(req.institutionId);
  const reports = institution.customReports || [];

  res.status(200).json({
    success: true,
    reports
  });
});

/**
 * Create Custom Report
 * @route POST /api/institution-admin/custom-reports
 * @access Private (Institution Admin)
 */
const createCustomReport = asyncHandler(async (req, res, next) => {
  const reportConfig = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!reportConfig.name || !reportConfig.metrics || reportConfig.metrics.length === 0) {
    throw new AppError('Report name and at least one metric are required', 400, 'VALIDATION_ERROR');
  }

  const newReport = {
    id: Date.now().toString(),
    ...reportConfig,
    createdAt: new Date()
  };

  if (!institution.customReports) {
    institution.customReports = [];
  }
  institution.customReports.push(newReport);
  await institution.save();

  res.status(201).json({
    success: true,
    report: newReport
  });
});

/**
 * Generate Custom Report
 * @route POST /api/institution-admin/custom-reports/:reportId/generate
 * @access Private (Institution Admin)
 */
const generateCustomReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.customReports) {
    institution.customReports = [];
  }

  const report = institution.customReports.find(r => r.id === reportId);
  if (!report) {
    throw new AppError('Custom report not found', 404, 'NOT_FOUND');
  }

  // For now, return a simple PDF placeholder
  // In production, generate actual PDF/Excel based on report config using libraries like pdfkit or jsPDF
  const pdfPlaceholder = Buffer.from('PDF placeholder - Implement actual PDF generation');
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=custom-report-${report.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  res.send(pdfPlaceholder);
});

/**
 * Delete Custom Report
 * @route DELETE /api/institution-admin/custom-reports/:reportId
 * @access Private (Institution Admin)
 */
const deleteCustomReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.customReports) {
    institution.customReports = [];
  }

  institution.customReports = institution.customReports.filter(r => r.id !== reportId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Custom report deleted successfully'
  });
});

/**
 * Generate Report
 * @route POST /api/institution-admin/reports/generate
 * @access Private (Institution Admin)
 */
const generateReport = asyncHandler(async (req, res, next) => {
  const { type, format, schedule, email, frequency } = req.body;
  const institutionId = req.institutionId;

  if (!type || !format) {
    throw new AppError('Report type and format are required', 400, 'VALIDATION_ERROR');
  }

  // For scheduled reports, store the configuration
  if (schedule && schedule !== 'none' && email) {
    const institution = await Institution.findById(institutionId);
    if (!institution.scheduledReports) {
      institution.scheduledReports = [];
    }
    institution.scheduledReports.push({
      type,
      format,
      schedule,
      email,
      frequency,
      createdAt: new Date()
    });
    await institution.save();

    return res.status(200).json({
      success: true,
      message: 'Report scheduled successfully'
    });
  }

  // For immediate download, generate and return the file
  // This is a placeholder - in production, generate actual PDF/Excel
  const fileBuffer = Buffer.from(`Report: ${type} in ${format} format`);
  
  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
  } else {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  
  res.send(fileBuffer);
});

/**
 * Update Security Settings
 * @route PUT /api/institution-admin/security-settings
 * @access Private (Institution Admin)
 */
const updateSecuritySettings = asyncHandler(async (req, res, next) => {
  const securitySettings = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.securitySettings) {
    institution.securitySettings = {};
  }

  Object.assign(institution.securitySettings, securitySettings);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Security settings updated successfully',
    securitySettings: institution.securitySettings
  });
});

/**
 * Get Payment History
 * @route GET /api/institution-admin/payments
 * @access Private (Institution Admin)
 */
const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const Payment = require('../models/Payment');

  const payments = await Payment.find({ institutionId })
    .sort({ createdAt: -1 })
    .select('-razorpaySignature')
    .lean();

  res.status(200).json({
    success: true,
    payments: payments.map(payment => ({
      id: payment._id,
      amount: payment.amount,
      currency: payment.currency || 'INR',
      plan: payment.plan,
      status: payment.status,
      orderId: payment.razorpayOrderId,
      paymentId: payment.razorpayPaymentId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      metadata: payment.metadata || {}
    }))
  });
});

/**
 * Get Subscription Details
 * @route GET /api/institution-admin/subscription
 * @access Private (Institution Admin)
 */
const getSubscriptionDetails = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const institution = await Institution.findById(institutionId);
  
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const subscription = institution.subscription || {};
  const now = new Date();
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const startDate = subscription.startDate ? new Date(subscription.startDate) : null;
  
  // Calculate subscription status
  const isActive = subscription.status === 'active' && endDate && endDate > now;
  const isExpired = subscription.status === 'expired' || (endDate && endDate < now);
  const daysRemaining = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;

  // Get current user count
  const User = require('../models/User');
  const currentUserCount = await User.countDocuments({ 
    institutionId, 
    isInstitutionUser: true 
  });

  // Determine plan name
  const getPlanName = (maxUsers) => {
    if (!maxUsers) return 'Institution';
    if (maxUsers === 10) return 'Basic';
    if (maxUsers === 50) return 'Professional';
    return 'Custom';
  };

  const planName = getPlanName(subscription.maxUsers);

  // Get plan details from INSTITUTION_PLANS
  let planDetails = null;
  if (subscription.maxUsers === 10) {
    planDetails = INSTITUTION_PLANS.basic;
  } else if (subscription.maxUsers === 50) {
    planDetails = INSTITUTION_PLANS.professional;
  } else if (subscription.maxUsers > 50) {
    planDetails = INSTITUTION_PLANS.enterprise;
  }

  res.status(200).json({
    success: true,
    subscription: {
      plan: subscription.plan || 'institution',
      planName: planName,
      status: subscription.status || 'active',
      billingCycle: subscription.billingCycle || 'yearly',
      startDate: startDate,
      endDate: endDate,
      maxUsers: subscription.maxUsers || 10,
      currentUsers: currentUserCount,
      isActive: isActive,
      isExpired: isExpired,
      daysRemaining: daysRemaining !== null ? Math.max(0, daysRemaining) : null,
      planDetails: planDetails ? {
        name: planDetails.name,
        maxUsers: planDetails.maxUsers,
        prices: planDetails.price, // Note: price is already an object with yearly/perUser
        features: planDetails.features,
        badge: planDetails.badge || null,
        isCustom: planDetails.isCustom || false,
        minUsers: planDetails.minUsers || null
      } : null
    }
  });
});

/**
 * Get Subscription Status (Lightweight for real-time updates)
 * @route GET /api/institution-admin/subscription/status
 * @access Private (Institution Admin)
 */
const getSubscriptionStatus = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const institution = await Institution.findById(institutionId).select('subscription');
  
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const subscription = institution.subscription || {};
  const now = new Date();
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  
  const isActive = subscription.status === 'active' && endDate && endDate > now;
  const isExpired = subscription.status === 'expired' || (endDate && endDate < now);
  const daysRemaining = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;

  // Get current user count
  const User = require('../models/User');
  const currentUserCount = await User.countDocuments({ 
    institutionId, 
    isInstitutionUser: true 
  });

  res.status(200).json({
    success: true,
    status: {
      isActive: isActive,
      isExpired: isExpired,
      status: subscription.status || 'active',
      daysRemaining: daysRemaining !== null ? Math.max(0, daysRemaining) : null,
      maxUsers: subscription.maxUsers || 10,
      currentUsers: currentUserCount,
      usagePercent: subscription.maxUsers ? ((currentUserCount / subscription.maxUsers) * 100) : 0,
      endDate: endDate,
      lastUpdated: new Date()
    }
  });
});

/**
 * Get Usage Statistics
 * @route GET /api/institution-admin/subscription/usage
 * @access Private (Institution Admin)
 */
const getUsageStatistics = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const institution = await Institution.findById(institutionId).select('subscription');
  
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const User = require('../models/User');
  const Presentation = require('../models/Presentation');
  
  // Get user count
  const totalUsers = await User.countDocuments({ 
    institutionId, 
    isInstitutionUser: true 
  });

  // Get active users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUsers = await User.countDocuments({
    institutionId,
    isInstitutionUser: true,
    lastLogin: { $gte: thirtyDaysAgo }
  });

  // Get presentations count
  const institutionUsers = await User.find({ 
    institutionId, 
    isInstitutionUser: true 
  }).select('_id').lean();
  const userIds = institutionUsers.map(u => u._id);
  
  const totalPresentations = await Presentation.countDocuments({
    userId: { $in: userIds }
  });

  // Get total responses
  const totalResponses = await Presentation.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$responseCount', 0] } } } }
  ]);

  const subscription = institution.subscription || {};
  const maxUsers = subscription.maxUsers || 10;
  const userUsagePercent = maxUsers ? ((totalUsers / maxUsers) * 100) : 0;

  res.status(200).json({
    success: true,
    usage: {
      totalUsers: totalUsers,
      activeUsers: activeUsers || 0,
      maxUsers: maxUsers,
      userUsagePercent: Math.min(100, userUsagePercent),
      totalPresentations: totalPresentations,
      totalResponses: totalResponses[0]?.total || 0,
      lastUpdated: new Date()
    }
  });
});

/**
 * Validate Users Before Payment - Check which users already exist
 * @route POST /api/institution-admin/users/validate-before-payment
 * @access Private (Institution Admin)
 */
const validateUsersBeforePayment = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { emails } = req.body; // Array of email addresses

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw new AppError('Email addresses are required', 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Validate emails
  const validEmails = emails.filter(email => email && email.includes('@'));
  if (validEmails.length === 0) {
    throw new AppError('No valid email addresses provided', 400, 'VALIDATION_ERROR');
  }

  const existingUsers = [];
  const newUsers = [];
  const notFoundUsers = [];
  const otherInstitutionUsers = [];

  // Check each user
  for (const email of validEmails) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      notFoundUsers.push(email);
      continue;
    }

    // Check if user already belongs to this institution
    if (user.institutionId && user.institutionId.toString() === institutionId.toString()) {
      existingUsers.push({
        email: email,
        displayName: user.displayName || email.split('@')[0]
      });
      continue;
    }

    // Check if user belongs to another institution
    if (user.institutionId && user.institutionId.toString() !== institutionId.toString()) {
      otherInstitutionUsers.push({
        email: email,
        displayName: user.displayName || email.split('@')[0]
      });
      continue;
    }

    // User exists but not in any institution - can be added
    newUsers.push({
      email: email,
      displayName: user.displayName || email.split('@')[0]
    });
  }

  res.status(200).json({
    success: true,
    data: {
      existingUsers, // Already in this institution
      newUsers, // Can be added (need payment)
      notFoundUsers, // User account doesn't exist
      otherInstitutionUsers, // Belongs to another institution
      summary: {
        total: validEmails.length,
        existing: existingUsers.length,
        new: newUsers.length,
        notFound: notFoundUsers.length,
        otherInstitution: otherInstitutionUsers.length
      }
    }
  });
});

/**
 * Create Payment Order for Additional Users
 * @route POST /api/institution-admin/users/create-payment
 * @access Private (Institution Admin)
 */
const createAdditionalUsersPaymentOrder = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { emails } = req.body; // Array of email addresses

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw new AppError('Email addresses are required', 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if institution subscription is active
  if (!isInstitutionSubscriptionActive(institution)) {
    throw new AppError('Institution subscription is not active. Please renew your subscription to add users.', 400, 'SUBSCRIPTION_INACTIVE');
  }

  // Validate emails
  const validEmails = emails.filter(email => email && email.includes('@'));
  if (validEmails.length === 0) {
    throw new AppError('No valid email addresses provided', 400, 'VALIDATION_ERROR');
  }

  // Check if Razorpay is configured
  if (!razorpay) {
    const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
    const hasKeySecret = !!process.env.RAZORPAY_KEY_SECRET;
    
    Logger.error('Razorpay not initialized. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.', {
      hasKeyId,
      hasKeySecret,
      keyIdLength: process.env.RAZORPAY_KEY_ID?.length || 0,
      keySecretLength: process.env.RAZORPAY_KEY_SECRET?.length || 0
    });
    
    if (!hasKeyId || !hasKeySecret) {
      throw new AppError('Payment gateway is not configured. Razorpay keys are missing. Please contact support.', 500, 'PAYMENT_CONFIG_ERROR');
    } else {
      throw new AppError('Payment gateway initialization failed. Please contact support.', 500, 'PAYMENT_CONFIG_ERROR');
    }
  }

  // Validate Razorpay keys are present
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    Logger.error('Razorpay keys missing in environment variables', {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
    });
    throw new AppError('Payment gateway configuration is incomplete. Razorpay keys are missing. Please contact support.', 500, 'PAYMENT_CONFIG_ERROR');
  }

  // Calculate amount (₹499 per user in paise)
  const numberOfUsers = validEmails.length;
  const amount = numberOfUsers * ADDITIONAL_USER_PRICE;

  // Razorpay minimum amount is ₹1 (100 paise)
  if (amount < 100) {
    throw new AppError('Invalid amount. Minimum payment amount is ₹1.', 400, 'VALIDATION_ERROR');
  }

  // Create Razorpay order
  // Receipt must be max 40 characters (Razorpay requirement)
  // Generate a unique, scalable receipt that always stays under 40 chars
  const generateReceipt = () => {
    const timestamp = Date.now().toString(); // 13 digits
    const prefix = 'usr_'; // 4 chars
    const receipt = `${prefix}${timestamp}`; // Total: 4 + 13 = 17 chars (well under 40)
    
    // Safety validation - ensure it never exceeds 40 chars
    if (receipt.length > 40) {
      Logger.error('Receipt length exceeded 40 characters', { receipt, length: receipt.length });
      // Fallback: use just timestamp (13 chars) - always safe
      return timestamp;
    }
    return receipt;
  };

  const receipt = generateReceipt();
  
  // Final validation before creating order
  if (receipt.length > 40) {
    Logger.error('Receipt validation failed - length exceeds 40 characters', { 
      receipt, 
      length: receipt.length,
      institutionId,
      numberOfUsers 
    });
    throw new AppError('Failed to generate payment receipt. Please contact support.', 500, 'PAYMENT_ERROR');
  }

  const options = {
    amount: amount,
    currency: 'INR',
    receipt: receipt,
    notes: {
      institutionId: institutionId.toString(),
      numberOfUsers: numberOfUsers,
      emails: validEmails.join(','),
      type: 'additional_users',
      receiptId: receipt // Store receipt in notes for reference/tracking
    }
  };

  try {
    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      numberOfUsers: numberOfUsers,
      pricePerUser: ADDITIONAL_USER_PRICE,
      emails: validEmails
    });
  } catch (error) {
    // Log full error for debugging - handle circular references
    try {
      console.error('Full Razorpay error:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        stack: error.stack
      });
    } catch (e) {
      console.error('Error logging failed:', e);
    }
    
    // Extract error details from Razorpay error object
    const razorpayError = error.error || error;
    const errorDetails = {
      message: error.message || razorpayError?.message,
      statusCode: error.statusCode || razorpayError?.statusCode,
      description: razorpayError?.description,
      field: razorpayError?.field,
      source: razorpayError?.source,
      step: razorpayError?.step,
      reason: razorpayError?.reason,
      metadata: razorpayError?.metadata
    };
    
    Logger.error('Razorpay order creation failed for additional users', errorDetails);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create payment order. Please try again.';
    
    if (razorpayError?.description) {
      errorMessage = `Payment gateway error: ${razorpayError.description}`;
    } else if (razorpayError?.reason) {
      errorMessage = `Payment gateway error: ${razorpayError.reason}`;
    } else if (error.message) {
      errorMessage = `Payment error: ${error.message}`;
    } else if (razorpayError?.message) {
      errorMessage = `Payment error: ${razorpayError.message}`;
    }
    
    // Check for common Razorpay errors
    const statusCode = error.statusCode || razorpayError?.statusCode;
    if (statusCode === 401 || statusCode === 403) {
      errorMessage = 'Payment gateway authentication failed. Please check your Razorpay configuration.';
    } else if (statusCode === 400) {
      errorMessage = razorpayError?.description || 'Invalid payment request. Please check the details.';
    }
    
    throw new AppError(errorMessage, 500, 'PAYMENT_ERROR');
  }
});

/**
 * Verify Payment and Add Additional Users
 * @route POST /api/institution-admin/users/verify-payment
 * @access Private (Institution Admin)
 */
const verifyAdditionalUsersPayment = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    emails
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Payment verification details are required', 400, 'VALIDATION_ERROR');
  }

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw new AppError('Email addresses are required', 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Verify payment signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('Invalid payment signature. Payment verification failed.', 400, 'INVALID_PAYMENT');
  }

  // Check if payment already processed
  const existingPayment = await Payment.findOne({ razorpayOrderId });
  if (existingPayment && existingPayment.status === 'captured') {
    throw new AppError('Payment already processed', 400, 'PAYMENT_ALREADY_PROCESSED');
  }

  // Validate emails and add users
  const validEmails = emails.filter(email => email && email.includes('@'));
  const addedUsers = [];
  const skippedUsers = [];
  const errors = [];

  for (const email of validEmails) {
    try {
      // Check if user exists
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        errors.push(`${email}: User account not found. The user must first create an account on the platform.`);
        continue;
      }

      // Check if user already belongs to this institution
      if (user.institutionId && user.institutionId.toString() === institutionId.toString()) {
        skippedUsers.push({ email, reason: 'User already exists in this institution' });
        continue;
      }

      // Check if user belongs to another institution
      if (user.institutionId && user.institutionId.toString() !== institutionId.toString()) {
        errors.push(`${email}: User already belongs to another institution.`);
        continue;
      }

      // Apply institution plan to user
      await applyInstitutionPlan(user, institution);

      // Update user
      user.institutionId = institutionId;
      user.isInstitutionUser = true;
      await user.save();

      addedUsers.push({
        id: user._id,
        email: user.email,
        displayName: user.displayName
      });

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${user._id}`).emit('plan-updated', {
          plan: 'institution',
          source: 'institution',
          institutionId: institution._id,
          institutionName: institution.name,
          message: 'You have been granted institution plan access through your institution'
        });
      }
    } catch (error) {
      Logger.error(`Error adding user ${email}`, error);
      errors.push(`${email}: ${error.message}`);
    }
  }

  // Check system-wide max users per institution setting
  const maxUsersPerInstitution = await settingsService.getMaxUsersPerInstitution();
  
  // Update institution user count and max users
  const currentUserCount = await User.countDocuments({
    institutionId,
    isInstitutionUser: true
  });
  
  // Ensure we don't exceed system-wide limit
  if (currentUserCount >= maxUsersPerInstitution) {
    throw new AppError(`Cannot add users. System-wide limit of ${maxUsersPerInstitution} users per institution has been reached.`, 400, 'LIMIT_REACHED');
  }
  
  institution.subscription.currentUsers = currentUserCount;
  institution.subscription.maxUsers = institution.subscription.maxUsers + addedUsers.length;
  await institution.save();

  // Save payment record
  const payment = new Payment({
    userId: null, // Institution payment
    institutionId: institutionId,
    amount: validEmails.length * ADDITIONAL_USER_PRICE,
    currency: 'INR',
    status: 'captured',
    plan: 'additional_users',
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    metadata: {
      numberOfUsers: validEmails.length,
      addedUsers: addedUsers.length,
      skippedUsers: skippedUsers.length,
      emails: validEmails
    }
  });
  await payment.save();

  // Log audit
  if (!institution.auditLogs) {
    institution.auditLogs = [];
  }
  institution.auditLogs.push({
    timestamp: new Date(),
    action: 'users_added_via_payment',
    user: req.institutionAdmin?.email || institution.adminEmail || 'System',
    details: `${addedUsers.length} user(s) added via payment. Payment ID: ${razorpayPaymentId}`,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  await institution.save();

  res.status(200).json({
    success: true,
    message: `Payment verified successfully. ${addedUsers.length} user(s) added.`,
    data: {
      addedUsers,
      skippedUsers,
      errors: errors.length > 0 ? errors : undefined,
      paymentId: razorpayPaymentId,
      newMaxUsers: institution.subscription.maxUsers
    }
  });
});

// Institution Plans (matching institutionRegistrationController)
const INSTITUTION_PLANS = {
  'basic': {
    name: 'Basic',
    maxUsers: 10,
    price: { yearly: 548900 }, // ₹5489/yr in paise
    badge: 'Popular',
    features: ['Custom Branding', 'Advanced Analytics', 'AI Features', 'API Access', 'Bulk User Management', 'Export Results']
  },
  'professional': {
    name: 'Professional',
    maxUsers: 50,
    price: { yearly: 2544900 }, // ₹25449/yr in paise
    badge: 'High Demand',
    features: ['Custom Branding', 'Advanced Analytics', 'AI Features', 'API Access', 'Bulk User Management', 'Export Results']
  },
  'enterprise': {
    name: 'Custom',
    maxUsers: null, // Unlimited for custom plan
    price: { yearly: 49900, perUser: 49900 }, // Base ₹499/yr + ₹499 per user (in paise)
    badge: 'Custom',
    isCustom: true,
    minUsers: 10,
    features: ['Custom Branding', 'Advanced Analytics', 'AI Features', 'API Access', 'Bulk User Management', 'Export Results']
  }
};

/**
 * Create Payment Order for Subscription Renewal/Upgrade
 * @route POST /api/institution-admin/subscription/renew
 * @access Private (Institution Admin)
 */
const createSubscriptionRenewalOrder = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { billingCycle = 'yearly', plan, customUserCount } = req.body;

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if Razorpay is configured
  if (!razorpay) {
    const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
    const hasKeySecret = !!process.env.RAZORPAY_KEY_SECRET;
    
    if (!hasKeyId || !hasKeySecret) {
      throw new AppError('Payment gateway is not configured. Razorpay keys are missing. Please contact support.', 500, 'PAYMENT_CONFIG_ERROR');
    } else {
      throw new AppError('Payment gateway initialization failed. Please contact support.', 500, 'PAYMENT_CONFIG_ERROR');
    }
  }

  // Calculate amount based on selected plan or use current plan
  let amount = 548900; // Default: Basic plan price
  let selectedPlanDetails = null;
  let maxUsers = institution.subscription.maxUsers || 10;

  if (plan && INSTITUTION_PLANS[plan]) {
    selectedPlanDetails = INSTITUTION_PLANS[plan];
    
    if (selectedPlanDetails.isCustom) {
      // Custom plan: base price + (userCount * perUserPrice)
      // Matching the calculation from institution registration
      const userCount = customUserCount || selectedPlanDetails.minUsers || 10;
      if (userCount < selectedPlanDetails.minUsers) {
        throw new AppError(`Minimum ${selectedPlanDetails.minUsers} users required for Custom plan`, 400, 'VALIDATION_ERROR');
      }
      amount = selectedPlanDetails.price.yearly + (userCount * selectedPlanDetails.price.perUser);
      maxUsers = userCount;
    } else {
      // Fixed plans
      amount = selectedPlanDetails.price[billingCycle] || selectedPlanDetails.price.yearly;
      maxUsers = selectedPlanDetails.maxUsers;
    }
  } else if (plan) {
    throw new AppError('Invalid plan selected', 400, 'VALIDATION_ERROR');
  }

  // Create Razorpay order
  // Receipt must be max 40 characters - use short format
  // Format: inst_[last8chars]_[last8digits] = max 25 chars
  const instIdShort = institutionId.toString().slice(-8);
  const timestampShort = Date.now().toString().slice(-8);
  const receiptId = `inst_${instIdShort}_${timestampShort}`;
  
  const options = {
    amount: amount,
    currency: 'INR',
    receipt: receiptId, // Will be max 25 characters: inst_12345678_12345678
    notes: {
      institutionId: institutionId.toString(),
      type: plan ? 'subscription_upgrade' : 'subscription_renewal',
      billingCycle: billingCycle,
      plan: plan || null,
      maxUsers: maxUsers,
      customUserCount: selectedPlanDetails?.isCustom ? customUserCount : null
    }
  };

  try {
    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      billingCycle: billingCycle,
      plan: plan || null,
      maxUsers: maxUsers
    });
  } catch (error) {
    Logger.error('Razorpay order creation failed for subscription renewal', error);
    
    if (error.error?.description) {
      throw new AppError(`Payment gateway error: ${error.error.description}`, 500, 'PAYMENT_ERROR');
    } else if (error.message) {
      throw new AppError(`Payment error: ${error.message}`, 500, 'PAYMENT_ERROR');
    } else {
      throw new AppError('Failed to create payment order. Please check your payment configuration and try again.', 500, 'PAYMENT_ERROR');
    }
  }
});

/**
 * Verify Payment and Renew Subscription
 * @route POST /api/institution-admin/subscription/verify-renewal
 * @access Private (Institution Admin)
 */
const verifySubscriptionRenewal = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Payment verification details are required', 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Verify payment signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('Invalid payment signature. Payment verification failed.', 400, 'INVALID_PAYMENT');
  }

  // Check if payment already processed
  const existingPayment = await Payment.findOne({ razorpayOrderId });
  if (existingPayment && existingPayment.status === 'captured') {
    throw new AppError('Payment already processed', 400, 'PAYMENT_ALREADY_PROCESSED');
  }

  // Fetch order details from Razorpay to get amount and plan info
  let orderAmount = 0;
  let planFromOrder = null;
  let maxUsersFromOrder = institution.subscription.maxUsers || 10;
  let customUserCountFromOrder = null;
  
  try {
    const order = await razorpay.orders.fetch(razorpayOrderId);
    orderAmount = order.amount;
    
    // Extract plan info from order notes
    if (order.notes) {
      planFromOrder = order.notes.plan || null;
      maxUsersFromOrder = order.notes.maxUsers ? parseInt(order.notes.maxUsers) : maxUsersFromOrder;
      customUserCountFromOrder = order.notes.customUserCount ? parseInt(order.notes.customUserCount) : null;
    }
  } catch (error) {
    Logger.error('Error fetching Razorpay order', error);
    // Use default amount if fetch fails
    orderAmount = 548900; // Default renewal price
  }

  // Calculate new subscription dates
  const now = new Date();
  const isUpgrade = planFromOrder && planFromOrder !== null;
  const startDate = institution.subscription.endDate && new Date(institution.subscription.endDate) > now && !isUpgrade
    ? institution.subscription.endDate 
    : now;
  
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year

  // Update institution subscription
  institution.subscription.status = 'active';
  institution.subscription.startDate = startDate;
  institution.subscription.endDate = endDate;
  institution.subscription.billingCycle = 'yearly';
  institution.subscription.maxUsers = maxUsersFromOrder; // Update max users if plan changed
  institution.subscription.razorpayOrderId = razorpayOrderId;
  institution.subscription.razorpayPaymentId = razorpayPaymentId;
  
  await institution.save();

  // Update all institution users' plans
  await updateInstitutionUsersPlans(institutionId, true);

  // Save payment record
  const payment = new Payment({
    userId: null, // Institution payment
    institutionId: institutionId,
    amount: orderAmount / 100, // Convert from paise to rupees
    currency: 'INR',
    status: 'captured',
    plan: 'institution_renewal',
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    metadata: {
      type: isUpgrade ? 'subscription_upgrade' : 'subscription_renewal',
      billingCycle: 'yearly',
      newEndDate: endDate,
      plan: planFromOrder,
      maxUsers: maxUsersFromOrder
    }
  });
  await payment.save();

  // Log audit
  if (!institution.auditLogs) {
    institution.auditLogs = [];
  }
  const actionType = isUpgrade ? 'subscription_upgraded' : 'subscription_renewed';
  const actionMessage = isUpgrade 
    ? `Subscription upgraded to ${maxUsersFromOrder} users. New end date: ${endDate.toLocaleDateString()}. Payment ID: ${razorpayPaymentId}`
    : `Subscription renewed. New end date: ${endDate.toLocaleDateString()}. Payment ID: ${razorpayPaymentId}`;
  
  institution.auditLogs.push({
    timestamp: new Date(),
    action: actionType,
    user: req.institutionAdmin?.email || institution.adminEmail || 'System',
    details: actionMessage,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  await institution.save();

  res.status(200).json({
    success: true,
    message: isUpgrade ? 'Subscription upgraded successfully' : 'Subscription renewed successfully',
    data: {
      subscription: {
        status: institution.subscription.status,
        startDate: institution.subscription.startDate,
        endDate: institution.subscription.endDate,
        billingCycle: institution.subscription.billingCycle,
        maxUsers: institution.subscription.maxUsers
      },
      paymentId: razorpayPaymentId
    }
  });
});

/**
 * Update Institution Admin Profile
 * @route PUT /api/institution-admin/profile
 * @access Private (Institution Admin)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { adminName, adminEmail } = req.body;

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Validate email format if provided
  if (adminEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    // Check if email is already in use by another institution
    const existingInstitution = await Institution.findOne({
      adminEmail: adminEmail.toLowerCase().trim(),
      _id: { $ne: institutionId }
    });

    if (existingInstitution) {
      throw new AppError('Email is already in use by another institution', 400, 'DUPLICATE_ENTRY');
    }
  }

  // Update fields
  if (adminName !== undefined) institution.adminName = adminName.trim();
  if (adminEmail !== undefined) institution.adminEmail = adminEmail.toLowerCase().trim();

  await institution.save();

  // Log audit
  if (!institution.auditLogs) {
    institution.auditLogs = [];
  }
  institution.auditLogs.push({
    timestamp: new Date(),
    action: 'profile_updated',
    user: req.institutionAdmin?.email || institution.adminEmail || 'System',
    details: `Profile updated: ${adminName ? `Name: ${adminName}` : ''} ${adminEmail ? `Email: ${adminEmail}` : ''}`,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        adminEmail: institution.adminEmail,
        adminName: institution.adminName
      }
    }
  });
});

/**
 * Change Institution Admin Password
 * @route PUT /api/institution-admin/change-password
 * @access Private (Institution Admin)
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'VALIDATION_ERROR');
  }

  // Get password minimum length from settings
  const passwordMinLength = await settingsService.getPasswordMinLength();
  
  if (newPassword.length < passwordMinLength) {
    throw new AppError(`New password must be at least ${passwordMinLength} characters long`, 400, 'VALIDATION_ERROR');
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Verify current password
  let isPasswordValid = false;
  if (institution.password && institution.password.startsWith('$2')) {
    isPasswordValid = await bcrypt.compare(currentPassword, institution.password);
  } else {
    isPasswordValid = currentPassword === institution.password;
  }

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401, 'UNAUTHORIZED');
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  institution.password = hashedPassword;
  await institution.save();

  // Log audit
  if (!institution.auditLogs) {
    institution.auditLogs = [];
  }
  institution.auditLogs.push({
    timestamp: new Date(),
    action: 'password_changed',
    user: req.institutionAdmin?.email || institution.adminEmail || 'System',
    details: 'Password changed successfully',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  loginInstitutionAdmin,
  checkInstitutionAdmin,
  verifyToken,
  getDashboardStats,
  getInstitutionUsers,
  addInstitutionUser,
  removeInstitutionUser,
  bulkImportUsers,
  getInstitutionPresentations,
  getAdminUserAccount,
  getAnalytics,
  updateBranding,
  uploadLogo,
  updateSettings,
  exportData,
  generateReport,
  getAuditLogs,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  getCustomReports,
  createCustomReport,
  generateCustomReport,
  deleteCustomReport,
  updateSecuritySettings,
  validateUsersBeforePayment,
  createAdditionalUsersPaymentOrder,
  verifyAdditionalUsersPayment,
  getSubscriptionDetails,
  getSubscriptionStatus,
  getUsageStatistics,
  createSubscriptionRenewalOrder,
  verifySubscriptionRenewal,
  updateProfile,
  changePassword,
  getPaymentHistory
};

