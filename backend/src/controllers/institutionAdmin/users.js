/**
 * Institution Admin - users
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');
const User = require('../../models/User');
const Presentation = require('../../models/Presentation');
const Slide = require('../../models/Slide');
const Logger = require('../../utils/logger');
const settingsService = require('../../services/settingsService');
const { applyInstitutionPlan, removeInstitutionPlan, isInstitutionSubscriptionActive, getEffectivePlan } = require('../../services/institutionPlanService');

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

module.exports = {
  getInstitutionUsers,
  addInstitutionUser,
  removeInstitutionUser,
  bulkImportUsers,
  getAdminUserAccount
};
