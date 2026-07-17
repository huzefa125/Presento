const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { verifySuperAdmin } = require('../middleware/superAdminAuth');

/**
 * @route   POST /api/super-admin/login
 * @desc    Login as Super Admin
 * @access  Public
 */
router.post('/login', superAdminController.loginSuperAdmin);

/**
 * @route   GET /api/super-admin/verify
 * @desc    Verify Super Admin token
 * @access  Private (Super Admin)
 */
router.get('/verify', verifySuperAdmin, superAdminController.verifyToken);

/**
 * Dashboard Routes
 */
router.get('/dashboard/stats', verifySuperAdmin, superAdminController.getDashboardStats);

/**
 * Users Routes
 */
router.get('/users', verifySuperAdmin, superAdminController.getUsers);
router.post('/users', verifySuperAdmin, superAdminController.createUser);
router.get('/users/:id', verifySuperAdmin, superAdminController.getUserById);
router.put('/users/:id/plan', verifySuperAdmin, superAdminController.updateUserPlan);
router.put('/users/:id/status', verifySuperAdmin, superAdminController.updateUserStatus);

/**
 * Institutions Routes
 */
router.post('/institutions', verifySuperAdmin, superAdminController.createInstitution);
router.get('/institutions', verifySuperAdmin, superAdminController.getInstitutions);
router.get('/institutions/:id', verifySuperAdmin, superAdminController.getInstitutionById);
router.put('/institutions/:id/plan', verifySuperAdmin, superAdminController.updateInstitutionPlan);

/**
 * Payments Routes
 */
router.get('/payments', verifySuperAdmin, superAdminController.getPayments);
router.get('/payments/stats', verifySuperAdmin, superAdminController.getPaymentStats);

/**
 * Presentations Routes
 */
router.get('/presentations', verifySuperAdmin, superAdminController.getPresentations);

/**
 * Analytics Routes
 */
router.get('/analytics/growth', verifySuperAdmin, superAdminController.getGrowthTrends);

/**
 * System Routes
 */
const systemController = require('../controllers/systemController');
router.get('/system/health', verifySuperAdmin, systemController.getSystemHealth);
router.get('/system/performance', verifySuperAdmin, systemController.getPerformanceMetrics);

/**
 * Settings Routes
 */
router.get('/settings', verifySuperAdmin, superAdminController.getSettings);
router.put('/settings', verifySuperAdmin, superAdminController.updateSettings);

module.exports = router;

