const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');
const initializeFirebase = require('../config/firebase');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const { getEffectivePlan } = require('../services/institutionPlanService');
const settingsService = require('../services/settingsService');

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  try {
    initializeFirebase();
  } catch (e) {
    Logger.error('Failed to initialize Firebase Admin in authController', e);
  }
}

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
 * Register/Login with Firebase token
 * Frontend sends Firebase ID token, backend verifies it and returns JWT
 * @route POST /api/auth/firebase
 * @access Public
 */
const authenticateWithFirebase = asyncHandler(async (req, res, next) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    throw new AppError('Firebase token is required', 400, 'MISSING_TOKEN');
  }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, name, picture } = decodedToken;

    // Get full user record from Firebase to get displayName
    const firebaseUser = await admin.auth().getUser(uid);
    const displayName = firebaseUser.displayName || name || 'Anonymous User';
    
    // Check if user has email/password provider (not just Google OAuth)
    const hasPasswordProvider = firebaseUser.providerData.some(
      provider => provider.providerId === 'password'
    );

    // Check if user exists by firebaseUid
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if registration is enabled
      const registrationEnabled = await settingsService.isRegistrationEnabled();
      if (!registrationEnabled) {
        throw new AppError('Registration is currently disabled. Please contact support for assistance.', 403, 'REGISTRATION_DISABLED');
      }

      // Check if email verification is required
      const requireEmailVerification = await settingsService.isEmailVerificationRequired();
      if (requireEmailVerification && !decodedToken.email_verified) {
        throw new AppError('Email verification is required. Please verify your email address before accessing the platform.', 403, 'EMAIL_NOT_VERIFIED');
      }

      // Check if email already exists (user registered with email/password)
      const existingUser = await User.findOne({ email: email });

      if (existingUser) {
        // Link Firebase UID to existing user
        existingUser.firebaseUid = uid;
        if (!existingUser.displayName || existingUser.displayName === 'Anonymous User') {
          existingUser.displayName = displayName;
        }
        if (!existingUser.photoURL && picture) {
          existingUser.photoURL = picture;
        }
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        user = new User({
          firebaseUid: uid,
          email: email || `${uid}@firebase.user`,
          displayName: displayName,
          photoURL: picture || firebaseUser.photoURL || null
        });
        await user.save();
      }
    } else {
      // Update displayName if it was Anonymous User
      if ((!user.displayName || user.displayName === 'Anonymous User') && displayName !== 'Anonymous User') {
        user.displayName = displayName;
        await user.save();
      }
    }

  // Generate JWT token
  const token = generateToken(user._id);

  // Get effective plan for institution users
  let subscription = user.subscription;
  if (user.isInstitutionUser && user.institutionId) {
    try {
      const effectivePlan = await getEffectivePlan(user);
      // Create subscription object with effective plan
      subscription = {
        ...user.subscription.toObject(),
        plan: effectivePlan.plan,
        status: effectivePlan.status,
        endDate: effectivePlan.endDate
      };
    } catch (error) {
      Logger.error('Error getting effective plan in authenticateWithFirebase', error);
      // Fall back to user's subscription if error
    }
  }

  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      subscription: subscription,
      isInstitutionUser: user.isInstitutionUser,
      institutionId: user.institutionId,
      hasPasswordProvider: hasPasswordProvider
    }
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

  // Get effective plan for institution users
  let subscription = user.subscription;
  if (user.isInstitutionUser && user.institutionId) {
    try {
      const effectivePlan = await getEffectivePlan(user);
      // Create subscription object with effective plan
      subscription = {
        ...user.subscription.toObject(),
        plan: effectivePlan.plan,
        status: effectivePlan.status,
        endDate: effectivePlan.endDate
      };
    } catch (error) {
      Logger.error('Error getting effective plan in getCurrentUser', error);
      // Fall back to user's subscription if error
    }
  }

  // Get Firebase user to check provider
  let hasPasswordProvider = false;
  if (user.firebaseUid) {
    try {
      const firebaseUser = await admin.auth().getUser(user.firebaseUid);
      hasPasswordProvider = firebaseUser.providerData.some(
        provider => provider.providerId === 'password'
      );
    } catch (error) {
      Logger.error('Error getting Firebase user provider data', error);
    }
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      subscription: subscription,
      isInstitutionUser: user.isInstitutionUser,
      institutionId: user.institutionId,
      createdAt: user.createdAt,
      hasPasswordProvider: hasPasswordProvider
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
 * Requires re-authentication with current password via Firebase token
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { firebaseToken, newPassword } = req.body;
  const userId = req.userId;

  if (!firebaseToken || !newPassword) {
    throw new AppError('Firebase token and new password are required', 400, 'VALIDATION_ERROR');
  }

  // Get user from database
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify Firebase token to ensure user re-authenticated with current password
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  } catch (error) {
    throw new AppError('Invalid or expired authentication token. Please re-enter your current password.', 401, 'INVALID_TOKEN');
  }

  // Verify the token belongs to the current user
  if (!user.firebaseUid || decodedToken.uid !== user.firebaseUid) {
    throw new AppError('Token does not match current user', 401, 'UNAUTHORIZED');
  }

  // Get password minimum length from settings
  const passwordMinLength = await settingsService.getPasswordMinLength();
  
  if (newPassword.length < passwordMinLength) {
    throw new AppError(`New password must be at least ${passwordMinLength} characters long`, 400, 'VALIDATION_ERROR');
  }

  // Update password in Firebase
  try {
    await admin.auth().updateUser(decodedToken.uid, {
      password: newPassword
    });

    Logger.info(`Password changed successfully for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (firebaseError) {
    Logger.error('Firebase error during password change', firebaseError);
    
    if (firebaseError.code === 'auth/user-not-found') {
      throw new AppError('User not found in authentication system', 404, 'USER_NOT_FOUND');
    }
    
    throw new AppError('Failed to change password. Please try again.', 500, 'INTERNAL_ERROR');
  }
});

module.exports = {
  authenticateWithFirebase,
  getCurrentUser,
  refreshToken,
  changePassword
};
