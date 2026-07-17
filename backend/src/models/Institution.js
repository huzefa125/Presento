const mongoose = require('mongoose');

/**
 * Institution Schema
 */
const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  adminEmail: {
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
  password: {
    type: String,
    required: true
  },
  logo: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    }
  },
  branding: {
    primaryColor: {
      type: String,
      default: '#3b82f6' // Blue
    },
    secondaryColor: {
      type: String,
      default: '#14b8a6' // Teal
    },
    logoUrl: {
      type: String,
      default: null
    },
    customDomain: {
      type: String,
      default: null
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['institution'],
      default: 'institution'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    maxUsers: {
      type: Number,
      default: 10,
      min: 10
    },
    currentUsers: {
      type: Number,
      default: 0
    },
    billingCycle: {
      type: String,
      enum: ['yearly'],
      default: 'yearly'
    },
    razorpayCustomerId: {
      type: String
    }
  },
  settings: {
    aiFeaturesEnabled: {
      type: Boolean,
      default: true
    },
    exportEnabled: {
      type: Boolean,
      default: true
    },
    watermarkEnabled: {
      type: Boolean,
      default: false
    },
    analyticsEnabled: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerification: {
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
    }
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'email_verification', 'payment_pending', 'active', 'incomplete'],
    default: 'pending'
  },
  registrationData: {
    country: String,
    phoneNumber: String,
    institutionType: String,
    expectedUsers: String
  },
  apiKeys: [{
    id: String,
    name: String,
    key: String,
    active: { type: Boolean, default: true },
    createdAt: Date
  }],
  webhooks: [{
    id: String,
    url: String,
    events: [String],
    secret: String,
    active: { type: Boolean, default: true },
    createdAt: Date
  }],
  customReports: [{
    id: String,
    name: String,
    description: String,
    metrics: [String],
    dateRange: {
      start: String,
      end: String
    },
    filters: {
      userStatus: String,
      presentationStatus: String
    },
    visualization: String,
    schedule: String,
    email: String,
    frequency: String,
    createdAt: Date
  }],
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    passwordMinLength: { type: Number, default: 8 },
    passwordRequireUppercase: { type: Boolean, default: true },
    passwordRequireLowercase: { type: Boolean, default: true },
    passwordRequireNumbers: { type: Boolean, default: true },
    passwordRequireSpecialChars: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 },
    requireEmailVerification: { type: Boolean, default: true }
  },
  auditLogs: [{
    timestamp: { type: Date, default: Date.now },
    action: String,
    user: String,
    details: String,
    ipAddress: String
  }],
  scheduledReports: [{
    type: String,
    format: String,
    schedule: String,
    email: String,
    frequency: String,
    createdAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
// Note: email already has unique: true which creates an index, so we don't need to add it again
institutionSchema.index({ adminEmail: 1 });
institutionSchema.index({ 'subscription.status': 1 });

const Institution = mongoose.model('Institution', institutionSchema);

module.exports = Institution;

