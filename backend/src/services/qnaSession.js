const { randomUUID } = require('crypto');

const sessions = new Map();

function getKey(slideId) {
  if (!slideId) {
    throw new Error('slideId is required');
  }
  return slideId.toString();
}

function initializeSession({ slideId, allowMultiple = false }) {
  const key = getKey(slideId);
  const existing = sessions.get(key);
  if (existing) {
    existing.allowMultiple = Boolean(allowMultiple);
    return existing;
  }

  const session = {
    slideId: key,
    allowMultiple: Boolean(allowMultiple),
    questions: [],
    activeQuestionId: null
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
      allowMultiple: false,
      questions: [],
      activeQuestionId: null
    };
  }
  return {
    allowMultiple: session.allowMultiple,
    questions: [...session.questions].sort((a, b) => a.timestamp - b.timestamp),
    activeQuestionId: session.activeQuestionId || null
  };
}

function sanitizeQuestion(text) {
  const trimmed = (text || '').toString().trim();
  if (!trimmed) {
    return { error: 'Please enter a question.' };
  }
  const limited = trimmed.slice(0, 200);
  return { value: limited };
}

function normalizeAuthorName(name) {
  const trimmed = (name || 'Anonymous').toString().trim();
  return trimmed.length === 0 ? 'Anonymous' : trimmed.slice(0, 80);
}

function submitQuestion({ slideId, participantId, participantName, text, id }) {
  if (!participantId) {
    return { error: 'Participant information missing.' };
  }
  const session = getSession(slideId);
  if (!session) {
    return { error: 'Q&A session not initialized.' };
  }

  const { value, error } = sanitizeQuestion(text);
  if (error) {
    return { error };
  }

  const normalizedName = normalizeAuthorName(participantName);

  const duplicate = session.questions.find((q) => q.text.toLowerCase() === value.toLowerCase());
  if (duplicate) {
    return { error: 'This question has already been asked.' };
  }

  const participantQuestions = session.questions.filter((q) => q.authorId === participantId);
  const hasPendingQuestion = participantQuestions.some((q) => !q.answered);

  if (hasPendingQuestion) {
    return {
      error: session.allowMultiple
        ? 'Please wait for your previous question to be answered before asking another.'
        : 'You can only ask one question for this slide.'
    };
  }

  if (!session.allowMultiple && participantQuestions.length > 0) {
    return { error: 'You can only ask one question for this slide.' };
  }

  const question = {
    id: id || randomUUID(),
    text: value,
    answered: false,
    timestamp: Date.now(),
    authorId: participantId,
    authorName: normalizedName
  };

  session.questions.push(question);
  session.questions.sort((a, b) => a.timestamp - b.timestamp);

  return {
    question,
    state: getState(slideId)
  };
}

function markAnswered({ slideId, questionId, answered = true, answerText = null }) {
  const session = getSession(slideId);
  if (!session) {
    return { error: 'Q&A session not initialized.' };
  }

  const target = session.questions.find((q) => q.id === questionId);
  if (!target) {
    return { error: 'Question not found.' };
  }

  target.answered = Boolean(answered);
  target.answeredAt = Date.now();
  
  // Store answer text if provided
  if (answerText !== null && answerText !== undefined) {
    const trimmed = (answerText || '').toString().trim();
    target.answerText = trimmed.slice(0, 1000); // Limit to 1000 characters
  }

  if (session.activeQuestionId === questionId) {
    session.activeQuestionId = null;
  }

  return {
    question: target,
    state: getState(slideId)
  };
}

function clearQuestions({ slideId }) {
  const session = getSession(slideId);
  if (!session) {
    return { success: false, error: 'Q&A session not initialized.' };
  }
  session.questions = [];
  session.activeQuestionId = null;
  return { success: true, state: getState(slideId) };
}

function updateSettings({ slideId, allowMultiple }) {
  const session = initializeSession({ slideId, allowMultiple: Boolean(allowMultiple) });
  session.allowMultiple = Boolean(allowMultiple);
  return {
    state: getState(slideId)
  };
}

function setActiveQuestion({ slideId, questionId }) {
  const session = getSession(slideId);
  if (!session) {
    return { error: 'Q&A session not initialized.' };
  }

  if (!questionId) {
    session.activeQuestionId = null;
    return { state: getState(slideId) };
  }

  const target = session.questions.find((q) => q.id === questionId);
  if (!target) {
    return { error: 'Question not found.' };
  }

  session.activeQuestionId = questionId;
  return { state: getState(slideId) };
}

module.exports = {
  initializeSession,
  clearSession,
  clearAllSessionsForPresentation,
  getSession,
  getState,
  submitQuestion,
  markAnswered,
  clearQuestions,
  updateSettings,
  setActiveQuestion
};
