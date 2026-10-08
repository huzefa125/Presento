/**
 * Institution Admin - reports
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const XLSX = require('xlsx');
const Institution = require('../../models/Institution');
const User = require('../../models/User');
const Presentation = require('../../models/Presentation');
const Slide = require('../../models/Slide');
const Response = require('../../models/Response');

/**
 * Export Data
 * @route GET /api/institution-admin/export
 * @access Private (Institution Admin)
 */
const exportData = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { type = 'presentations', format = 'json' } = req.query;

  if (!['presentations', 'users'].includes(type)) {
    throw new AppError('Invalid export type', 400, 'VALIDATION_ERROR');
  }

  if (!['json', 'csv', 'excel'].includes(format)) {
    throw new AppError('Invalid export format. Use: json, csv, or excel', 400, 'VALIDATION_ERROR');
  }

  const institutionUsers = await User.find({ 
    institutionId,
    isInstitutionUser: true 
  }).select('_id email displayName').lean();

  const userIds = institutionUsers.map(user => user._id);

  if (type === 'presentations') {
    const presentations = await Presentation.find({ userId: { $in: userIds } })
      .populate('userId', 'email displayName')
      .sort({ createdAt: -1 })
      .lean();

    const presentationIds = presentations.map(p => p._id);
    const slideCounts = await Slide.aggregate([
      { $match: { presentationId: { $in: presentationIds } } },
      { $group: { _id: '$presentationId', count: { $sum: 1 } } }
    ]);
    const slideCountMap = new Map(slideCounts.map(sc => [sc._id.toString(), sc.count]));

    const responseCounts = await Response.aggregate([
      { $match: { presentationId: { $in: presentationIds } } },
      { $group: { _id: '$presentationId', count: { $sum: 1 } } }
    ]);
    const responseCountMap = new Map(responseCounts.map(rc => [rc._id.toString(), rc.count]));

    const presentationsData = presentations.map((presentation) => ({
      Title: presentation.title,
      'Access Code': presentation.accessCode,
      'Is Live': presentation.isLive ? 'Yes' : 'No',
      'Slide Count': slideCountMap.get(presentation._id.toString()) || 0,
      'Response Count': responseCountMap.get(presentation._id.toString()) || 0,
      'Created By': presentation.userId?.email || 'Unknown',
      'Created At': new Date(presentation.createdAt).toLocaleString(),
      'Updated At': new Date(presentation.updatedAt).toLocaleString()
    }));

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          type: 'presentations',
          exportedAt: new Date(),
          count: presentationsData.length,
          presentations: presentationsData
        }
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(presentationsData[0] || {});
      const csvRows = [
        headers.join(','),
        ...presentationsData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];
      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=institution-presentations-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    } else if (format === 'excel') {
      // Convert to Excel
      const worksheet = XLSX.utils.json_to_sheet(presentationsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Presentations');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=institution-presentations-${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(excelBuffer);
    }
  } else {
    const userIdsArray = institutionUsers.map(u => u._id);
    const presentationCounts = await Presentation.aggregate([
      { $match: { userId: { $in: userIdsArray } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const presentationCountMap = new Map(presentationCounts.map(pc => [pc._id.toString(), pc.count]));

    const usersData = institutionUsers.map((user) => ({
      Email: user.email,
      'Display Name': user.displayName || '',
      'Presentation Count': presentationCountMap.get(user._id.toString()) || 0,
      'Created At': new Date(user.createdAt).toLocaleString()
    }));

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          type: 'users',
          exportedAt: new Date(),
          count: usersData.length,
          users: usersData
        }
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(usersData[0] || {});
      const csvRows = [
        headers.join(','),
        ...usersData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];
      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=institution-users-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    } else if (format === 'excel') {
      // Convert to Excel
      const worksheet = XLSX.utils.json_to_sheet(usersData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=institution-users-${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(excelBuffer);
    }
  }
});

/**
 * Get Custom Reports
 * @route GET /api/institution-admin/custom-reports
 * @access Private (Institution Admin)
 */
const getCustomReports = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findById(req.institutionId);
  const reports = institution.customReports || [];

  res.status(200).json({
    success: true,
    reports
  });
});

/**
 * Create Custom Report
 * @route POST /api/institution-admin/custom-reports
 * @access Private (Institution Admin)
 */
const createCustomReport = asyncHandler(async (req, res, next) => {
  const reportConfig = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!reportConfig.name || !reportConfig.metrics || reportConfig.metrics.length === 0) {
    throw new AppError('Report name and at least one metric are required', 400, 'VALIDATION_ERROR');
  }

  const newReport = {
    id: Date.now().toString(),
    ...reportConfig,
    createdAt: new Date()
  };

  if (!institution.customReports) {
    institution.customReports = [];
  }
  institution.customReports.push(newReport);
  await institution.save();

  res.status(201).json({
    success: true,
    report: newReport
  });
});

/**
 * Generate Custom Report
 * @route POST /api/institution-admin/custom-reports/:reportId/generate
 * @access Private (Institution Admin)
 */
const generateCustomReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.customReports) {
    institution.customReports = [];
  }

  const report = institution.customReports.find(r => r.id === reportId);
  if (!report) {
    throw new AppError('Custom report not found', 404, 'NOT_FOUND');
  }

  // For now, return a simple PDF placeholder
  // In production, generate actual PDF/Excel based on report config using libraries like pdfkit or jsPDF
  const pdfPlaceholder = Buffer.from('PDF placeholder - Implement actual PDF generation');
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=custom-report-${report.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  res.send(pdfPlaceholder);
});

/**
 * Delete Custom Report
 * @route DELETE /api/institution-admin/custom-reports/:reportId
 * @access Private (Institution Admin)
 */
const deleteCustomReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.customReports) {
    institution.customReports = [];
  }

  institution.customReports = institution.customReports.filter(r => r.id !== reportId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Custom report deleted successfully'
  });
});

/**
 * Generate Report
 * @route POST /api/institution-admin/reports/generate
 * @access Private (Institution Admin)
 */
const generateReport = asyncHandler(async (req, res, next) => {
  const { type, format, schedule, email, frequency } = req.body;
  const institutionId = req.institutionId;

  if (!type || !format) {
    throw new AppError('Report type and format are required', 400, 'VALIDATION_ERROR');
  }

  // For scheduled reports, store the configuration
  if (schedule && schedule !== 'none' && email) {
    const institution = await Institution.findById(institutionId);
    if (!institution.scheduledReports) {
      institution.scheduledReports = [];
    }
    institution.scheduledReports.push({
      type,
      format,
      schedule,
      email,
      frequency,
      createdAt: new Date()
    });
    await institution.save();

    return res.status(200).json({
      success: true,
      message: 'Report scheduled successfully'
    });
  }

  // For immediate download, generate and return the file
  // This is a placeholder - in production, generate actual PDF/Excel
  const fileBuffer = Buffer.from(`Report: ${type} in ${format} format`);
  
  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
  } else {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  
  res.send(fileBuffer);
});

module.exports = {
  exportData,
  getCustomReports,
  createCustomReport,
  generateCustomReport,
  deleteCustomReport,
  generateReport
};
