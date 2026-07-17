const mongoose = require('mongoose');

/**
 * Job Application Schema
 */
const jobApplicationSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true,
    default: ''
  },
  portfolioUrl: {
    type: String,
    trim: true,
    default: ''
  },
  githubUrl: {
    type: String,
    trim: true,
    default: ''
  },

  // Position Information
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  expectedSalary: {
    type: String,
    trim: true,
    default: ''
  },
  availability: {
    type: String,
    enum: ['immediate', '2 weeks', '1 month', '2 months', '3+ months'],
    default: '1 month'
  },

  // Professional Experience
  experience: [{
    company: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      default: 'Present'
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    }
  }],

  // Education
  education: [{
    institution: {
      type: String,
      required: true,
      trim: true
    },
    degree: {
      type: String,
      required: true,
      trim: true
    },
    field: {
      type: String,
      trim: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    gpa: {
      type: String,
      trim: true
    }
  }],

  // Skills
  skills: {
    technical: [{
      type: String,
      trim: true
    }],
    soft: [{
      type: String,
      trim: true
    }]
  },

  // Additional Information
  coverLetter: {
    type: String,
    required: true,
    trim: true
  },
  whyInavora: {
    type: String,
    trim: true,
    default: ''
  },
  additionalInfo: {
    type: String,
    trim: true,
    default: ''
  },

  // Resume/CV
  resume: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number
    }
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'],
    default: 'pending'
  },

  // Additional metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
jobApplicationSchema.index({ email: 1, position: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ createdAt: -1 });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;

