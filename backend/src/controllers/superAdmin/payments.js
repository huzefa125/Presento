/**
 * Super Admin Controller - payments
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const superAdminService = require('../../services/superAdminService');
const { asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get Payments List
 * @route GET /api/super-admin/payments
 * @access Private (Super Admin)
 */
const getPayments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, status, plan, dateFrom, dateTo } = req.query;
  
  const filters = {
    status,
    plan,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getPayments(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Payment Statistics
 * @route GET /api/super-admin/payments/stats
 * @access Private (Super Admin)
 */
const getPaymentStats = asyncHandler(async (req, res, next) => {
  const stats = await superAdminService.getPaymentStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getPayments,
  getPaymentStats
};
