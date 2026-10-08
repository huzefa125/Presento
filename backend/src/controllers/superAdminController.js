/**
 * Super Admin Controller
 *
 * Thin barrel over controllers/superAdmin/* - split by domain (auth,
 * dashboard, users, institutions, payments, presentations, settings) instead
 * of 18 handlers spanning all of those in one file. superAdminRoutes.js is
 * unchanged. See CODE_STANDARDS.md.
 */
module.exports = {
  ...require('./superAdmin/auth'),
  ...require('./superAdmin/dashboard'),
  ...require('./superAdmin/users'),
  ...require('./superAdmin/institutions'),
  ...require('./superAdmin/payments'),
  ...require('./superAdmin/presentations'),
  ...require('./superAdmin/settings')
};
