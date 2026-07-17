const crypto = require('crypto');
const Logger = require('../utils/logger');

/**
 * Request logging middleware with request ID tracking and response time monitoring
 * Logs all incoming requests with:
 * - Request ID (for tracing)
 * - Method, URL, IP
 * - Response status, time taken
 * - User ID (if authenticated)
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID using crypto (built-in, no dependencies)
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  
  // Set request ID in response header for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Capture start time
  const startTime = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Get user ID if authenticated
    const userId = req.userId || req.institutionId || null;
    
    // Build log message
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'] || 'unknown',
      ...(userId && { userId })
    };
    
    // Log based on status code
    // Only log successful requests (2xx, 3xx) if LOG_LEVEL is 'info' or 'debug'
    // Always log errors (4xx, 5xx) as warnings/errors
    if (res.statusCode >= 500) {
      Logger.error(`[${requestId}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${responseTime}ms)`, logData);
    } else if (res.statusCode >= 400) {
      Logger.warn(`[${requestId}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${responseTime}ms)`);
    } else {
      // Only log successful requests if log level is info or debug
      // This reduces noise in the terminal
      Logger.info(`[${requestId}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${responseTime}ms)`);
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Middleware to skip logging for health check and other monitoring endpoints
 * Use this to exclude certain routes from detailed logging
 */
const skipLogging = (paths = []) => {
  const defaultPaths = ['/health', '/health/ready', '/health/live'];
  const skipPaths = [...defaultPaths, ...paths];
  
  return (req, res, next) => {
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    return requestLogger(req, res, next);
  };
};

module.exports = {
  requestLogger,
  skipLogging
};

