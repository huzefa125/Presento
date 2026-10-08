/**
 * Institution Admin - apiKeys
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');

/**
 * Get API Keys
 * @route GET /api/institution-admin/api-keys
 * @access Private (Institution Admin)
 */
const getApiKeys = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findById(req.institutionId);
  const apiKeys = institution.apiKeys || [];

  res.status(200).json({
    success: true,
    keys: apiKeys
  });
});

/**
 * Create API Key
 * @route POST /api/institution-admin/api-keys
 * @access Private (Institution Admin)
 */
const createApiKey = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!name) {
    throw new AppError('API key name is required', 400, 'VALIDATION_ERROR');
  }

  // Generate API key (in production, use crypto.randomBytes)
  const apiKey = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  const newApiKey = {
    id: Date.now().toString(),
    name,
    key: apiKey,
    active: true,
    createdAt: new Date()
  };

  if (!institution.apiKeys) {
    institution.apiKeys = [];
  }
  institution.apiKeys.push(newApiKey);
  await institution.save();

  res.status(201).json({
    success: true,
    key: newApiKey
  });
});

/**
 * Delete API Key
 * @route DELETE /api/institution-admin/api-keys/:keyId
 * @access Private (Institution Admin)
 */
const deleteApiKey = asyncHandler(async (req, res, next) => {
  const { keyId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.apiKeys) {
    institution.apiKeys = [];
  }

  institution.apiKeys = institution.apiKeys.filter(key => key.id !== keyId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'API key deleted successfully'
  });
});

module.exports = {
  getApiKeys,
  createApiKey,
  deleteApiKey
};
