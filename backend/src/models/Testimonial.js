const mongoose = require('mongoose');

/**
 * Testimonial Schema
 * Stores user testimonials/reviews for the platform
 */
const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  testimonial: {
    type: String,
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 500
  },
  role: {
    type: String,
    trim: true,
    maxlength: 100
  },
  institution: {
    type: String,
    trim: true,
    maxlength: 200
  },
  avatar: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: String,
    default: null
  },
  moderationNotes: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
testimonialSchema.index({ status: 1, createdAt: -1 });
testimonialSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
testimonialSchema.index({ rating: -1, status: 1 });
testimonialSchema.index({ userId: 1, status: 1 });

// Virtual for initials (for avatar fallback)
testimonialSchema.virtual('initials').get(function() {
  if (!this.name) return 'U';
  const parts = this.name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return this.name[0].toUpperCase();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);

