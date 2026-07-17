const mongoose = require('mongoose');

/**
 * ParticipantScore Schema
 * Tracks cumulative scores for participants across an entire presentation
 */
const participantScoreSchema = new mongoose.Schema({
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: true,
    index: true
  },
  participantId: {
    type: String,
    required: true,
    index: true // UUID generated on client
  },
  participantName: {
    type: String,
    required: true,
    trim: true,
    default: 'Anonymous'
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  quizScores: [{
    slideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slide',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    responseTime: {
      type: Number, // in milliseconds
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
participantScoreSchema.index({ presentationId: 1, participantId: 1 }, { unique: true });
participantScoreSchema.index({ presentationId: 1, totalScore: -1 }); // For leaderboard queries

// Update lastUpdated on save
participantScoreSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const ParticipantScore = mongoose.model('ParticipantScore', participantScoreSchema);

module.exports = ParticipantScore;
