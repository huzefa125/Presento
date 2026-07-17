const express = require('express');
const router = express.Router();
const institutionRegistrationController = require('../controllers/institutionRegistrationController');

/**
 * @route   POST /api/institution/register/start
 * @desc    Start institution registration (Step 1)
 * @access  Public
 */
router.post('/start', 
  // No rate limiting - allow users to start registration freely
  institutionRegistrationController.startRegistration
);

/**
 * @route   GET /api/institution/register/plans
 * @desc    Get available institution plans
 * @access  Public
 */
router.get('/plans', institutionRegistrationController.getPlans);

/**
 * @route   POST /api/institution/register/select-plan
 * @desc    Select subscription plan (Step 2)
 * @access  Public
 */
router.post('/select-plan', 
  institutionRegistrationController.selectPlan
);

/**
 * @route   POST /api/institution/register/send-verification
 * @desc    Send email verification emails (Step 3)
 * @access  Public
 */
router.post('/send-verification', 
  institutionRegistrationController.sendEmailVerification
);

/**
 * @route   POST /api/institution/register/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', 
  institutionRegistrationController.verifyEmail
);

/**
 * @route   POST /api/institution/register/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', 
  institutionRegistrationController.resendVerificationEmail
);

/**
 * @route   POST /api/institution/register/validate-password
 * @desc    Validate password (Step 3)
 * @access  Public
 */
router.post('/validate-password', 
  institutionRegistrationController.validatePassword
);

/**
 * @route   POST /api/institution/register/create-payment
 * @desc    Create payment order (Step 5)
 * @access  Public
 */
router.post('/create-payment', 
  institutionRegistrationController.createPaymentOrder
);

/**
 * @route   POST /api/institution/register/complete
 * @desc    Complete registration after payment (Step 5)
 * @access  Public
 */
router.post('/complete', 
  institutionRegistrationController.completeRegistration
);

/**
 * @route   GET /api/institution/register/status
 * @desc    Get registration status
 * @access  Public
 */
router.get('/status', institutionRegistrationController.getRegistrationStatus);

module.exports = router;

