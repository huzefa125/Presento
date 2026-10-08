/**
 * Presentation Controller - leaderboard
 * Split out of the former presentationController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const Presentation = require('../../models/Presentation');
const Slide = require('../../models/Slide');
const leaderboardService = require('../../services/leaderboardService');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const { buildLeaderboardSummary } = require('./results');

/**
 * Create leaderboard slide for a quiz
 * @route POST /api/presentations/:presentationId/slides/:slideId/leaderboard
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {string} req.params.slideId - Quiz slide ID
 * @returns {Object} Created leaderboard slide
 */
const createLeaderboardForQuiz = asyncHandler(async (req, res, next) => {
  const { presentationId, slideId } = req.params;
  const userId = req.userId;

  const presentation = await Presentation.findOne({
    _id: presentationId,
    userId
  });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const quizSlide = await Slide.findOne({
    _id: slideId,
    presentationId,
    type: 'quiz'
  });

  if (!quizSlide) {
    throw new AppError('Quiz slide not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const leaderboard = await leaderboardService.createLeaderboardSlide({
    presentationId,
    quizSlideId: slideId,
    quizSlideOrder: quizSlide.order
  });

  res.status(201).json({
    success: true,
    message: 'Leaderboard created successfully',
    leaderboard
  });
});

/**
 * Get leaderboard for presentation
 * @route GET /api/presentations/:presentationId/leaderboard
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {number} req.query.limit - Limit for leaderboard entries (default: 10)
 * @returns {Object} Leaderboard data
 */
const getLeaderboard = asyncHandler(async (req, res, next) => {
  const { presentationId } = req.params;
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 10;

  const presentation = await Presentation.findOne({
    _id: presentationId,
    userId
  });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const { perQuizLeaderboards, finalLeaderboard } = await buildLeaderboardSummary({
    presentationId,
    limit,
  });

  res.status(200).json({
    success: true,
    finalLeaderboard,
    perQuizLeaderboards,
  });
});

/**
 * Generate leaderboard slides for all quizzes with responses
 * @route POST /api/presentations/:presentationId/leaderboards/generate
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @returns {Object} Created leaderboard slides
 */
const generateLeaderboards = asyncHandler(async (req, res, next) => {
  const { presentationId } = req.params;
  const userId = req.userId;

  const presentation = await Presentation.findOne({
    _id: presentationId,
    userId
  });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const leaderboards = await leaderboardService.createLeaderboardsForPresentation(presentationId);

  res.status(200).json({
    success: true,
    message: `Created ${leaderboards.length} leaderboard slide(s)`,
    leaderboards
  });
});

module.exports = {
  createLeaderboardForQuiz,
  getLeaderboard,
  generateLeaderboards
};
