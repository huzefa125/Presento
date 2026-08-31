const express = require('express');
const router = express.Router();
const { sendPasswordResetOTPEmail } = require('../services/emailService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

/**
 * Test email sending endpoint
 * @route POST /api/test-email
 * @access Public (for testing only - remove in production)
 */
const testEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  // Generate a test OTP
  const testOTP = String(Math.floor(100000 + Math.random() * 900000));

  try {
    Logger.info(`Testing email send to ${email}`);
    const result = await sendPasswordResetOTPEmail(email, testOTP, 'Test User');

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        emailId: result.id,
        to: email,
        from: process.env.GMAIL_USER || 'not set'
      }
    });
  } catch (error) {
    Logger.error('Test email failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: {
        message: error.message,
        code: error.code
      }
    });
  }
});

/**
 * Check email service configuration
 * @route GET /api/test-email/config
 * @access Public (for testing only - remove in production)
 */
const checkEmailConfig = asyncHandler(async (req, res, next) => {
  const hasGmailUser = !!process.env.GMAIL_USER;
  const hasGmailAppPassword = !!process.env.GMAIL_APP_PASSWORD;

  res.status(200).json({
    success: true,
    config: {
      hasGmailUser,
      hasGmailAppPassword,
      gmailUser: process.env.GMAIL_USER || 'not set',
      frontendUrl: process.env.FRONTEND_URL || 'not set',
      appName: process.env.APP_NAME || 'Presento'
    }
  });
});

router.post('/test-email', testEmail);
router.get('/test-email/config', checkEmailConfig);

module.exports = router;
