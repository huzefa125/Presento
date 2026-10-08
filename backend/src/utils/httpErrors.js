/**
 * Error factories for the standard HTTP failure cases.
 *
 * Throwing one of these from inside an asyncHandler is all a controller has
 * to do - middleware/errorHandler turns it into the failure envelope and
 * logs it at the right level. This removes the need to remember which status
 * code and which machine-readable `code` string pairs with each situation.
 *
 * Usage:
 *   const { notFound } = require('../utils/httpErrors');
 *   const doc = await Testimonial.findById(id);
 *   if (!doc) throw notFound('Testimonial');
 *
 * The `code` values are stable identifiers the frontend may branch on; keep
 * them in sync with frontend/src/lib/apiError.js.
 */

const { AppError } = require('../middleware/errorHandler');

/** 400 - the request itself is malformed or fails validation. */
const badRequest = (message = 'Bad request', code = 'BAD_REQUEST') =>
  new AppError(message, 400, code);

/** 401 - no valid credentials were supplied. */
const unauthorized = (message = 'Authentication required', code = 'UNAUTHORIZED') =>
  new AppError(message, 401, code);

/** 403 - credentials are valid but do not permit this action. */
const forbidden = (message = 'You do not have permission to perform this action', code = 'FORBIDDEN') =>
  new AppError(message, 403, code);

/**
 * 404 - the addressed resource does not exist.
 *
 * Pass the resource name ('Testimonial') rather than a sentence; the message
 * is assembled here so 404 text stays uniform across the API.
 */
const notFound = (resource = 'Resource', code = 'RESOURCE_NOT_FOUND') =>
  new AppError(`${resource} not found`, 404, code);

/** 409 - the request conflicts with current state, e.g. a duplicate. */
const conflict = (message = 'Resource already exists', code = 'DUPLICATE_ENTRY') =>
  new AppError(message, 409, code);

/** 413 - the uploaded body or file is larger than the limit. */
const payloadTooLarge = (message = 'File is too large', code = 'PAYLOAD_TOO_LARGE') =>
  new AppError(message, 413, code);

/** 429 - the caller has exceeded a rate or plan limit. */
const tooManyRequests = (message = 'Too many requests, please try again later', code = 'RATE_LIMITED') =>
  new AppError(message, 429, code);

/**
 * 500 - an unexpected internal failure.
 *
 * Prefer letting the original error propagate to errorHandler; reach for this
 * only when wrapping a third-party failure in a message fit for a user.
 */
const serverError = (message = 'Server error', code = 'INTERNAL_ERROR') =>
  new AppError(message, 500, code);

/** 503 - a dependency (payment provider, mail, storage) is unavailable. */
const serviceUnavailable = (message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') =>
  new AppError(message, 503, code);

module.exports = {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  payloadTooLarge,
  tooManyRequests,
  serverError,
  serviceUnavailable
};
