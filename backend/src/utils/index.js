/**
 * Utils Index
 *
 * The standard toolkit for a controller. One import line covers the whole
 * request/response lifecycle:
 *
 *   const {
 *     asyncHandler, ok, created, paginated, notFound, forbidden,
 *     parsePagination, buildPagination, Logger
 *   } = require('../utils');
 *
 * asyncHandler and AppError live in middleware/errorHandler (where the
 * matching error middleware is) and are re-exported here so callers do not
 * need to know which of the two folders a given helper came from.
 */

const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('./logger');
const apiResponse = require('./apiResponse');
const httpErrors = require('./httpErrors');
const pagination = require('./pagination');

module.exports = {
  // Error plumbing
  AppError,
  asyncHandler,
  ...httpErrors,

  // Success responses
  ...apiResponse,

  // Pagination
  ...pagination,

  // Logging
  Logger
};
