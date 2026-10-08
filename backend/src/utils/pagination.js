/**
 * Pagination helpers.
 *
 * Controllers repeat the same parseInt / skip / Math.ceil arithmetic on
 * req.query, with no clamping - so `?limit=100000` happily scans a whole
 * collection and `?page=0` or `?page=abc` produces a negative or NaN skip.
 * These two functions do that parsing once, with bounds.
 *
 * Usage:
 *   const { page, limit, skip } = parsePagination(req.query);
 *   const [items, total] = await Promise.all([
 *     Model.find(q).skip(skip).limit(limit).lean(),
 *     Model.countDocuments(q)
 *   ]);
 *   return paginated(res, 'items', items, buildPagination(page, limit, total));
 */

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Read page/limit off a query object, coercing and clamping to safe values.
 *
 * Invalid, missing or out-of-range input falls back to the defaults rather
 * than producing NaN, so the caller never has to re-check.
 *
 * @param {object} [query]            Typically req.query
 * @param {object} [options]
 * @param {number} [options.defaultLimit=10]
 * @param {number} [options.maxLimit=100]
 * @returns {{page: number, limit: number, skip: number}}
 */
const parsePagination = (query = {}, options = {}) => {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  const rawPage = Number.parseInt(query.page, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawLimit = Number.parseInt(query.limit, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, maxLimit)
    : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Build the pagination block that accompanies a paginated payload.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total  Total matching records, e.g. from countDocuments()
 * @returns {{page: number, limit: number, total: number, pages: number}}
 */
const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: limit > 0 ? Math.ceil(total / limit) : 0
});

module.exports = { parsePagination, buildPagination, DEFAULT_LIMIT, MAX_LIMIT };
