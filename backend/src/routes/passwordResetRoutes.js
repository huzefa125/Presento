const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const { sanitizeInput } = require('../middleware/sanitize');
const { rateLimit } = require('../middleware/rateLimiter');

const forgotPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'forgot-password' });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'otp' });

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email to the user
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *     responses:
 *       200:
 *         description: Password reset email sent (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/request',
  forgotPasswordLimiter,
  sanitizeInput,
  passwordResetController.requestPasswordReset
);

/**
 * @swagger
 * /api/password-reset/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verify if a password reset OTP is valid
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit OTP code
 *     responses:
 *       200:
 *         description: OTP is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     userType:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/verify-otp',
  otpLimiter,
  sanitizeInput,
  passwordResetController.verifyOTP
);

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     summary: Reset password
 *     description: Reset password using a valid OTP
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit OTP code
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/reset',
  otpLimiter,
  sanitizeInput,
  passwordResetController.resetPassword
);

module.exports = router;

