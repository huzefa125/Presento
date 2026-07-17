const express = require('express');
const multer = require('multer');
const router = express.Router();
const institutionAdminController = require('../controllers/institutionAdminController');
const { verifyInstitutionAdmin } = require('../middleware/institutionAdminAuth');

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/institution-admin/check
 * @desc    Check if email belongs to an institution admin
 * @access  Public
 */
router.post('/check', institutionAdminController.checkInstitutionAdmin);

/**
 * @route   POST /api/institution-admin/login
 * @desc    Login as Institution Admin
 * @access  Public
 */
router.post('/login', institutionAdminController.loginInstitutionAdmin);

/**
 * @route   GET /api/institution-admin/verify
 * @desc    Verify Institution Admin token
 * @access  Private (Institution Admin)
 */
router.get('/verify', verifyInstitutionAdmin, institutionAdminController.verifyToken);

/**
 * @route   GET /api/institution-admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Institution Admin)
 */
router.get('/stats', verifyInstitutionAdmin, institutionAdminController.getDashboardStats);

/**
 * @route   GET /api/institution-admin/users
 * @desc    Get all institution users
 * @access  Private (Institution Admin)
 */
router.get('/users', verifyInstitutionAdmin, institutionAdminController.getInstitutionUsers);

/**
 * @route   POST /api/institution-admin/users
 * @desc    Add user to institution
 * @access  Private (Institution Admin)
 */
router.post('/users', verifyInstitutionAdmin, institutionAdminController.addInstitutionUser);

/**
 * @route   DELETE /api/institution-admin/users/:userId
 * @desc    Remove user from institution
 * @access  Private (Institution Admin)
 */
router.delete('/users/:userId', verifyInstitutionAdmin, institutionAdminController.removeInstitutionUser);

/**
 * @route   POST /api/institution-admin/users/bulk-import
 * @desc    Bulk import users from CSV
 * @access  Private (Institution Admin)
 */
router.post('/users/bulk-import', verifyInstitutionAdmin, upload.single('file'), institutionAdminController.bulkImportUsers);

/**
 * @route   POST /api/institution-admin/users/validate-before-payment
 * @desc    Validate users before payment - check which users already exist
 * @access  Private (Institution Admin)
 */
router.post('/users/validate-before-payment', verifyInstitutionAdmin, institutionAdminController.validateUsersBeforePayment);

/**
 * @route   POST /api/institution-admin/users/create-payment
 * @desc    Create payment order for additional users
 * @access  Private (Institution Admin)
 */
router.post('/users/create-payment', verifyInstitutionAdmin, institutionAdminController.createAdditionalUsersPaymentOrder);

/**
 * @route   POST /api/institution-admin/users/verify-payment
 * @desc    Verify payment and add additional users
 * @access  Private (Institution Admin)
 */
router.post('/users/verify-payment', verifyInstitutionAdmin, institutionAdminController.verifyAdditionalUsersPayment);

/**
 * @route   GET /api/institution-admin/presentations
 * @desc    Get all presentations by institution users
 * @access  Private (Institution Admin)
 */
router.get('/presentations', verifyInstitutionAdmin, institutionAdminController.getInstitutionPresentations);

/**
 * @route   GET /api/institution-admin/my-account
 * @desc    Get admin's user account information
 * @access  Private (Institution Admin)
 */
router.get('/my-account', verifyInstitutionAdmin, institutionAdminController.getAdminUserAccount);

/**
 * @route   GET /api/institution-admin/analytics
 * @desc    Get analytics data
 * @access  Private (Institution Admin)
 */
router.get('/analytics', verifyInstitutionAdmin, institutionAdminController.getAnalytics);

/**
 * @route   PUT /api/institution-admin/branding
 * @desc    Update institution branding
 * @access  Private (Institution Admin)
 */
router.put('/branding', verifyInstitutionAdmin, institutionAdminController.updateBranding);

/**
 * @route   POST /api/institution-admin/branding/upload-logo
 * @desc    Upload logo for institution branding
 * @access  Private (Institution Admin)
 */
router.post('/branding/upload-logo', verifyInstitutionAdmin, institutionAdminController.uploadLogo);

/**
 * @route   PUT /api/institution-admin/settings
 * @desc    Update institution settings
 * @access  Private (Institution Admin)
 */
router.put('/settings', verifyInstitutionAdmin, institutionAdminController.updateSettings);

/**
 * @route   GET /api/institution-admin/export
 * @desc    Export data
 * @access  Private (Institution Admin)
 */
router.get('/export', verifyInstitutionAdmin, institutionAdminController.exportData);

/**
 * @route   POST /api/institution-admin/reports/generate
 * @desc    Generate report
 * @access  Private (Institution Admin)
 */
router.post('/reports/generate', verifyInstitutionAdmin, institutionAdminController.generateReport);

/**
 * @route   GET /api/institution-admin/audit-logs
 * @desc    Get audit logs
 * @access  Private (Institution Admin)
 */
router.get('/audit-logs', verifyInstitutionAdmin, institutionAdminController.getAuditLogs);

/**
 * @route   GET /api/institution-admin/api-keys
 * @desc    Get API keys
 * @access  Private (Institution Admin)
 */
router.get('/api-keys', verifyInstitutionAdmin, institutionAdminController.getApiKeys);

/**
 * @route   POST /api/institution-admin/api-keys
 * @desc    Create API key
 * @access  Private (Institution Admin)
 */
router.post('/api-keys', verifyInstitutionAdmin, institutionAdminController.createApiKey);

/**
 * @route   DELETE /api/institution-admin/api-keys/:keyId
 * @desc    Delete API key
 * @access  Private (Institution Admin)
 */
router.delete('/api-keys/:keyId', verifyInstitutionAdmin, institutionAdminController.deleteApiKey);

/**
 * @route   GET /api/institution-admin/webhooks
 * @desc    Get webhooks
 * @access  Private (Institution Admin)
 */
router.get('/webhooks', verifyInstitutionAdmin, institutionAdminController.getWebhooks);

/**
 * @route   POST /api/institution-admin/webhooks
 * @desc    Create webhook
 * @access  Private (Institution Admin)
 */
router.post('/webhooks', verifyInstitutionAdmin, institutionAdminController.createWebhook);

/**
 * @route   DELETE /api/institution-admin/webhooks/:webhookId
 * @desc    Delete webhook
 * @access  Private (Institution Admin)
 */
router.delete('/webhooks/:webhookId', verifyInstitutionAdmin, institutionAdminController.deleteWebhook);

/**
 * @route   GET /api/institution-admin/custom-reports
 * @desc    Get custom reports
 * @access  Private (Institution Admin)
 */
router.get('/custom-reports', verifyInstitutionAdmin, institutionAdminController.getCustomReports);

/**
 * @route   POST /api/institution-admin/custom-reports
 * @desc    Create custom report
 * @access  Private (Institution Admin)
 */
router.post('/custom-reports', verifyInstitutionAdmin, institutionAdminController.createCustomReport);

/**
 * @route   POST /api/institution-admin/custom-reports/:reportId/generate
 * @desc    Generate custom report
 * @access  Private (Institution Admin)
 */
router.post('/custom-reports/:reportId/generate', verifyInstitutionAdmin, institutionAdminController.generateCustomReport);

/**
 * @route   DELETE /api/institution-admin/custom-reports/:reportId
 * @desc    Delete custom report
 * @access  Private (Institution Admin)
 */
router.delete('/custom-reports/:reportId', verifyInstitutionAdmin, institutionAdminController.deleteCustomReport);

/**
 * @route   PUT /api/institution-admin/security-settings
 * @desc    Update security settings
 * @access  Private (Institution Admin)
 */
router.put('/security-settings', verifyInstitutionAdmin, institutionAdminController.updateSecuritySettings);

/**
 * @route   GET /api/institution-admin/payments
 * @desc    Get payment history for institution
 * @access  Private (Institution Admin)
 */
router.get('/payments', verifyInstitutionAdmin, institutionAdminController.getPaymentHistory);

/**
 * @route   PUT /api/institution-admin/profile
 * @desc    Update institution admin profile
 * @access  Private (Institution Admin)
 */
router.put('/profile', verifyInstitutionAdmin, institutionAdminController.updateProfile);

/**
 * @route   PUT /api/institution-admin/change-password
 * @desc    Change institution admin password
 * @access  Private (Institution Admin)
 */
router.put('/change-password', verifyInstitutionAdmin, institutionAdminController.changePassword);

/**
 * @route   GET /api/institution-admin/subscription
 * @desc    Get subscription details
 * @access  Private (Institution Admin)
 */
router.get('/subscription', verifyInstitutionAdmin, institutionAdminController.getSubscriptionDetails);

/**
 * @route   GET /api/institution-admin/subscription/status
 * @desc    Get subscription status (lightweight for real-time updates)
 * @access  Private (Institution Admin)
 */
router.get('/subscription/status', verifyInstitutionAdmin, institutionAdminController.getSubscriptionStatus);

/**
 * @route   GET /api/institution-admin/subscription/usage
 * @desc    Get usage statistics
 * @access  Private (Institution Admin)
 */
router.get('/subscription/usage', verifyInstitutionAdmin, institutionAdminController.getUsageStatistics);

/**
 * @route   POST /api/institution-admin/subscription/renew
 * @desc    Create payment order for subscription renewal
 * @access  Private (Institution Admin)
 */
router.post('/subscription/renew', verifyInstitutionAdmin, institutionAdminController.createSubscriptionRenewalOrder);

/**
 * @route   POST /api/institution-admin/subscription/verify-renewal
 * @desc    Verify payment and renew subscription
 * @access  Private (Institution Admin)
 */
router.post('/subscription/verify-renewal', verifyInstitutionAdmin, institutionAdminController.verifySubscriptionRenewal);

module.exports = router;

