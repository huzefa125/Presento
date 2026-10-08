/**
 * Super Admin Service
 *
 * Thin barrel over services/superAdmin/* - split by domain (dashboard,
 * users, institutions, payments, presentations), mirroring the matching
 * split in controllers/superAdmin/*. See CODE_STANDARDS.md.
 */
module.exports = {
  ...require('./superAdmin/dashboard'),
  ...require('./superAdmin/users'),
  ...require('./superAdmin/institutions'),
  ...require('./superAdmin/payments'),
  ...require('./superAdmin/presentations')
};
