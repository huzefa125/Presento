const {
  initializeSession,
  getState
} = require('../services/qnaSession');

function ensureSession(slide) {
  if (!slide || slide.type !== 'qna') {
    return null;
  }
  const allowMultiple = Boolean(slide.qnaSettings?.allowMultiple);
  return initializeSession({
    slideId: slide._id,
    allowMultiple
  });
}

function buildResults(slide) {
  ensureSession(slide);
  const state = getState(slide?._id);
  return {
    qnaState: state || {
      allowMultiple: Boolean(slide?.qnaSettings?.allowMultiple),
      questions: []
    }
  };
}

module.exports = {
  buildResults
};
