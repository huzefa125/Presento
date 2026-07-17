const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Password Reset Token Schema
 * Stores reset tokens for password reset functionality
 */
const passwordResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['firebase_user', 'institution_admin'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userTypeModel',
    default: null
  },
  userTypeModel: {
    type: String,
    enum: ['User', 'Institution'],
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired tokens
  },
  used: {
    type: Boolean,
    default: false,
    index: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
passwordResetTokenSchema.index({ email: 1, used: 1 });
passwordResetTokenSchema.index({ token: 1, used: 1, expiresAt: 1 });

/**
 * Generate a secure random token (for link-based reset)
 * @returns {string} Random token
 */
passwordResetTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
passwordResetTokenSchema.statics.generateOTP = function() {
  // Generate a 6-digit OTP (000000 to 999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create a new reset token (for link-based reset)
 * @param {string} email - User email
 * @param {string} userType - Type of user (firebase_user or institution_admin)
 * @param {mongoose.Types.ObjectId} userId - User ID (optional)
 * @param {string} userTypeModel - Model name (User or Institution)
 * @param {Object} metadata - Additional metadata (ipAddress, userAgent)
 * @returns {Promise<Object>} Created token document
 */
passwordResetTokenSchema.statics.createToken = async function(email, userType, userId = null, userTypeModel = null, metadata = {}) {
  // Invalidate any existing unused tokens for this email
  await this.updateMany(
    { email: email.toLowerCase(), used: false },
    { used: true }
  );

  const token = this.generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

  return this.create({
    email: email.toLowerCase(),
    token,
    userType,
    userId,
    userTypeModel,
    expiresAt,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
};

/**
 * Create a new OTP for password reset
 * @param {string} email - User email
 * @param {string} userType - Type of user (firebase_user or institution_admin)
 * @param {mongoose.Types.ObjectId} userId - User ID (optional)
 * @param {string} userTypeModel - Model name (User or Institution)
 * @param {Object} metadata - Additional metadata (ipAddress, userAgent)
 * @returns {Promise<Object>} Created OTP document
 */
passwordResetTokenSchema.statics.createOTP = async function(email, userType, userId = null, userTypeModel = null, metadata = {}) {
  // Invalidate any existing unused OTPs for this email
  await this.updateMany(
    { email: email.toLowerCase(), used: false },
    { used: true }
  );

  const otp = this.generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

  return this.create({
    email: email.toLowerCase(),
    token: otp, // Store OTP in token field
    userType,
    userId,
    userTypeModel,
    expiresAt,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
};

/**
 * Verify and mark token as used
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} Token document if valid, null otherwise
 */
passwordResetTokenSchema.statics.verifyAndUseToken = async function(token) {
  const tokenDoc = await this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    return null;
  }

  // Mark token as used
  tokenDoc.used = true;
  await tokenDoc.save();

  return tokenDoc;
};

/**
 * Verify OTP without marking as used (for verification step)
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @returns {Promise<Object|null>} OTP document if valid, null otherwise
 */
passwordResetTokenSchema.statics.verifyOTP = async function(email, otp) {
  const otpDoc = await this.findOne({
    email: email.toLowerCase(),
    token: otp,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  return otpDoc;
};

/**
 * Verify and mark OTP as used
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @returns {Promise<Object|null>} OTP document if valid, null otherwise
 */
passwordResetTokenSchema.statics.verifyAndUseOTP = async function(email, otp) {
  const otpDoc = await this.findOne({
    email: email.toLowerCase(),
    token: otp,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpDoc) {
    return null;
  }

  // Mark OTP as used
  otpDoc.used = true;
  await otpDoc.save();

  return otpDoc;
};

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

module.exports = PasswordResetToken;

