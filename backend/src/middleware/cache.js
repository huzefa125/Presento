const cacheService = require('../services/cacheService');

/**
 * Cache middleware factory
 * Caches GET request responses
 * 
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds (default: 5 minutes)
 * @param {Function} options.keyGenerator - Function to generate cache key from request
 * @param {Function} options.shouldCache - Function to determine if response should be cached
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl || req.url}`,
    shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200
  } = options;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cached = cacheService.get(cacheKey);

    if (cached !== null) {
      // Set cache hit header
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data) {
      // Set cache miss header
      res.setHeader('X-Cache', 'MISS');

      // Cache if conditions are met
      if (shouldCache(req, res)) {
        cacheService.set(cacheKey, data, ttl);
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for specific key pattern
 * @param {string|Function} keyOrFn - Cache key or function to generate key
 */
const clearCache = (keyOrFn) => {
  if (typeof keyOrFn === 'function') {
    // If function, clear all matching keys (would need pattern matching)
    // For now, just clear all (can be enhanced)
    cacheService.clear();
  } else {
    cacheService.delete(keyOrFn);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  cacheService
};

