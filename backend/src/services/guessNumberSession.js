const sessions = new Map();

function getKey(slideId) {
  if (!slideId) {
    throw new Error('slideId is required');
  }
  return slideId.toString();
}

function initializeSession({ slideId, minValue, maxValue, correctAnswer }) {
  const key = getKey(slideId);
  const existing = sessions.get(key);
  
  if (existing) {
    existing.minValue = minValue;
    existing.maxValue = maxValue;
    existing.correctAnswer = correctAnswer;
    return existing;
  }

  const session = {
    slideId: key,
    minValue,
    maxValue,
    correctAnswer,
    responses: new Map() // number -> count
  };
  
  sessions.set(key, session);
  return session;
}

function clearSession(slideId) {
  sessions.delete(getKey(slideId));
}

function clearAllSessionsForPresentation(_presentationId, slideIds = []) {
  if (Array.isArray(slideIds) && slideIds.length > 0) {
    slideIds.forEach((slideId) => {
      const key = getKey(slideId);
      if (sessions.has(key)) {
        sessions.delete(key);
      }
    });
  }
}

function getSession(slideId) {
  const key = getKey(slideId);
  return sessions.get(key) || null;
}

function getState(slideId) {
  const session = getSession(slideId);
  if (!session) {
    return {
      minValue: 1,
      maxValue: 10,
      correctAnswer: null,
      distribution: {}
    };
  }

  // Convert Map to object for distribution
  const distribution = {};
  session.responses.forEach((count, number) => {
    distribution[number] = count;
  });

  return {
    minValue: session.minValue,
    maxValue: session.maxValue,
    correctAnswer: session.correctAnswer,
    distribution
  };
}

function submitGuess({ slideId, participantId, guess }) {
  if (!participantId) {
    return { error: 'Participant information missing.' };
  }

  const session = getSession(slideId);
  if (!session) {
    return { error: 'Guess session not initialized.' };
  }

  const guessNum = Number(guess);
  if (isNaN(guessNum)) {
    return { error: 'Invalid guess value.' };
  }

  if (guessNum < session.minValue || guessNum > session.maxValue) {
    return { error: `Guess must be between ${session.minValue} and ${session.maxValue}.` };
  }

  // Increment count for this number
  const currentCount = session.responses.get(guessNum) || 0;
  session.responses.set(guessNum, currentCount + 1);

  return {
    success: true,
    state: getState(slideId)
  };
}

function clearResponses({ slideId }) {
  const session = getSession(slideId);
  if (!session) {
    return { success: false, error: 'Session not initialized.' };
  }
  
  session.responses.clear();
  return { success: true, state: getState(slideId) };
}

module.exports = {
  initializeSession,
  clearSession,
  clearAllSessionsForPresentation,
  getSession,
  getState,
  submitGuess,
  clearResponses
};
