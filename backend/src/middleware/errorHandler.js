const Logger = require('../utils/logger');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling middleware
 * Should be used as the last middleware in Express app
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log 404s as warnings since they're often expected (deleted resources, etc.)
  // Only log actual errors (5xx) or important 4xx errors at ERROR level
  if (error.statusCode === 404 && error.code === 'RESOURCE_NOT_FOUND') {
    Logger.warn(`Resource not found: ${error.message} - ${req.method} ${req.originalUrl}`);
  } else if (error.statusCode >= 500) {
    Logger.error(`Error ${error.statusCode}: ${error.message}`, err);
  } else {
    // For other 4xx errors, log as warning
    Logger.warn(`Error ${error.statusCode}: ${error.message} - ${req.method} ${req.originalUrl}`);
  }

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new AppError(message, 409, 'DUPLICATE_ENTRY');
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  if (err.code && err.code.startsWith('auth/')) {
    const statusCode = err.code === 'auth/id-token-expired' ? 401 : 400;
    const message = err.message || 'Firebase authentication error';
    error = new AppError(message, statusCode, err.code);
  }

  if (err.error && err.error.description) {
    error = new AppError(err.error.description, 400, 'PAYMENT_ERROR');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  res.status(statusCode).json({
    success: false,
    message: message,
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};

