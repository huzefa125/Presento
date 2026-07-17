const mongoose = require('mongoose');

/**
 * Presentation Schema
 */
const presentationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  isLive: {
    type: Boolean,
    default: false,
    index: true
  },
  currentSlideIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  accessCode: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    index: true
  },
  showResults: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes
presentationSchema.index({ userId: 1, createdAt: -1 });
presentationSchema.index({ accessCode: 1, isLive: 1 });

// Static method to generate access code
presentationSchema.statics.generateAccessCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Instance method to start presentation
presentationSchema.methods.start = async function() {
  this.isLive = true;
  this.currentSlideIndex = 0;
  return await this.save();
};

// Instance method to end presentation
presentationSchema.methods.end = async function() {
  this.isLive = false;
  return await this.save();
};

// Instance method to change slide
presentationSchema.methods.changeSlide = async function(slideIndex) {
  this.currentSlideIndex = slideIndex;
  return await this.save();
};

const Presentation = mongoose.model('Presentation', presentationSchema);

module.exports = Presentation;
