/**
 * Models Index
 *
 * Single import point for every Mongoose model, so callers can write
 *   const { User, Testimonial } = require('../models');
 * instead of one require per model with hand-written relative paths.
 *
 * Keep this list complete - a model missing from here is the reason the
 * barrel gets bypassed and the two import styles drift apart.
 */

module.exports = {
  ChatMessage: require('./ChatMessage'),
  Image: require('./Image'),
  Institution: require('./Institution'),
  InstitutionRegistration: require('./InstitutionRegistration'),
  JobApplication: require('./JobApplication'),
  JobPosting: require('./JobPosting'),
  ParticipantScore: require('./ParticipantScore'),
  PasswordResetToken: require('./PasswordResetToken'),
  Payment: require('./Payment'),
  Presentation: require('./Presentation'),
  Response: require('./Response'),
  Settings: require('./Settings'),
  Slide: require('./Slide'),
  Testimonial: require('./Testimonial'),
  User: require('./User')
};
