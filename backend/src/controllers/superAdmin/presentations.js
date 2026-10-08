/**
 * Super Admin Controller - presentations
 * Split out of the former superAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const superAdminService = require('../../services/superAdminService');
const { asyncHandler } = require('../../middleware/errorHandler');

/**
 * Get Presentations List
 * @route GET /api/super-admin/presentations
 * @access Private (Super Admin)
 */
const getPresentations = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, isLive, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    isLive,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getPresentations(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  getPresentations
};
