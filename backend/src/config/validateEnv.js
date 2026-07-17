/**
 * Environment variable validation
 * Ensures all required environment variables are set before server starts
 */

const requiredEnvVars = {
  PORT: process.env.PORT || '4000',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

const optionalEnvVars = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  SUPER_ADMIN_JWT_SECRET: process.env.SUPER_ADMIN_JWT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  APP_NAME: process.env.APP_NAME,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

/**
 * Validate required environment variables
 * @throws {Error} If any required variable is missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  });

  if (!optionalEnvVars.CLOUDINARY_CLOUD_NAME) {
    warnings.push('CLOUDINARY_CLOUD_NAME (image uploads will be disabled)');
  }

  if (!optionalEnvVars.RAZORPAY_KEY_ID) {
    warnings.push('RAZORPAY_KEY_ID (payment features will be disabled)');
  }

  if (!optionalEnvVars.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY (password reset emails will be disabled)');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }

  if (requiredEnvVars.MONGODB_URI && !requiredEnvVars.MONGODB_URI.startsWith('mongodb://') && !requiredEnvVars.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  if (requiredEnvVars.FRONTEND_URL && !requiredEnvVars.FRONTEND_URL.startsWith('http://') && !requiredEnvVars.FRONTEND_URL.startsWith('https://')) {
    throw new Error('FRONTEND_URL must start with http:// or https://');
  }

  if (optionalEnvVars.NODE_ENV === 'production' && requiredEnvVars.JWT_SECRET && requiredEnvVars.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }

  return true;
}

module.exports = { validateEnv, requiredEnvVars, optionalEnvVars };

