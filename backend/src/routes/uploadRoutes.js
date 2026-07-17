const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/upload/image
 * @desc    Upload image to Cloudinary
 * @access  Private
 */
router.post('/image', uploadController.uploadImage);

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete image from Cloudinary
 * @access  Private
 */
router.delete('/image', uploadController.deleteImage);

/**
 * @route   GET /api/upload/images
 * @desc    Get user's uploaded images
 * @access  Private
 */
router.get('/images', uploadController.getUserImages);

/**
 * @route   POST /api/upload/video
 * @desc    Upload video to Cloudinary
 * @access  Private
 */
router.post('/video', uploadController.uploadVideo);

/**
 * @route   DELETE /api/upload/video
 * @desc    Delete video from Cloudinary
 * @access  Private
 */
router.delete('/video', uploadController.deleteVideo);

/**
 * @route   POST /api/upload/powerpoint
 * @desc    Upload PowerPoint file to Cloudinary
 * @access  Private
 */
router.post('/powerpoint', uploadController.uploadPowerPoint);

/**
 * @route   POST /api/upload/pdf
 * @desc    Upload PDF file to Cloudinary
 * @access  Private
 */
router.post('/pdf', uploadController.uploadPdf);

module.exports = router;
