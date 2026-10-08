/**
 * Institution Admin - billing
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const crypto = require('crypto');
const Institution = require('../../models/Institution');
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const Logger = require('../../utils/logger');
const settingsService = require('../../services/settingsService');
const { applyInstitutionPlan, isInstitutionSubscriptionActive, updateInstitutionUsersPlans } = require('../../services/institutionPlanService');
const { razorpay, ADDITIONAL_USER_PRICE } = require('./_razorpay');

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

  // Fetch the order from Razorpay itself - this is the only source of truth for
  // how many users (and which emails) were actually paid for. Never trust a
  // client-supplied emails list here, since the signature above only proves
  // orderId+paymentId were paired by Razorpay, not what the client claims to want.
  const order = await razorpay.orders.fetch(razorpayOrderId);

  if (!order || order.status !== 'paid') {
    throw new AppError('Order not found or not paid', 400, 'VALIDATION_ERROR');
  }

  if (!order.notes || order.notes.institutionId !== institutionId.toString() || order.notes.type !== 'additional_users') {
    throw new AppError('This payment does not belong to this institution', 403, 'FORBIDDEN');
  }

  const orderEmails = (order.notes.emails || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  if (orderEmails.length === 0) {
    throw new AppError('No email addresses recorded on this order', 400, 'VALIDATION_ERROR');
  }

  if (order.amount !== orderEmails.length * ADDITIONAL_USER_PRICE) {
    throw new AppError('Order amount does not match the number of users paid for', 400, 'VALIDATION_ERROR');
  }

  // Validate emails and add users - derived from the paid order, not the request body
  const validEmails = orderEmails.filter(email => email && email.includes('@'));
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

module.exports = {
  getPaymentHistory,
  getSubscriptionDetails,
  getSubscriptionStatus,
  validateUsersBeforePayment,
  createAdditionalUsersPaymentOrder,
  verifyAdditionalUsersPayment,
  createSubscriptionRenewalOrder,
  verifySubscriptionRenewal
};
