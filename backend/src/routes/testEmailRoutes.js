const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail } = require('../services/emailService');
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

  // Generate a test token
  const testToken = 'test_token_' + Date.now();

  try {
    Logger.info(`Testing email send to ${email}`);
    const result = await sendPasswordResetEmail(email, testToken, 'Test User');
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        emailId: result.id,
        to: email,
        from: process.env.RESEND_FROM_EMAIL || 'noreply@inavora.com'
      }
    });
  } catch (error) {
    Logger.error('Test email failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: {
        message: error.message,
        code: error.code,
        response: error.response?.data || null
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
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const hasFromEmail = !!process.env.RESEND_FROM_EMAIL;
  const apiKeyValid = hasApiKey && process.env.RESEND_API_KEY.startsWith('re_');
  
  res.status(200).json({
    success: true,
    config: {
      hasApiKey,
      hasFromEmail,
      apiKeyValid,
      apiKeyPrefix: hasApiKey ? process.env.RESEND_API_KEY.substring(0, 5) + '...' : 'not set',
      fromEmail: process.env.RESEND_FROM_EMAIL || 'not set',
      frontendUrl: process.env.FRONTEND_URL || 'not set',
      appName: process.env.APP_NAME || 'Inavora'
    }
  });
});

router.post('/test-email', testEmail);
router.get('/test-email/config', checkEmailConfig);

module.exports = router;

