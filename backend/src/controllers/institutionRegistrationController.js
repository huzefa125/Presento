const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Institution = require('../models/Institution');
const Razorpay = require('razorpay');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const emailService = require('../services/emailService');

// In-memory OTP storage (expires after 10 minutes)
// Format: { email: { otp: string, expiry: Date, attempts: number } }
const otpStorage = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiry) {
      otpStorage.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Initialize Razorpay only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (error) {
    Logger.error('Failed to initialize Razorpay', error);
  }
}

// Plan configurations (yearly only)
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
 * Generate verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate registration session token
 */
const generateRegistrationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Step 1: Start Registration - Validate and check for duplicates
 * @route POST /api/institution/register/start
 * @access Public
 */
const startRegistration = asyncHandler(async (req, res, next) => {
  const {
    institutionName,
    adminName,
    adminEmail,
    country,
    phoneNumber,
    institutionType
  } = req.body;

  // Use adminEmail as institutionEmail since we removed the separate institution email field
  const institutionEmail = adminEmail;

  // Validation
  if (!institutionName || !adminName || !adminEmail) {
    throw new AppError('Institution name, admin name, and email are required', 400, 'VALIDATION_ERROR');
  }

  // Check if institution already exists
  const existingInstitution = await Institution.findOne({
    $or: [
      { email: institutionEmail.toLowerCase() },
      { adminEmail: adminEmail.toLowerCase() }
    ]
  });

  if (existingInstitution) {
    throw new AppError('An institution with this email already exists', 400, 'DUPLICATE_ENTRY');
  }

  // Generate registration token for frontend session management
  const registrationToken = generateRegistrationToken();

  // Return success - data will be stored in frontend sessionStorage
  res.status(201).json({
    success: true,
    message: 'Registration started successfully',
    registrationToken,
    currentStep: 2
  });
});

/**
 * Step 4: Select Plan - Validate plan selection
 * @route POST /api/institution/register/select-plan
 * @access Public
 */
const selectPlan = asyncHandler(async (req, res, next) => {
  const { plan, billingCycle, customUserCount } = req.body;

  if (!plan || !billingCycle) {
    throw new AppError('Plan and billing cycle are required', 400, 'VALIDATION_ERROR');
  }

  if (!INSTITUTION_PLANS[plan]) {
    throw new AppError('Invalid plan selected', 400, 'VALIDATION_ERROR');
  }

  // Only yearly billing cycle is supported
  if (billingCycle !== 'yearly') {
    throw new AppError('Only yearly billing cycle is available', 400, 'VALIDATION_ERROR');
  }

  const planDetails = INSTITUTION_PLANS[plan];
  
  // Validate custom plan user count
  if (planDetails.isCustom) {
    if (!customUserCount || customUserCount < planDetails.minUsers) {
      throw new AppError(`Minimum ${planDetails.minUsers} users required for Custom plan`, 400, 'VALIDATION_ERROR');
    }
  }

  res.status(200).json({
    success: true,
    message: 'Plan selected successfully',
    plan: {
      name: planDetails.name,
      maxUsers: planDetails.isCustom ? customUserCount : planDetails.maxUsers,
      price: planDetails.price[billingCycle],
      billingCycle,
      features: planDetails.features
    }
  });
});

/**
 * Step 5: Create Payment Order
 * @route POST /api/institution/register/create-payment
 * @access Public
 */
const createPaymentOrder = asyncHandler(async (req, res, next) => {
  const { plan, billingCycle, customUserCount } = req.body;

  if (!plan || !billingCycle) {
    throw new AppError('Plan and billing cycle are required', 400, 'VALIDATION_ERROR');
  }

  if (!INSTITUTION_PLANS[plan]) {
    throw new AppError('Invalid plan selected', 400, 'VALIDATION_ERROR');
  }

  const planDetails = INSTITUTION_PLANS[plan];
  
  // Calculate amount based on plan type
  let amount;
  let maxUsers;
  if (planDetails.isCustom) {
    // Custom plan: base price + (user count × per user price)
    if (!customUserCount || customUserCount < planDetails.minUsers) {
      throw new AppError(`Minimum ${planDetails.minUsers} users required for Custom plan`, 400, 'VALIDATION_ERROR');
    }
    maxUsers = customUserCount;
    amount = planDetails.price.yearly + (customUserCount * planDetails.price.perUser);
  } else {
    amount = planDetails.price[billingCycle];
    maxUsers = planDetails.maxUsers;
  }

  // Check if Razorpay is configured
  if (!razorpay) {
    throw new AppError('Payment gateway is not configured. Please contact support.', 500, 'PAYMENT_CONFIG_ERROR');
  }

  // Create Razorpay order
  const options = {
    amount: amount,
    currency: 'INR',
    receipt: `inst_reg_${Date.now()}`,
    notes: {
      plan: plan,
      billingCycle: billingCycle,
      maxUsers: maxUsers,
      type: 'institution_registration'
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
      plan: plan
    });
  } catch (error) {
    Logger.error('Razorpay order creation failed', error);
    
    // Provide more specific error messages
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
 * Step 2: Send Email Verification OTP
 * @route POST /api/institution/register/send-verification
 * @access Public
 */
const sendEmailVerification = asyncHandler(async (req, res, next) => {
  const { adminEmail, adminName } = req.body;

  if (!adminEmail || !adminName) {
    throw new AppError('Admin email and name are required', 400, 'VALIDATION_ERROR');
  }

  // Check if email is already registered
  const existingInstitution = await Institution.findOne({
    $or: [
      { email: adminEmail.toLowerCase() },
      { adminEmail: adminEmail.toLowerCase() }
    ]
  });

  if (existingInstitution) {
    throw new AppError('An institution with this email already exists', 400, 'DUPLICATE_ENTRY');
  }

  // Rate limiting: Check if OTP was sent in last 1 minute
  const existingOTP = otpStorage.get(adminEmail.toLowerCase());
  if (existingOTP && new Date() < existingOTP.expiry) {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    if (existingOTP.expiry > oneMinuteAgo) {
      throw new AppError('Please wait 1 minute before requesting another OTP', 429, 'RATE_LIMIT');
    }
  }

  // Generate 6-digit OTP
  const adminOTP = generateOTP();
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

  // Store OTP in memory
  otpStorage.set(adminEmail.toLowerCase(), {
    otp: adminOTP,
    expiry: otpExpiry,
    attempts: 0
  });

  // Send OTP email
  try {
    await emailService.sendInstitutionRegistrationOTPEmail(
      adminEmail.toLowerCase(),
      adminName,
      adminOTP
    );

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      email: adminEmail.toLowerCase()
    });
  } catch (error) {
    Logger.error('Failed to send verification email', error);
    // Remove OTP from storage if email fails
    otpStorage.delete(adminEmail.toLowerCase());
    throw new AppError('Failed to send verification email. Please try again.', 500, 'EMAIL_ERROR');
  }
});

/**
 * Step 2: Verify Email OTP
 * @route POST /api/institution/register/verify-email
 * @access Public
 */
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { adminEmail, otp } = req.body;

  if (!adminEmail || !otp) {
    throw new AppError('Admin email and OTP are required', 400, 'VALIDATION_ERROR');
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError('Invalid OTP format. OTP must be 6 digits', 400, 'VALIDATION_ERROR');
  }

  // Get OTP from memory storage
  const otpData = otpStorage.get(adminEmail.toLowerCase());

  if (!otpData) {
    throw new AppError('OTP not found. Please request a new OTP', 400, 'OTP_NOT_FOUND');
  }

  // Check if OTP expired
  if (new Date() > otpData.expiry) {
    otpStorage.delete(adminEmail.toLowerCase());
    throw new AppError('OTP has expired. Please request a new one', 400, 'OTP_EXPIRED');
  }

  // Check attempts (max 5 attempts)
  if (otpData.attempts >= 5) {
    otpStorage.delete(adminEmail.toLowerCase());
    throw new AppError('Too many failed attempts. Please request a new OTP', 400, 'OTP_MAX_ATTEMPTS');
  }

  // Verify OTP
  if (otpData.otp !== otp) {
    otpData.attempts += 1;
    throw new AppError('Invalid OTP. Please check and try again', 400, 'INVALID_OTP');
  }

  // OTP verified - remove from storage
  otpStorage.delete(adminEmail.toLowerCase());

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

/**
 * Step 3: Validate Password (no storage, just validation)
 * @route POST /api/institution/register/validate-password
 * @access Public
 */
const validatePassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
  }

  // Validate password
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
  }

  res.status(200).json({
    success: true,
    message: 'Password is valid'
  });
});

/**
 * Step 5: Complete Registration (after payment) - Create Institution in MongoDB
 * @route POST /api/institution/register/complete
 * @access Public
 */
const completeRegistration = asyncHandler(async (req, res, next) => {
  const {
    // Registration data
    institutionName,
    adminName,
    adminEmail,
    country,
    phoneNumber,
    institutionType,
    password,
    // Plan data
    plan,
    billingCycle,
    customUserCount,
    // Payment data
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    billingAddress,
    taxId,
    billingEmail
  } = req.body;

  // Validation
  if (!institutionName || !adminName || !adminEmail || !password) {
    throw new AppError('Institution name, admin name, email, and password are required', 400, 'VALIDATION_ERROR');
  }

  if (!plan || !billingCycle) {
    throw new AppError('Plan and billing cycle are required', 400, 'VALIDATION_ERROR');
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Payment verification is required to complete registration', 400, 'PAYMENT_REQUIRED');
  }

  // Check if institution already exists
  const existingInstitution = await Institution.findOne({
    $or: [
      { email: adminEmail.toLowerCase() },
      { adminEmail: adminEmail.toLowerCase() }
    ]
  });

  if (existingInstitution) {
    throw new AppError('An institution with this email already exists', 400, 'DUPLICATE_ENTRY');
  }

  // CRITICAL: Verify payment signature BEFORE saving any data to database
  // If payment verification fails, NO data will be saved
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('Invalid payment signature. Payment verification failed.', 400, 'INVALID_PAYMENT');
  }

  // Payment verified successfully - proceed to save institution data

  // Validate plan
  if (!INSTITUTION_PLANS[plan]) {
    throw new AppError('Invalid plan selected', 400, 'VALIDATION_ERROR');
  }

  const planDetails = INSTITUTION_PLANS[plan];
  let maxUsers;
  if (planDetails.isCustom) {
    if (!customUserCount || customUserCount < planDetails.minUsers) {
      throw new AppError(`Minimum ${planDetails.minUsers} users required for Custom plan`, 400, 'VALIDATION_ERROR');
    }
    maxUsers = customUserCount;
  } else {
    maxUsers = planDetails.maxUsers;
  }

  // Validate password
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Calculate subscription end date
  const startDate = new Date();
  const endDate = new Date();
  if (billingCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // CRITICAL: Create institution - THIS IS THE FIRST AND ONLY TIME DATA IS SAVED TO MONGODB
  // This only happens after successful payment verification
  // If payment is cancelled or fails, this code is NEVER executed
  const institution = new Institution({
    name: institutionName.trim(),
    email: adminEmail.toLowerCase().trim(), // Use adminEmail as institutionEmail
    adminEmail: adminEmail.toLowerCase().trim(),
    adminName: adminName.trim(),
    password: hashedPassword,
    subscription: {
      plan: 'institution',
      status: 'active',
      startDate,
      endDate,
      maxUsers: maxUsers,
      billingCycle: billingCycle,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
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
      billingAddress: billingAddress || null,
      taxId: taxId || null,
      billingEmail: billingEmail || adminEmail.toLowerCase()
    },
    isActive: true
  });

  await institution.save();

  // Send welcome email
  try {
    await emailService.sendInstitutionWelcomeEmail(
      institution.adminEmail,
      institution.adminName,
      institution.name
    );
  } catch (error) {
    Logger.error('Failed to send welcome email', error);
    // Don't fail registration if email fails
  }

  // Generate JWT token for immediate login
  const jwt = require('jsonwebtoken');
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

  res.status(201).json({
    success: true,
    message: 'Institution registered successfully',
    token,
    institution: {
      id: institution._id,
      name: institution.name,
      email: institution.email,
      adminEmail: institution.adminEmail
    }
  });
});

/**
 * Resend Verification Email
 * @route POST /api/institution/register/resend-verification
 * @access Public
 */
const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { adminEmail, adminName } = req.body;

  if (!adminEmail || !adminName) {
    throw new AppError('Admin email and name are required', 400, 'VALIDATION_ERROR');
  }

  // Rate limiting: Check if OTP was sent in last 1 minute
  const existingOTP = otpStorage.get(adminEmail.toLowerCase());
  if (existingOTP) {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    if (existingOTP.expiry > oneMinuteAgo) {
      throw new AppError('Please wait 1 minute before requesting another OTP', 429, 'RATE_LIMIT');
    }
  }

  // Generate new OTP
  const adminOTP = generateOTP();
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

  // Store OTP in memory
  otpStorage.set(adminEmail.toLowerCase(), {
    otp: adminOTP,
    expiry: otpExpiry,
    attempts: 0
  });

  // Send OTP email
  try {
    await emailService.sendInstitutionRegistrationOTPEmail(
      adminEmail.toLowerCase(),
      adminName,
      adminOTP
    );

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    Logger.error('Failed to send OTP email', error);
    // Remove OTP from storage if email fails
    otpStorage.delete(adminEmail.toLowerCase());
    throw new AppError('Failed to send OTP. Please try again.', 500, 'EMAIL_ERROR');
  }
});

/**
 * Get Registration Status - No longer needed, but kept for backward compatibility
 * @route GET /api/institution/register/status
 * @access Public
 */
const getRegistrationStatus = asyncHandler(async (req, res, next) => {
  // Registration status is now managed in frontend sessionStorage
  res.status(200).json({
    success: true,
    message: 'Registration status is managed in frontend'
  });
});

/**
 * Get Available Plans
 * @route GET /api/institution/register/plans
 * @access Public
 */
const getPlans = asyncHandler(async (req, res, next) => {
  const plans = Object.keys(INSTITUTION_PLANS).map(key => ({
    id: key,
    name: INSTITUTION_PLANS[key].name,
    maxUsers: INSTITUTION_PLANS[key].maxUsers,
    prices: INSTITUTION_PLANS[key].price,
    badge: INSTITUTION_PLANS[key].badge || null,
    isCustom: INSTITUTION_PLANS[key].isCustom || false,
    minUsers: INSTITUTION_PLANS[key].minUsers || null,
    features: INSTITUTION_PLANS[key].features
  }));

  res.status(200).json({
    success: true,
    plans
  });
});

module.exports = {
  startRegistration,
  selectPlan,
  sendEmailVerification,
  verifyEmail,
  validatePassword,
  createPaymentOrder,
  completeRegistration,
  getRegistrationStatus,
  resendVerificationEmail,
  getPlans
};

