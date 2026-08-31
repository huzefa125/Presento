const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const { getEffectivePlan } = require('../services/institutionPlanService');
const settingsService = require('../services/settingsService');
const { sendVerificationEmail } = require('../services/emailService');

const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Hash a raw verification token for storage (never store the usable token itself)
 */
const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

/**
 * Generate a verification token, store its hash on the user, and email the link
 */
const createAndSendVerificationEmail = async (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${rawToken}`;

  try {
    await sendVerificationEmail(user.email, user.displayName, verificationLink);
  } catch (error) {
    Logger.error('Failed to send verification email', error);
  }
};

/**
 * Build the effective subscription for a user (resolves institution-inherited plans)
 */
const getEffectiveSubscription = async (user) => {
  let subscription = user.subscription;
  if (user.isInstitutionUser && user.institutionId) {
    try {
      const effectivePlan = await getEffectivePlan(user);
      subscription = {
        ...user.subscription.toObject(),
        plan: effectivePlan.plan,
        status: effectivePlan.status,
        endDate: effectivePlan.endDate
      };
    } catch (error) {
      Logger.error('Error getting effective plan', error);
    }
  }
  return subscription;
};

const buildUserResponse = (user, subscription) => ({
  id: user._id,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  subscription: subscription,
  isInstitutionUser: user.isInstitutionUser,
  institutionId: user.institutionId,
  emailVerified: user.emailVerified
});

/**
 * Register a new user with email/password
 * @route POST /api/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    throw new AppError('Email, password, and display name are required', 400, 'VALIDATION_ERROR');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address', 400, 'VALIDATION_ERROR');
  }

  const registrationEnabled = await settingsService.isRegistrationEnabled();
  if (!registrationEnabled) {
    throw new AppError('Registration is currently disabled. Please contact support for assistance.', 403, 'REGISTRATION_DISABLED');
  }

  const passwordMinLength = await settingsService.getPasswordMinLength();
  if (password.length < passwordMinLength) {
    throw new AppError(`Password must be at least ${passwordMinLength} characters long`, 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser && existingUser.password) {
    throw new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let user;

  if (existingUser) {
    // Legacy account (created via Firebase, never migrated) - attach a password to it
    existingUser.password = passwordHash;
    existingUser.displayName = displayName.trim();
    await existingUser.save();
    user = existingUser;
  } else {
    user = new User({
      email: normalizedEmail,
      displayName: displayName.trim(),
      password: passwordHash
    });
    await user.save();
  }

  const requireEmailVerification = await settingsService.isEmailVerificationRequired();

  if (requireEmailVerification && !user.emailVerified) {
    await createAndSendVerificationEmail(user);
    throw new AppError('Email verification is required. Please verify your email address before accessing the platform.', 403, 'EMAIL_NOT_VERIFIED');
  }

  const token = generateToken(user._id);
  const subscription = await getEffectiveSubscription(user);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: buildUserResponse(user, subscription)
  });
});

/**
 * Login with email/password
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.password) {
    throw new AppError(
      'This account was created before our authentication update and needs a new password. Please use "Forgot password" to set one.',
      401,
      'LEGACY_PASSWORD_RESET_REQUIRED'
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const requireEmailVerification = await settingsService.isEmailVerificationRequired();
  if (requireEmailVerification && !user.emailVerified) {
    throw new AppError('Email verification is required. Please verify your email address before accessing the platform.', 403, 'EMAIL_NOT_VERIFIED');
  }

  const token = generateToken(user._id);
  const subscription = await getEffectiveSubscription(user);

  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    token,
    user: buildUserResponse(user, subscription)
  });
});

/**
 * Verify a user's email using the token emailed to them
 * @route POST /api/auth/verify-email
 * @access Public
 */
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token is required', 400, 'VALIDATION_ERROR');
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError('Invalid or expired verification link', 400, 'INVALID_TOKEN');
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.'
  });
});

/**
 * Resend the email verification link
 * @route POST /api/auth/resend-verification
 * @access Public
 */
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Don't reveal whether the account exists
  if (!user || user.emailVerified) {
    return res.status(200).json({
      success: true,
      message: 'If an unverified account with that email exists, a new verification email has been sent.'
    });
  }

  await createAndSendVerificationEmail(user);

  res.status(200).json({
    success: true,
    message: 'If an unverified account with that email exists, a new verification email has been sent.'
  });
});

/**
 * Get current user info
 * @route GET /api/auth/me
 * @access Private
 */
const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId).select('-__v');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const subscription = await getEffectiveSubscription(user);

  res.status(200).json({
    success: true,
    user: {
      ...buildUserResponse(user, subscription),
      createdAt: user.createdAt
    }
  });
});

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 * @access Private
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    token
  });
});

/**
 * Change user password
 * Requires the current password for verification
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (!user.password) {
    throw new AppError(
      'This account has no password set yet. Please use "Forgot password" to set one.',
      400,
      'LEGACY_PASSWORD_RESET_REQUIRED'
    );
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMinLength = await settingsService.getPasswordMinLength();
  if (newPassword.length < passwordMinLength) {
    throw new AppError(`New password must be at least ${passwordMinLength} characters long`, 400, 'VALIDATION_ERROR');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  Logger.info(`Password changed successfully for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  getCurrentUser,
  refreshToken,
  changePassword
};
