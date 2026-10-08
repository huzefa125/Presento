/**
 * Institution Admin Controller
 *
 * Thin barrel over controllers/institutionAdmin/* - split by domain (auth,
 * dashboard, users, presentations, branding, settings, reports, auditLogs,
 * apiKeys, webhooks, billing) so no single file mixes unrelated concerns.
 * institutionAdminRoutes.js is unchanged: it still does
 * `institutionAdminController.xxx`, and every `xxx` that existed before
 * still resolves here, from whichever domain file now owns it.
 * See CODE_STANDARDS.md.
 */
module.exports = {
  ...require('./institutionAdmin/auth'),
  ...require('./institutionAdmin/dashboard'),
  ...require('./institutionAdmin/users'),
  ...require('./institutionAdmin/presentations'),
  ...require('./institutionAdmin/branding'),
  ...require('./institutionAdmin/settings'),
  ...require('./institutionAdmin/reports'),
  ...require('./institutionAdmin/auditLogs'),
  ...require('./institutionAdmin/apiKeys'),
  ...require('./institutionAdmin/webhooks'),
  ...require('./institutionAdmin/billing')
};
