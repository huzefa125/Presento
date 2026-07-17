const express = require('express');
const router = express.Router();
const { getMaintenanceStatus } = require('../middleware/maintenanceMode');

/**
 * @route   GET /api/maintenance/status
 * @desc    Get maintenance mode status (public endpoint)
 * @access  Public
 */
router.get('/status', getMaintenanceStatus);

module.exports = router;

