const mongoose = require('mongoose');

/**
 * Image Schema
 * Tracks uploaded images with user ownership
 */
const imageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true,
    unique: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
imageSchema.index({ userId: 1, uploadedAt: -1 });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
