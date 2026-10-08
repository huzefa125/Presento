/**
 * Standard API response helpers.
 *
 * Every successful response the API sends has the same envelope:
 *
 *   { success: true, message?: string, data?: object }
 *
 * Failures are never built here - throw an AppError (see utils/httpErrors)
 * and let middleware/errorHandler emit the matching failure envelope:
 *
 *   { success: false, message, error, code }
 *
 * Using these helpers instead of res.status(...).json({ ... }) by hand keeps
 * the envelope identical across controllers, so the frontend can rely on
 * response.data.success and response.data.data everywhere.
 */

/**
 * 200 OK with a data payload.
 *
 * @param {import('express').Response} res
 * @param {object} [data]    Payload placed under `data`
 * @param {string} [message] Optional human-readable message
 */
const ok = (res, data = undefined, message = undefined) =>
  res.status(200).json({
    success: true,
    ...(message !== undefined && { message }),
    ...(data !== undefined && { data })
  });

/**
 * 201 Created with a data payload.
 *
 * @param {import('express').Response} res
 * @param {object} [data]
 * @param {string} [message]
 */
const created = (res, data = undefined, message = undefined) =>
  res.status(201).json({
    success: true,
    ...(message !== undefined && { message }),
    ...(data !== undefined && { data })
  });

/**
 * 200 OK for a list plus its pagination block.
 *
 * `key` names the array in the payload so the response reads
 * `data.testimonials` / `data.users` rather than a generic `data.items`.
 *
 * @param {import('express').Response} res
 * @param {string} key             Property name for the array, e.g. 'users'
 * @param {Array}  items           The page of records
 * @param {object} pagination      Output of buildPagination()
 * @param {object} [extra]         Any additional top-level payload fields
 */
const paginated = (res, key, items, pagination, extra = {}) =>
  res.status(200).json({
    success: true,
    data: {
      [key]: items,
      pagination,
      ...extra
    }
  });

/**
 * 200 OK carrying only a message - for deletes and other no-payload actions.
 *
 * @param {import('express').Response} res
 * @param {string} text
 */
const message = (res, text) =>
  res.status(200).json({ success: true, message: text });

/**
 * 204 No Content. Sends no body at all.
 *
 * @param {import('express').Response} res
 */
const noContent = (res) => res.status(204).send();

module.exports = { ok, created, paginated, message, noContent };
