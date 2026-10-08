/**
 * Institution Admin - auditLogs
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');

/**
 * Get Audit Logs
 * @route GET /api/institution-admin/audit-logs
 * @access Private (Institution Admin)
 */
const getAuditLogs = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const institution = await Institution.findById(req.institutionId);

  let logs = institution.auditLogs || [];

  // Filter by date range if provided
  if (startDate || endDate) {
    logs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (startDate && logDate < new Date(startDate)) return false;
      if (endDate && logDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Sort by timestamp descending (most recent first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit to last 100 logs for performance
  logs = logs.slice(0, 100);

  res.status(200).json({
    success: true,
    logs
  });
});

module.exports = {
  getAuditLogs
};
