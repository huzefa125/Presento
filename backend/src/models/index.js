/**
 * Models Index
 * Export all models from a single file
 */

const User = require('./User');
const Presentation = require('./Presentation');
const Slide = require('./Slide');
const Response = require('./Response');

module.exports = {
  User,
  Presentation,
  Slide,
  Response
};
