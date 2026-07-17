const {
  initializeSession,
  getState
} = require('../services/guessNumberSession');

function ensureSession(slide) {
  if (!slide || slide.type !== 'guess_number') {
    return null;
  }

  const { minValue, maxValue, correctAnswer } = slide.guessNumberSettings || {};

  return initializeSession({
    slideId: slide._id,
    minValue: minValue || 1,
    maxValue: maxValue || 10,
    correctAnswer: correctAnswer || 5
  });
}

function buildResults(slide, responses) {
  // ensureSession(slide); // Optional: if we want to ensure in-memory session exists

  const distribution = {};
  if (Array.isArray(responses)) {
    responses.forEach(r => {
      // Handle potential array or single value answer
      let val = r.answer;
      if (Array.isArray(val) && val.length > 0) {
        val = val[0];
      }

      const numVal = Number(val);
      if (!isNaN(numVal)) {
        distribution[numVal] = (distribution[numVal] || 0) + 1;
      }
    });
  }

  return {
    guessNumberState: {
      minValue: slide?.guessNumberSettings?.minValue || 1,
      maxValue: slide?.guessNumberSettings?.maxValue || 10,
      correctAnswer: slide?.guessNumberSettings?.correctAnswer,
      distribution
    }
  };
}

module.exports = {
  buildResults
};
