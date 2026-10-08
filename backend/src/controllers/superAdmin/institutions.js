/**
 * Super Admin Controller - institutions
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const bcrypt = require('bcryptjs');
const Logger = require('../../utils/logger');
const superAdminService = require('../../services/superAdminService');
const Institution = require('../../models/Institution');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');

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

module.exports = {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitutionPlan
};
