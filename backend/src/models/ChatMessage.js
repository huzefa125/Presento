const mongoose = require('mongoose');

/**
 * ChatMessage Schema
 * Stores live chat messages sent during presentations
 */
const chatMessageSchema = new mongoose.Schema({
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    default: 'Participant'
  },
  isPresenter: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for fetching recent chat messages per presentation ordered by time
chatMessageSchema.index({ presentationId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
