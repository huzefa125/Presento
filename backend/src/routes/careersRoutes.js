const express = require('express');
const router = express.Router();
const careersController = require('../controllers/careersController');
const { verifySuperAdmin } = require('../middleware/superAdminAuth');
const { validate, commonRules, validators } = require('../middleware/validate');

/**
 * @route   POST /api/careers/apply
 * @desc    Submit job application
 * @access  Public
 */
router.post('/apply', 
  validate({
    body: {
      firstName: commonRules.string(1, 100),
      lastName: commonRules.string(1, 100),
      email: commonRules.email,
      phone: commonRules.string(1, 20),
      location: commonRules.string(1, 200),
      position: commonRules.string(1, 200),
      department: commonRules.string(1, 100),
      coverLetter: commonRules.string(1, 10000),
      resume: [
        validators.required,
        validators.isObject,
        validators.custom(
          (resume) => resume.url || resume.base64,
          'resume must have either url or base64'
        )
      ]
    }
  }),
  careersController.submitApplication
);

/**
 * @swagger
 * /api/careers/applications:
 *   get:
 *     summary: Get all applications (Super Admin)
 *     tags: [Careers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewing, shortlisted, interview, rejected, accepted]
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of applications
 *       401:
 *         description: Unauthorized
 */
router.get('/applications', verifySuperAdmin, careersController.getApplications);

/**
 * @route   GET /api/careers/applications/:id
 * @desc    Get single application by ID
 * @access  Private (Super Admin)
 */
router.get('/applications/:id', 
  verifySuperAdmin,
  validate({
    params: {
      id: commonRules.mongoId
    }
  }),
  careersController.getApplication
);

/**
 * @route   PATCH /api/careers/applications/:id/status
 * @desc    Update application status (Super Admin)
 * @access  Private (Super Admin)
 */
router.patch('/applications/:id/status', 
  verifySuperAdmin,
  validate({
    params: {
      id: commonRules.mongoId
    },
    body: {
      status: [
        validators.required,
        validators.isIn(['pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'])
      ]
    }
  }),
  careersController.updateApplicationStatus
);

module.exports = router;

