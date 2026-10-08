/**
 * Presentation Controller
 *
 * Thin barrel over controllers/presentation/* - split by domain (crud,
 * results, leaderboard, qna) so CRUD, results/export, leaderboards and QnA
 * toggling aren't all crammed in one file. Also re-exports createSlide /
 * updateSlide / deleteSlide from slideController.js, exactly as the original
 * file did - presentationRoutes.js is unchanged. See CODE_STANDARDS.md.
 */
const { createSlide, updateSlide, deleteSlide } = require('./slideController.js');
module.exports = {
  createSlide,
  updateSlide,
  deleteSlide,
  ...require('./presentation/crud'),
  ...require('./presentation/results'),
  ...require('./presentation/leaderboard'),
  ...require('./presentation/qna')
};
