import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from '../lib/apiError';
import { logger } from '../lib/logger';

/**
 * Wrap an async call (almost always an API call) with the loading/data/error
 * state every component was re-declaring by hand:
 *
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState(null);
 *   try { setLoading(true); ... } catch (e) { console.error(...); setError(...) }
 *   finally { setLoading(false); }
 *
 * Usage:
 *   const { data: users, loading, error, run: fetchUsers } = useAsync();
 *   useEffect(() => { fetchUsers(() => api.get('/super-admin/users', { params })); }, [page]);
 *
 *   // or, to also react to the resolved value (e.g. show a toast):
 *   const { loading, run } = useAsync();
 *   const handleDelete = (id) =>
 *     run(() => api.delete(`/users/${id}`), {
 *       onSuccess: () => toast.success('Deleted'),
 *       onError: (err) => toast.error(getErrorMessage(err)),
 *     });
 *
 * `run` ignores results from a call that is no longer the latest in flight,
 * so a slow earlier request cannot clobber state after a newer one resolved
 * (e.g. the user changed pages before the first page finished loading).
 *
 * @template T
 * @param {object} [config]
 * @param {string} [config.scope] Logger scope for the default onError, e.g. the component name
 */
export function useAsync(config = {}) {
  const { scope } = config;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const callId = useRef(0);

  const log = scope ? logger.scope(scope) : logger;

  /**
   * @param {() => Promise<T>} fn            The async call to run, e.g. `() => api.get(...)`
   * @param {object} [opts]
   * @param {(result: T) => void} [opts.onSuccess]
   * @param {(error: unknown) => void} [opts.onError]  Defaults to logging via `log.error`
   * @returns {Promise<T|undefined>} The resolved value, or undefined on error
   */
  const run = useCallback(async (fn, opts = {}) => {
    const id = ++callId.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fn();
      if (id !== callId.current) return undefined; // Superseded by a later call

      setData(result);
      opts.onSuccess?.(result);
      return result;
    } catch (err) {
      if (id !== callId.current) return undefined;

      const message = getErrorMessage(err);
      setError(message);

      if (opts.onError) {
        opts.onError(err);
      } else {
        log.error(message, err);
      }
      return undefined;
    } finally {
      if (id === callId.current) setLoading(false);
    }
  }, [log]);

  /** Reset to the initial idle state, e.g. when unmounting a filter panel. */
  const reset = useCallback(() => {
    callId.current += 1; // Invalidate any call still in flight
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, run, reset, setData };
}

export default useAsync;
