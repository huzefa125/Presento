const crypto = require('crypto');

// crypto.timingSafeEqual throws if the two buffers differ in length, so that's
// checked first - a length mismatch alone doesn't leak anything an attacker
// doesn't already know (every signature compared here is the same fixed-length
// HMAC-SHA256 hex digest), only byte-for-byte content comparison needs to run
// in constant time.
function timingSafeEqualStrings(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { timingSafeEqualStrings };
