/**
 * Quiz Session Service
 * Manages quiz state during live presentations (in-memory)
 */

const sessions = new Map();

function getKey(slideId) {
  if (!slideId) {
    throw new Error('slideId is required');
  }
  return slideId.toString();
}

/**
 * Initialize a quiz session
 * @param {Object} params
 * @param {string} params.slideId
 * @param {number} params.timeLimit - Time limit in seconds
 * @param {string} params.correctOptionId
 * @returns {Object} - Session object
 */
function initializeSession({ slideId, timeLimit, correctOptionId }) {
  const key = getKey(slideId);
  
  const session = {
    slideId: key,
    timeLimit,
    correctOptionId,
    startTime: null,
    endTime: null,
    isActive: false,
    responses: new Map(), // participantId -> { answer, responseTime, timestamp }
    results: null,
    autoEndTimer: null
  };
  
  sessions.set(key, session);
  return session;
}

/**
 * Start a quiz session
 * @param {string} slideId
 * @returns {Object} - Updated session
 */
function startSession(slideId) {
  const key = getKey(slideId);
  const session = sessions.get(key);
  
  if (!session) {
    throw new Error('Quiz session not initialized');
  }
  
  if (session.autoEndTimer) {
    clearTimeout(session.autoEndTimer);
    session.autoEndTimer = null;
  }

  session.startTime = Date.now();
  session.isActive = true;
  session.endTime = null;
  
  return session;
}

/**
 * End a quiz session
 * @param {string} slideId
 * @returns {Object} - Updated session with results
 */
function endSession(slideId) {
  const key = getKey(slideId);
  const session = sessions.get(key);
  
  if (!session) {
    throw new Error('Quiz session not found');
  }
  
  if (session.autoEndTimer) {
    clearTimeout(session.autoEndTimer);
    session.autoEndTimer = null;
  }

  session.endTime = Date.now();
  session.isActive = false;
  
  return session;
}

/**
 * Record a participant's response
 * @param {Object} params
 * @param {string} params.slideId
 * @param {string} params.participantId
 * @param {string} params.answer - Selected option ID
 * @param {number} params.responseTime - Time taken in milliseconds
 * @returns {Object} - Response record
 */
function recordResponse({ slideId, participantId, answer, responseTime }) {
  const key = getKey(slideId);
  const session = sessions.get(key);
  
  if (!session) {
    throw new Error('Quiz session not found');
  }
  
  if (!session.isActive) {
    throw new Error('Quiz session is not active');
  }
  
  const response = {
    answer,
    responseTime,
    timestamp: Date.now(),
    isCorrect: answer === session.correctOptionId
  };
  
  session.responses.set(participantId, response);
  return response;
}

/**
 * Get session state
 * @param {string} slideId
 * @returns {Object|null} - Session object or null
 */
function getSession(slideId) {
  const key = getKey(slideId);
  return sessions.get(key) || null;
}

/**
 * Get quiz results
 * @param {string} slideId
 * @returns {Object} - Results summary
 */
function getResults(slideId) {
  const key = getKey(slideId);
  const session = sessions.get(key);
  
  if (!session) {
    return {
      totalResponses: 0,
      optionCounts: {},
      correctCount: 0,
      incorrectCount: 0,
      averageResponseTime: 0
    };
  }
  
  const optionCounts = {};
  let correctCount = 0;
  let incorrectCount = 0;
  let totalResponseTime = 0;
  
  session.responses.forEach((response) => {
    // Count by option
    optionCounts[response.answer] = (optionCounts[response.answer] || 0) + 1;
    
    // Count correct/incorrect
    if (response.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }
    
    // Sum response times
    totalResponseTime += response.responseTime;
  });
  
  const totalResponses = session.responses.size;
  const averageResponseTime = totalResponses > 0 ? totalResponseTime / totalResponses : 0;
  
  return {
    totalResponses,
    optionCounts,
    correctCount,
    incorrectCount,
    averageResponseTime: Math.round(averageResponseTime)
  };
}

/**
 * Check if participant has already responded
 * @param {string} slideId
 * @param {string} participantId
 * @returns {boolean}
 */
function hasParticipantResponded(slideId, participantId) {
  const key = getKey(slideId);
  const session = sessions.get(key);
  
  if (!session) {
    return false;
  }
  
  return session.responses.has(participantId);
}

/**
 * Clear a session
 * @param {string} slideId
 */
function clearSession(slideId) {
  const key = getKey(slideId);
  const session = sessions.get(key);
  if (session?.autoEndTimer) {
    clearTimeout(session.autoEndTimer);
  }
  sessions.delete(key);
}

/**
 * Clear all sessions for a presentation
 * @param {Array<string>} slideIds
 */
function clearAllSessions(slideIds = []) {
  if (Array.isArray(slideIds) && slideIds.length > 0) {
    slideIds.forEach((slideId) => {
      const key = getKey(slideId);
      const session = sessions.get(key);
      if (session?.autoEndTimer) {
        clearTimeout(session.autoEndTimer);
      }
      sessions.delete(key);
    });
  }
}

function scheduleAutoEnd(slideId, callback, delay) {
  const key = getKey(slideId);
  const session = sessions.get(key);

  if (!session) {
    throw new Error('Quiz session not found');
  }

  if (session.autoEndTimer) {
    clearTimeout(session.autoEndTimer);
  }

  const timerId = setTimeout(() => {
    session.autoEndTimer = null;
    callback();
  }, delay);

  session.autoEndTimer = timerId;
  return timerId;
}

function clearAutoEndTimer(slideId) {
  const key = getKey(slideId);
  const session = sessions.get(key);

  if (!session) {
    return;
  }

  if (session.autoEndTimer) {
    clearTimeout(session.autoEndTimer);
    session.autoEndTimer = null;
  }
}

module.exports = {
  initializeSession,
  startSession,
  endSession,
  recordResponse,
  getSession,
  getResults,
  hasParticipantResponded,
  clearSession,
  clearAllSessions,
  scheduleAutoEnd,
  clearAutoEndTimer
};
