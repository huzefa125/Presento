const express = require('express');
const router = express.Router();
const jobPostingController = require('../controllers/jobPostingController');
const { verifySuperAdmin } = require('../middleware/superAdminAuth');

/**
 * @route   POST /api/job-postings
 * @desc    Create a new job posting
 * @access  Private (Super Admin)
 */
router.post('/', verifySuperAdmin, jobPostingController.createJobPosting);

/**
 * @route   GET /api/job-postings
 * @desc    Get all job postings (Admin)
 * @access  Private (Super Admin)
 */
router.get('/', verifySuperAdmin, jobPostingController.getJobPostings);

/**
 * @route   GET /api/job-postings/active
 * @desc    Get active job postings (Public - for careers page)
 * @access  Public
 */
router.get('/active', jobPostingController.getActiveJobPostings);

/**
 * @route   GET /api/job-postings/stats
 * @desc    Get dashboard statistics
 * @access  Private (Super Admin)
 */
router.get('/stats', verifySuperAdmin, jobPostingController.getDashboardStats);

/**
 * @route   GET /api/job-postings/:id
 * @desc    Get single job posting by ID
 * @access  Public
 */
router.get('/:id', jobPostingController.getJobPosting);

/**
 * @route   PUT /api/job-postings/:id
 * @desc    Update job posting
 * @access  Private (Super Admin)
 */
router.put('/:id', verifySuperAdmin, jobPostingController.updateJobPosting);

/**
 * @route   DELETE /api/job-postings/:id
 * @desc    Delete job posting
 * @access  Private (Super Admin)
 */
router.delete('/:id', verifySuperAdmin, jobPostingController.deleteJobPosting);

module.exports = router;

