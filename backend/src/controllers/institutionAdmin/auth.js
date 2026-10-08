/**
 * Institution Admin - auth
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Institution = require('../../models/Institution');
const settingsService = require('../../services/settingsService');
const { isInstitutionSubscriptionActive } = require('../../services/institutionPlanService');

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

  if (!isInstitutionSubscriptionActive(institution)) {
    throw new AppError('Institution access is disabled. Please contact your institution administrator.', 403, 'INSTITUTION_DISABLED');
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
    process.env.JWT_SECRET,
    { expiresIn: process.env.INSTITUTION_ADMIN_JWT_EXPIRES_IN || '8h' }
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
  updateProfile,
  changePassword
};
