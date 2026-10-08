/**
 * Frontend logger.
 *
 * Replaces bare console.* calls. Two reasons to route through this:
 *
 *  - debug/info/warn are silenced in a production build, so development
 *    tracing never ships to a user's console;
 *  - every line is prefixed, so it is clear which module emitted it.
 *
 * error always logs, in every environment, because a swallowed error is
 * worse than a noisy console.
 *
 * Usage:
 *   import { logger } from '../lib/logger';
 *   logger.error('Failed to fetch users', err);
 *
 *   // or scope it once per module and drop the repeated prefix:
 *   const log = logger.scope('UsersList');
 *   log.debug('refetching', { page });
 */

const isDev = import.meta.env.DEV;

/** Console method per level, so devtools filtering by level still works. */
const sinks = {
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error'
};

/** Levels that are dropped in a production build. */
const devOnly = new Set(['debug', 'info', 'warn']);

const emit = (level, prefix, args) => {
  if (devOnly.has(level) && !isDev) return;

  const tag = prefix ? `[${prefix}]` : '';
  console[sinks[level]](tag, ...args);
};

const build = (prefix) => ({
  /** Verbose tracing. Development only. */
  debug: (...args) => emit('debug', prefix, args),
  /** Noteworthy but expected events. Development only. */
  info: (...args) => emit('info', prefix, args),
  /** Recoverable problems. Development only. */
  warn: (...args) => emit('warn', prefix, args),
  /** Failures. Logged in every environment. */
  error: (...args) => emit('error', prefix, args),
  /**
   * Return a logger that tags every line with `name`.
   * @param {string} name Usually the component or module name
   */
  scope: (name) => build(prefix ? `${prefix}:${name}` : name)
});

export const logger = build('');

export default logger;
