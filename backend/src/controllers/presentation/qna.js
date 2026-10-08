/**
 * Presentation Controller - qna
 * Split out of the former presentationController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const Presentation = require('../../models/Presentation');
const Response = require('../../models/Response');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');

/**
 * Toggle QnA question status (answered/unanswered)
 * @route PUT /api/presentations/:presentationId/questions/:questionId/status
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {string} req.params.questionId - Question/Response ID
 * @param {boolean} req.body.isAnswered - Answered status
 * @returns {Object} Updated question status
 */
const toggleQnaStatus = asyncHandler(async (req, res, next) => {
  const { presentationId, questionId } = req.params;
  const { isAnswered } = req.body;
  const userId = req.userId;

  const presentation = await Presentation.findOne({ _id: presentationId, userId });
  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const response = await Response.findOneAndUpdate(
    { _id: questionId, presentationId },
    { $set: { isAnswered } },
    { new: true }
  );

  if (!response) {
    throw new AppError('Question not found', 404, 'RESOURCE_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    question: {
      id: response._id,
      isAnswered: response.isAnswered
    }
  });
});

module.exports = {
  toggleQnaStatus
};
