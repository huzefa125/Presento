/**
 * Shared Razorpay client + pricing constant for institution billing handlers.
 * Split out of the former institutionAdminController.js monolith.
 */
const Razorpay = require('razorpay');
const Logger = require('../../utils/logger');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    Logger.startup('Razorpay initialized successfully for additional users payment');
  } catch (error) {
    Logger.error('Failed to initialize Razorpay', {
      message: error.message,
      error: error
    });
  }
} else {
  Logger.warn('Razorpay not initialized: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
}

// Price per additional user (₹499 in paise)
const ADDITIONAL_USER_PRICE = 49900; // ₹499 in paise

module.exports = { razorpay, ADDITIONAL_USER_PRICE };
