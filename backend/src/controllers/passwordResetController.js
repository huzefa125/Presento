const bcrypt = require('bcryptjs');
const PasswordResetToken = require('../models/PasswordResetToken');
const Institution = require('../models/Institution');
const User = require('../models/User');
const { sendPasswordResetOTPEmail, sendPasswordResetSuccessEmail } = require('../services/emailService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

/**
 * Request password reset
 * @route POST /api/password-reset/request
 * @access Public
 */
const requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  // Check if email belongs to an institution admin (only admin email can reset password)
  let institution = await Institution.findOne({
    adminEmail: normalizedEmail,
    isActive: true
  });

  if (institution) {
    // Institution admin password reset - generate OTP
    const otpDoc = await PasswordResetToken.createOTP(
      normalizedEmail,
      'institution_admin',
      institution._id,
      'Institution',
      { ipAddress, userAgent }
    );

      try {
        console.log('📧 Attempting to send password reset OTP for institution admin...');
        const emailResult = await sendPasswordResetOTPEmail(
          normalizedEmail,
          otpDoc.token, // OTP is stored in token field
          institution.adminName || institution.name
        );
        console.log('📧 Email result:', emailResult);
        Logger.info(`Password reset OTP sent successfully to ${normalizedEmail}`, {
          emailId: emailResult?.id
        });
      } catch (emailError) {
        console.error('❌ Email sending failed for institution admin:');
        console.error('Error:', emailError);
        Logger.error('Failed to send password reset OTP', {
          error: emailError.message,
          stack: emailError.stack,
          email: normalizedEmail,
          errorCode: emailError.code,
          errorName: emailError.name,
          errorResponse: emailError.response?.data || null
        });
        // Don't fail the request if email fails, but log it
        console.error('Email sending error details:', emailError);
      }

    // Always return success to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Check if email belongs to a regular user
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const otpDoc = await PasswordResetToken.createOTP(
      normalizedEmail,
      'user',
      user._id,
      'User',
      { ipAddress, userAgent }
    );

    try {
      console.log('📧 Attempting to send password reset OTP for user...');
      const emailResult = await sendPasswordResetOTPEmail(
        normalizedEmail,
        otpDoc.token, // OTP is stored in token field
        user.displayName || null
      );
      console.log('📧 Email result:', emailResult);
      Logger.info(`Password reset OTP sent successfully to ${normalizedEmail}`, {
        emailId: emailResult?.id
      });
    } catch (emailError) {
      console.error('❌ Email sending failed for user:');
      console.error('Error:', emailError);
      Logger.error('Failed to send password reset OTP', {
        error: emailError.message,
        stack: emailError.stack,
        email: normalizedEmail,
        errorCode: emailError.code,
        errorName: emailError.name,
        errorResponse: emailError.response?.data || null
      });
      // Don't fail the request if email fails, but log it
      console.error('Email sending error details:', emailError);
    }

    // Always return success to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset OTP has been sent.'
    });
  }

  // Always return success to prevent email enumeration
  // Even if user doesn't exist, we return the same message
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset OTP has been sent.'
  });
});

/**
 * Verify OTP
 * @route POST /api/password-reset/verify-otp
 * @access Public
 */
const verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400, 'VALIDATION_ERROR');
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError('OTP must be a 6-digit number', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const otpDoc = await PasswordResetToken.verifyOTP(normalizedEmail, otp);

  if (!otpDoc) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  res.status(200).json({
    success: true,
    message: 'OTP is valid',
    data: {
      email: otpDoc.email,
      userType: otpDoc.userType
    }
  });
});

/**
 * Reset password
 * @route POST /api/password-reset/reset
 * @access Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new AppError('Email, OTP, and new password are required', 400, 'VALIDATION_ERROR');
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError('OTP must be a 6-digit number', 400, 'VALIDATION_ERROR');
  }

  // Validate password strength
  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify and use OTP
  const otpDoc = await PasswordResetToken.verifyAndUseOTP(normalizedEmail, otp);

  if (!otpDoc) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  const ipAddress = req.ip || req.connection.remoteAddress;
  const resetTime = new Date();

  // Reset password based on user type
  if (otpDoc.userType === 'institution_admin') {
      // Reset institution admin password
      let institution = null;
      
      if (otpDoc.userId) {
        institution = await Institution.findById(otpDoc.userId);
      }
      
      if (!institution) {
        // Try to find by email
        institution = await Institution.findOne({
          $or: [
            { email: otpDoc.email },
            { adminEmail: otpDoc.email }
          ],
          isActive: true
        });
      }

      if (!institution) {
        throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
      }

      // Hash password using bcrypt (check if already hashed)
      let hashedPassword;
      if (institution.password && institution.password.startsWith('$2')) {
        // Already hashed, just update
        hashedPassword = await bcrypt.hash(newPassword, 10);
      } else {
        // Plain text, hash it
        hashedPassword = await bcrypt.hash(newPassword, 10);
      }
      institution.password = hashedPassword;
      await institution.save();

      // Send success email
      try {
        await sendPasswordResetSuccessEmail(
          otpDoc.email,
          institution.adminName || institution.name,
          ipAddress,
          resetTime
        );
      } catch (emailError) {
        Logger.error('Failed to send password reset success email', emailError);
      }

      Logger.info(`Password reset successful for institution admin: ${otpDoc.email}`);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });
      return;
  } else if (otpDoc.userType === 'user') {
    // Reset a regular user's password (this is also how legacy Firebase-era
    // accounts get their first password on the new auth system)
    const user = await User.findOne({ email: otpDoc.email });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Send success email
    try {
      await sendPasswordResetSuccessEmail(
        otpDoc.email,
        user.displayName || null,
        ipAddress,
        resetTime
      );
    } catch (emailError) {
      Logger.error('Failed to send password reset success email', emailError);
    }

    Logger.info(`Password reset successful for user: ${otpDoc.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } else {
    throw new AppError('Invalid user type', 400, 'VALIDATION_ERROR');
  }
});

module.exports = {
  requestPasswordReset,
  verifyOTP,
  resetPassword
};

