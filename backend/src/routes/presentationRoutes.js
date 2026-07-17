const express = require('express');
const router = express.Router();
const presentationController = require('../controllers/presentationController');
const { verifyToken } = require('../middleware/auth');
const { checkSlideLimit } = require('../middleware/checkPlanLimits');


// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /api/presentations:
 *   post:
 *     summary: Create a new presentation
 *     tags: [Presentations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: My New Presentation
 *     responses:
 *       201:
 *         description: Presentation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 presentation:
 *                   $ref: '#/components/schemas/Presentation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', presentationController.createPresentation);

/**
 * @swagger
 * /api/presentations:
 *   get:
 *     summary: Get all presentations for the logged-in user
 *     tags: [Presentations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of presentations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     presentations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Presentation'
 *                     totalPages:
 *                       type: number
 *                     currentPage:
 *                       type: number
 */
router.get('/', presentationController.getUserPresentations);

/**
 * @swagger
 * /api/presentations/{id}:
 *   get:
 *     summary: Get a single presentation by ID with all slides
 *     tags: [Presentations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Presentation ID
 *     responses:
 *       200:
 *         description: Presentation details with slides
 *       404:
 *         description: Presentation not found
 */
router.get('/:id', presentationController.getPresentationById);

/**
 * @route   PUT /api/presentations/:id
 * @desc    Update presentation
 * @access  Private
 */
router.put('/:id', presentationController.updatePresentation);

/**
 * @route   DELETE /api/presentations/:id
 * @desc    Delete presentation and all its slides
 * @access  Private
 */
router.delete('/:id', presentationController.deletePresentation);

/**
 * @route   GET /api/presentations/:id/results
 * @desc    Get all presentations results for given presentation ID
 * @access  Private
 */
router.get('/:id/results', presentationController.getPresentationResultById);

/**
 * @route   DELETE /api/presentations/:id/results
 * @desc    Clear all results for a presentation (responses, scores, sessions)
 * @access  Private
 */
router.delete('/:id/results', presentationController.clearPresentationResults);
router.post('/:id/recalculate-scores', presentationController.recalculatePresentationScores);

/**
 * @route   DELETE /api/presentations/:presentationId/slides/:slideId/results
 * @desc    Clear results for a specific slide
 * @access  Private
 */
router.delete('/:presentationId/slides/:slideId/results', presentationController.clearSlideResults);

/**
 * @route   GET /api/presentations/:id/export
 * @desc    Export presentation results (CSV/Excel)
 * @access  Private
 */
router.get('/:id/export', presentationController.exportPresentationResults);

/**
 * @route   POST /api/presentations/:presentationId/slides
 * @desc    Create a new slide in a presentation
 * @access  Private
 */

// Middleware to check slide limit before creating a new slide
router.post('/:presentationId/slides', checkSlideLimit, presentationController.createSlide);

/**
 * @route   PUT /api/presentations/:presentationId/slides/:slideId
 * @desc    Update a slide
 * @access  Private
 */
router.put('/:presentationId/slides/:slideId', presentationController.updateSlide);

/**
 * @route   DELETE /api/presentations/:presentationId/slides/:slideId
 * @desc    Delete a slide
 * @access  Private
 */
router.delete('/:presentationId/slides/:slideId', presentationController.deleteSlide);

/**
 * @route   POST /api/presentations/:presentationId/quiz/:slideId/leaderboard
 * @desc    Create leaderboard slide for a quiz
 * @access  Private
 */
router.post('/:presentationId/quiz/:slideId/leaderboard', presentationController.createLeaderboardForQuiz);

/**
 * @route   GET /api/presentations/:presentationId/leaderboard
 * @desc    Get current leaderboard for presentation
 * @access  Private
 */
router.get('/:presentationId/leaderboard', presentationController.getLeaderboard);

/**
 * @route   POST /api/presentations/:presentationId/generate-leaderboards
 * @desc    Generate leaderboard slides for all quizzes with responses
 * @access  Private
 */
router.post('/:presentationId/generate-leaderboards', presentationController.generateLeaderboards);

/**
 * @route   PUT /api/presentations/:presentationId/qna/:questionId/status
 * @desc    Toggle QnA question status
 * @access  Private
 */
router.put('/:presentationId/qna/:questionId/status', presentationController.toggleQnaStatus);

/**
 * @swagger
 * /api/presentations/{presentationId}/slides/{slideId}/responses:
 *   get:
 *     summary: Get all responses for a specific slide
 *     tags: [Presentations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: presentationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Responses retrieved successfully
 *       404:
 *         description: Presentation or slide not found
 */
router.get('/:presentationId/slides/:slideId/responses', presentationController.getSlideResponses);

module.exports = router;
