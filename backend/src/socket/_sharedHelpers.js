/**
 * Shared state + helpers used across the socket handler modules.
 *
 * activePresentations and platformStats are plain objects (a Map and a
 * counter object respectively) - every file that requires this module gets
 * Node's cached instance back, so mutating activePresentations.set(...) or
 * platformStats.total++ here is visible to every other module that also
 * requires it, with no parameter-threading needed. This is what lets the
 * handler groups below live in separate files while still sharing one
 * source of truth for "who is presenting what" and "how many users are
 * connected".
 *
 * Split out of the former socketHandlers.js monolith; see CODE_STANDARDS.md.
 */
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const { getHandler } = require('../interactions');
const { getState: getQnaState } = require('../services/qnaSession');
const { checkAudienceLimit } = require('../middleware/checkPlanLimits');

// presentationId (string) -> { presenterSocket, participants: Map<socketId, name>,
// participantSockets?, pendingParticipants?, approvedParticipants?, hasEverBeenLive }
const activePresentations = new Map();

// Total users connected to the platform (not just inside a presentation).
// An object so the count can be shared by reference the same way the Map is.
const platformStats = { total: 0 };

function isAuthorizedPresenter(presentationId, socketId) {
  const entry = activePresentations.get(presentationId?.toString());
  return Boolean(entry && entry.presenterSocket === socketId);
}

function buildSlidePayload(slide) {
  const openEndedSettings = slide.openEndedSettings && typeof slide.openEndedSettings.toObject === 'function'
    ? slide.openEndedSettings.toObject()
    : (slide.openEndedSettings || {});
  const qnaSettings = slide.qnaSettings && typeof slide.qnaSettings.toObject === 'function'
    ? slide.qnaSettings.toObject()
    : (slide.qnaSettings || {});
  let guessNumberSettings = slide.guessNumberSettings && typeof slide.guessNumberSettings.toObject === 'function'
    ? slide.guessNumberSettings.toObject()
    : (slide.guessNumberSettings || {});
  // Ensure guess_number slides always have settings
  if (slide.type === 'guess_number' && (!guessNumberSettings || Object.keys(guessNumberSettings).length === 0)) {
    guessNumberSettings = { minValue: 1, maxValue: 10, correctAnswer: 5 };
  }

  const quizSettings = slide.quizSettings && typeof slide.quizSettings.toObject === 'function'
    ? slide.quizSettings.toObject()
    : (slide.quizSettings || null);
  const leaderboardSettings = slide.leaderboardSettings && typeof slide.leaderboardSettings.toObject === 'function'
    ? slide.leaderboardSettings.toObject()
    : (slide.leaderboardSettings || null);
  const pinOnImageSettings = slide.pinOnImageSettings && typeof slide.pinOnImageSettings.toObject === 'function'
    ? slide.pinOnImageSettings.toObject()
    : (slide.pinOnImageSettings || null);
  const compareSettings = slide.compareSettings && typeof slide.compareSettings.toObject === 'function'
    ? slide.compareSettings.toObject()
    : (slide.compareSettings || null);

  return {
    id: slide._id,
    type: slide.type,
    question: slide.question,
    options: slide.options,
    minValue: slide.minValue,
    maxValue: slide.maxValue,
    minLabel: slide.minLabel,
    maxLabel: slide.maxLabel,
    statements: slide.statements,
    rankingItems: slide.rankingItems,
    hundredPointsItems: slide.hundredPointsItems,
    gridItems: slide.gridItems,
    gridAxisXLabel: slide.gridAxisXLabel,
    gridAxisYLabel: slide.gridAxisYLabel,
    gridAxisRange: slide.gridAxisRange,
    maxWordsPerParticipant: slide.maxWordsPerParticipant,
    openEndedSettings,
    qnaSettings,
    guessNumberSettings,
    pinOnImageSettings,
    quizSettings,
    leaderboardSettings,
    compareSettings,
    // Fields for text, image, and video slide types
    textContent: slide.textContent,
    imageUrl: slide.imageUrl,
    imagePublicId: slide.imagePublicId,
    videoUrl: slide.videoUrl,
    videoPublicId: slide.videoPublicId,
    instructionContent: slide.instructionContent,
    // Fields for "Bring Your Slides In" slide types
    miroUrl: slide.miroUrl,
    powerpointUrl: slide.powerpointUrl,
    powerpointPublicId: slide.powerpointPublicId,
    powerpointPages: slide.powerpointPages,
    googleSlidesUrl: slide.googleSlidesUrl,
    pdfUrl: slide.pdfUrl,
    pdfPublicId: slide.pdfPublicId,
    pdfPages: slide.pdfPages
  };
}

async function buildQnaPayload(slideId) {
  const state = getQnaState(slideId) || { allowMultiple: false, questions: [] };
  
  // Fetch answerText from Response model for each question
  const questionsWithAnswers = await Promise.all(
    (Array.isArray(state.questions) ? state.questions : []).map(async (question) => {
      try {
        const response = await Response.findById(question.id);
        if (response && response.presenterAnswer) {
          return {
            ...question,
            answerText: response.presenterAnswer
          };
        }
        return question;
      } catch (error) {
        // If Response not found or error, return question as-is
        return question;
      }
    })
  );
  
  return {
    slideId,
    allowMultiple: Boolean(state.allowMultiple),
    questions: questionsWithAnswers,
    activeQuestionId: state.activeQuestionId || null
  };
}

async function emitQnaState({ io, presentationId, slideId }) {
  const payload = await buildQnaPayload(slideId);
  io.to(`presentation-${presentationId}`).emit('qna-updated', payload);
  io.to(`presenter-${presentationId}`).emit('qna-updated', payload);
}

function buildResultsPayload(slide, responses) {
  const openEndedSettings = slide.openEndedSettings && typeof slide.openEndedSettings.toObject === 'function'
    ? slide.openEndedSettings.toObject()
    : (slide.openEndedSettings || {});
  const qnaSettings = slide.qnaSettings && typeof slide.qnaSettings.toObject === 'function'
    ? slide.qnaSettings.toObject()
    : (slide.qnaSettings || {});

  const payload = { totalResponses: responses.length };
  const handler = getHandler(slide.type);
  if (handler && typeof handler.buildResults === 'function') {
    Object.assign(
      payload,
      handler.buildResults(slide, responses, {
        openEndedSettings,
        qnaSettings
      })
    );
  }
  return payload;
}

async function admitParticipant({ io, presentation, activeEntry, presentationKey, socket, participantId, participantName }) {
  const currentCount = activeEntry.participants.size;
  const canJoin = await checkAudienceLimit(presentation.userId, presentation._id, currentCount);

  if (!canJoin) {
    socket.emit('error', {
      message: 'Session is full. The presenter needs to upgrade their plan to admit more participants.'
    });
    activeEntry.participants.delete(socket.id);
    activeEntry.participantSockets?.delete(participantId);
    socket.leave(`presentation-${presentation._id}`);
    return;
  }

  activeEntry.participants.set(socket.id, participantName || 'Anonymous');

  const participantCount = activeEntry.participants.size;
  if (activeEntry.presenterSocket) {
    const participantList = Array.from(activeEntry.participants.values());
    io.to(`presenter-${presentationKey}`).emit('participant-list-updated', {
      participantCount,
      participants: participantList
    });
    io.to(`presenter-${presentationKey}`).emit('participant-joined', { participantCount });
  }

  const slides = await Slide.find({ presentationId: presentation._id }).sort({ order: 1 });
  if (presentation.currentSlideIndex < 0 || presentation.currentSlideIndex >= slides.length) {
    presentation.currentSlideIndex = 0;
    await presentation.save();
  }

  const currentSlide = slides[presentation.currentSlideIndex];

  if (currentSlide) {
    const responses = await Response.find({ slideId: currentSlide._id });

    let participantResponse = null;
    let hasSubmitted = false;

    if (participantId) {
      participantResponse = await Response.findOne({ slideId: currentSlide._id, participantId });

      if (participantResponse) {
        if (currentSlide.type === 'word_cloud') {
          const maxWords = Math.max(1, Number(currentSlide.maxWordsPerParticipant) || 1);
          hasSubmitted = (participantResponse.submissionCount || 0) >= maxWords;
        } else {
          hasSubmitted = true;
        }
      }
    }

    socket.emit('joined-presentation', {
      presentation: {
        id: presentation._id,
        title: presentation.title,
        accessCode: presentation.accessCode,
        currentSlideIndex: presentation.currentSlideIndex,
        theme: presentation.theme
      },
      slide: buildSlidePayload(currentSlide),
      ...buildResultsPayload(currentSlide, responses),
      hasSubmitted,
      participantResponse: participantResponse
        ? {
          answer: participantResponse.answer,
          submissionCount: participantResponse.submissionCount || 0
        }
        : null
    });

    if (currentSlide.type === 'qna') {
      emitQnaState({ io, presentationId: presentation._id, slideId: currentSlide._id });
    }
  }
}

module.exports = {
  activePresentations,
  platformStats,
  isAuthorizedPresenter,
  buildSlidePayload,
  buildQnaPayload,
  emitQnaState,
  buildResultsPayload,
  admitParticipant
};
