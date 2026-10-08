/**
 * Institution Admin - webhooks
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');

/**
 * Get Webhooks
 * @route GET /api/institution-admin/webhooks
 * @access Private (Institution Admin)
 */
const getWebhooks = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findById(req.institutionId);
  const webhooks = institution.webhooks || [];

  res.status(200).json({
    success: true,
    webhooks
  });
});

/**
 * Create Webhook
 * @route POST /api/institution-admin/webhooks
 * @access Private (Institution Admin)
 */
const createWebhook = asyncHandler(async (req, res, next) => {
  const { url, events, secret } = req.body;
  const institution = await Institution.findById(req.institutionId);

  if (!url) {
    throw new AppError('Webhook URL is required', 400, 'VALIDATION_ERROR');
  }

  const newWebhook = {
    id: Date.now().toString(),
    url,
    events: events || [],
    secret: secret || '',
    active: true,
    createdAt: new Date()
  };

  if (!institution.webhooks) {
    institution.webhooks = [];
  }
  institution.webhooks.push(newWebhook);
  await institution.save();

  res.status(201).json({
    success: true,
    webhook: newWebhook
  });
});

/**
 * Delete Webhook
 * @route DELETE /api/institution-admin/webhooks/:webhookId
 * @access Private (Institution Admin)
 */
const deleteWebhook = asyncHandler(async (req, res, next) => {
  const { webhookId } = req.params;
  const institution = await Institution.findById(req.institutionId);

  if (!institution.webhooks) {
    institution.webhooks = [];
  }

  institution.webhooks = institution.webhooks.filter(webhook => webhook.id !== webhookId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Webhook deleted successfully'
  });
});

module.exports = {
  getWebhooks,
  createWebhook,
  deleteWebhook
};
