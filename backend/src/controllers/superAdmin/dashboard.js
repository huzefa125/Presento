/**
 * Super Admin Controller - dashboard
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const superAdminService = require('../../services/superAdminService');
const { asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get Dashboard Stats
 * @route GET /api/super-admin/dashboard/stats
 * @access Private (Super Admin)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const stats = await superAdminService.getPlatformStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * Get Growth Trends
 * @route GET /api/super-admin/analytics/growth
 * @access Private (Super Admin)
 */
const getGrowthTrends = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;
  
  const trends = await superAdminService.getGrowthTrends(parseInt(days));
  
  res.status(200).json({
    success: true,
    data: trends
  });
});

module.exports = {
  getDashboardStats,
  getGrowthTrends
};
