/**
 * Turn an Axios error into a plain, user-facing message.
 *
 * The backend's failure envelope (see backend/src/middleware/errorHandler.js)
 * is `{ success: false, message, error, code }`. This reads it with the same
 * fallback order AuthContext already used (message, then error, then the
 * Axios-level message, then a default), so call sites stop repeating
 * `err.response?.data?.message || err.response?.data?.error || ...` by hand.
 *
 * Usage:
 *   import { getErrorMessage } from '../lib/apiError';
 *   try {
 *     await api.post('/testimonials', payload);
 *   } catch (err) {
 *     toast.error(getErrorMessage(err));
 *   }
 *
 * For translated copy, pass it through errorTranslator's translateError
 * instead - this helper only extracts the raw message.
 */

/**
 * @param {unknown} error        Typically an AxiosError
 * @param {string} [fallback]    Message to use when none can be extracted
 * @returns {string}
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  return data?.message || data?.error || error?.message || fallback;
};

/**
 * The backend's machine-readable `code` field, when present
 * (e.g. 'RESOURCE_NOT_FOUND', 'RATE_LIMITED') - for branching on a specific
 * failure rather than matching message text.
 *
 * @param {unknown} error
 * @returns {string|undefined}
 */
export const getErrorCode = (error) => error?.response?.data?.code;

/** @param {unknown} error @returns {number|undefined} */
export const getStatusCode = (error) => error?.response?.status;

/** @param {unknown} error @returns {boolean} True for a 401 response. */
export const isUnauthorized = (error) => getStatusCode(error) === 401;

/** @param {unknown} error @returns {boolean} True for a 429 response. */
export const isRateLimited = (error) => getStatusCode(error) === 429;

/**
 * True when the request never reached the server (offline, DNS failure,
 * CORS rejection, timeout) - distinguishable from a server error because
 * Axios sets `error.response` only once a response was received.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export const isNetworkError = (error) => Boolean(error?.isAxiosError) && !error?.response;
