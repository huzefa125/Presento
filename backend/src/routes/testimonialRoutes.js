const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const testimonialController = require('../controllers/testimonialController');
const { verifySuperAdmin } = require('../middleware/superAdminAuth');
const { verifyToken } = require('../middleware/auth');

// Validation rules
const testimonialValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('testimonial')
    .trim()
    .notEmpty().withMessage('Testimonial text is required')
    .isLength({ min: 50, max: 500 }).withMessage('Testimonial must be between 50 and 500 characters'),
  body('role')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Role must be less than 100 characters'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Institution must be less than 200 characters'),
  body('avatar')
    .optional()
    .isURL().withMessage('Avatar must be a valid URL')
];

// Public routes
router.get('/', testimonialController.getTestimonials);

// Private routes
router.post('/', verifyToken, testimonialValidation, testimonialController.submitTestimonial);
router.get('/my', verifyToken, testimonialController.getMyTestimonials);

// Admin routes (require super admin authentication) - must come before /:id route
router.get('/admin/all', verifySuperAdmin, testimonialController.getAllTestimonials);
router.get('/admin/stats', verifySuperAdmin, testimonialController.getTestimonialStats);

// Single testimonial route (public, but admin can see more details)
router.get('/:id', testimonialController.getTestimonialById);

// Admin management routes
router.put('/:id/approve', verifySuperAdmin, testimonialController.approveTestimonial);
router.put('/:id/reject', verifySuperAdmin, testimonialController.rejectTestimonial);
router.put('/:id', verifySuperAdmin, testimonialController.updateTestimonial);
router.delete('/:id', verifySuperAdmin, testimonialController.deleteTestimonial);

module.exports = router;

