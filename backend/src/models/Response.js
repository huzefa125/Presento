const mongoose = require('mongoose');

/**
 * Response Schema
 * Stores participant answers
 */
const responseSchema = new mongoose.Schema({
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: true,
    index: true
  },
  slideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slide',
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
  // Answer can be string (for multiple_choice, word_cloud, open_ended) or number (for scales)
  // For word_cloud with multiple submissions, this will be an array of arrays
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  voteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  voters: {
    type: [String],
    default: []
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Track submission count for word cloud interactions
  submissionCount: {
    type: Number,
    default: 1,
    min: 1
  },
  // For quiz type - track response time and correctness
  responseTime: {
    type: Number, // in milliseconds
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  // For QnA type - track if question has been answered
  isAnswered: {
    type: Boolean,
    default: false
  },
  // For QnA type - store the presenter's answer text
  presenterAnswer: {
    type: String,
    default: null,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
responseSchema.index({ slideId: 1, submittedAt: -1 });
responseSchema.index({ participantId: 1, slideId: 1 });
responseSchema.index({ presentationId: 1, slideId: 1 });
responseSchema.index({ slideId: 1, voters: 1 });

const Response = mongoose.model('Response', responseSchema);

module.exports = Response;
