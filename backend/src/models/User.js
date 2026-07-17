const mongoose = require('mongoose');

/**
 * User Schema - Presenter accounts
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  photoURL: {
    type: String,
    default: null
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // For Firebase Auth integration
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'lifetime', 'institution'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime', 'one-time'],
      default: null
    },
    razorpayCustomerId: {
      type: String
    },
    // Track original plan before institution (for restoration when institution expires)
    originalPlan: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'lifetime', null],
        default: null
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', null],
        default: null
      },
      endDate: {
        type: Date,
        default: null
      }
    },
    // Institution plan inheritance
    institutionPlan: {
      institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        default: null
      },
      inheritedFrom: {
        type: String,
        default: null // 'institution' when plan is inherited
      },
      institutionPlanStatus: {
        type: String,
        enum: ['active', 'expired', 'cancelled', null],
        default: null
      }
    }
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null,
    index: true
  },
  isInstitutionUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

module.exports = User;
