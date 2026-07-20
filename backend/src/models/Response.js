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
  },
  interactionType: {
    type: String,
    default: null,
    index: true
  },
  // Set true only for slide types that allow exactly one response per participant
  // (multiple_choice, scales, ranking, pin_on_image, 2x2_grid, hundred_points, ...).
  // word_cloud/open_ended/type_answer intentionally allow repeated submissions and
  // must never set this, or the unique index below would reject their updates.
  singleSubmission: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
responseSchema.index({ slideId: 1, submittedAt: -1 });
responseSchema.index({ participantId: 1, slideId: 1 });
responseSchema.index({ presentationId: 1, slideId: 1 });
responseSchema.index({ slideId: 1, voters: 1 });
responseSchema.index(
  { slideId: 1, participantId: 1, interactionType: 1 },
  {
    unique: true,
    partialFilterExpression: { interactionType: 'guess_number' }
  }
);
// DB-level backstop for the generic "one response per participant" slide types -
// the application-level findOne-then-create check above is a check-then-act race
// under concurrent submissions; this index turns a race into a clean duplicate-key
// error instead of two silently-coexisting responses.
responseSchema.index(
  { slideId: 1, participantId: 1 },
  {
    unique: true,
    partialFilterExpression: { singleSubmission: true }
  }
);

const Response = mongoose.model('Response', responseSchema);

module.exports = Response;
