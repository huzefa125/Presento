/**
 * Institution Admin - settings
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');

/**
 * Update Institution Settings
 * @route PUT /api/institution-admin/settings
 * @access Private (Institution Admin)
 */
const updateSettings = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { aiFeaturesEnabled, exportEnabled, watermarkEnabled, analyticsEnabled } = req.body;

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (aiFeaturesEnabled !== undefined) institution.settings.aiFeaturesEnabled = aiFeaturesEnabled;
  if (exportEnabled !== undefined) institution.settings.exportEnabled = exportEnabled;
  if (watermarkEnabled !== undefined) institution.settings.watermarkEnabled = watermarkEnabled;
  if (analyticsEnabled !== undefined) institution.settings.analyticsEnabled = analyticsEnabled;

  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      settings: institution.settings
    }
  });
});

/**
 * Update Security Settings
 * @route PUT /api/institution-admin/security-settings
 * @access Private (Institution Admin)
 */
const updateSecuritySettings = asyncHandler(async (req, res, next) => {
  const securitySettings = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.securitySettings) {
    institution.securitySettings = {};
  }

  Object.assign(institution.securitySettings, securitySettings);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Security settings updated successfully',
    securitySettings: institution.securitySettings
  });
});

module.exports = {
  updateSettings,
  updateSecuritySettings
};
