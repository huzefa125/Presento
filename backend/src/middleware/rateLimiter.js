const windows = new Map();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function getClientKey(req, keyPrefix) {
  const userPart = req.userId ? `user:${req.userId}` : `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  return `${keyPrefix}:${userPart}`;
}

function rateLimit({ windowMs = DEFAULT_WINDOW_MS, max = 100, keyPrefix = 'global' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const entry = windows.get(key);

    if (!entry || entry.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    if (entry.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: retryAfterSeconds
      });
    }

    return next();
  };
}

function cleanupRateLimitWindows() {
  const now = Date.now();
  for (const [key, entry] of windows.entries()) {
    if (entry.resetAt <= now) {
      windows.delete(key);
    }
  }
}

setInterval(cleanupRateLimitWindows, DEFAULT_WINDOW_MS).unref?.();

module.exports = {
  rateLimit
};
