/**
 * Auth token storage.
 *
 * The app holds three separate sessions, in two different stores:
 *
 *   jwtToken               localStorage    regular user, survives a restart
 *   superAdminToken        sessionStorage  super admin, dies with the tab
 *   institutionAdminToken  sessionStorage  institution admin, dies with the tab
 *
 * Which store a token lives in, and the precedence between them, used to be
 * re-derived at every call site. Reading or writing them through this module
 * keeps that knowledge in one place - in particular `setUserToken` clears the
 * admin tokens, because config/api.js attaches the highest-precedence token
 * it finds and a stale admin token would otherwise be sent on user requests
 * and fail signature verification.
 */

const USER_TOKEN_KEY = 'jwtToken';
const SUPER_ADMIN_TOKEN_KEY = 'superAdminToken';
const INSTITUTION_ADMIN_TOKEN_KEY = 'institutionAdminToken';

/**
 * Storage access can throw in private-browsing modes and when a browser
 * blocks site data, so every access is guarded - a missing token is a normal
 * state the app already handles, a thrown exception is not.
 */
const read = (store, key) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};

const write = (store, key, value) => {
  try {
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const clear = (store, key) => {
  try {
    store.removeItem(key);
  } catch {
    // Nothing to do - the token is unreachable either way.
  }
};

/* ---------------------------------------------------------------- user ---- */

/** @returns {string|null} The regular user's JWT, if signed in. */
export const getUserToken = () => read(localStorage, USER_TOKEN_KEY);

/**
 * Store a user JWT and drop any leftover admin session.
 * @param {string} token
 */
export const setUserToken = (token) => {
  write(localStorage, USER_TOKEN_KEY, token);
  clearSuperAdminToken();
  clearInstitutionAdminToken();
};

export const clearUserToken = () => clear(localStorage, USER_TOKEN_KEY);

/* --------------------------------------------------------- super admin ---- */

export const getSuperAdminToken = () => read(sessionStorage, SUPER_ADMIN_TOKEN_KEY);
export const setSuperAdminToken = (token) => write(sessionStorage, SUPER_ADMIN_TOKEN_KEY, token);
export const clearSuperAdminToken = () => clear(sessionStorage, SUPER_ADMIN_TOKEN_KEY);

/* --------------------------------------------------- institution admin ---- */

export const getInstitutionAdminToken = () => read(sessionStorage, INSTITUTION_ADMIN_TOKEN_KEY);
export const setInstitutionAdminToken = (token) => write(sessionStorage, INSTITUTION_ADMIN_TOKEN_KEY, token);
export const clearInstitutionAdminToken = () => clear(sessionStorage, INSTITUTION_ADMIN_TOKEN_KEY);

/* --------------------------------------------------------------- shared --- */

/**
 * The token config/api.js should attach, honouring admin-over-user
 * precedence. Kept here so the interceptor and the rest of the app cannot
 * disagree about which session is active.
 *
 * @returns {string|null}
 */
export const getActiveToken = () =>
  getSuperAdminToken() || getInstitutionAdminToken() || getUserToken();

/** Drop every session. Use on sign-out. */
export const clearAllTokens = () => {
  clearUserToken();
  clearSuperAdminToken();
  clearInstitutionAdminToken();
};

export const TOKEN_KEYS = {
  user: USER_TOKEN_KEY,
  superAdmin: SUPER_ADMIN_TOKEN_KEY,
  institutionAdmin: INSTITUTION_ADMIN_TOKEN_KEY
};
