const mongoose = require('mongoose');

/**
 * Institution Registration Schema
 * Stores incomplete registration data for 7 days
 */
const institutionRegistrationSchema = new mongoose.Schema({
  // Step 1: Basic Information
  institutionName: {
    type: String,
    required: true,
    trim: true
  },
  institutionEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  country: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    default: null
  },
  institutionType: {
    type: String,
    enum: ['University', 'School', 'Corporate', 'NGO', 'Other'],
    default: null
  },
  expectedUsers: {
    type: String,
    default: null
  },
  
  // Step 2: Plan Selection
  selectedPlan: {
    type: String,
    default: null
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: null
  },
  maxUsers: {
    type: Number,
    default: null
  },
  
  // Step 3: Payment
  paymentIntentId: {
    type: String,
    default: null
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  billingAddress: {
    type: String,
    default: null
  },
  taxId: {
    type: String,
    default: null
  },
  billingEmail: {
    type: String,
    default: null
  },
  
  // Step 4: Email Verification
  institutionEmailVerified: {
    type: Boolean,
    default: false
  },
  adminEmailVerified: {
    type: Boolean,
    default: false
  },
  institutionEmailToken: {
    type: String,
    default: null
  },
  adminEmailToken: {
    type: String,
    default: null
  },
  institutionEmailTokenExpiry: {
    type: Date,
    default: null
  },
  adminEmailTokenExpiry: {
    type: Date,
    default: null
  },
  
  // Step 5: Password
  password: {
    type: String,
    default: null // Will be hashed before saving
  },
  securityQuestion: {
    type: String,
    default: null
  },
  securityAnswer: {
    type: String,
    default: null
  },
  
  // Registration tracking
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  registrationToken: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
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

// Indexes
// Note: registrationToken already has unique: true which creates an index
institutionRegistrationSchema.index({ institutionEmail: 1 });
institutionRegistrationSchema.index({ adminEmail: 1 });
institutionRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete after expiry

const InstitutionRegistration = mongoose.model('InstitutionRegistration', institutionRegistrationSchema);

module.exports = InstitutionRegistration;

