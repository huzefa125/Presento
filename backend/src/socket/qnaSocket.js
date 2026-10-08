/**
 * Q&A socket handlers - the socket.io wiring around services/qnaSession.js.
 * Split out of the former socketHandlers.js monolith; see CODE_STANDARDS.md.
 */
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const Logger = require('../utils/logger');
const {
  initializeSession: initializeQnaSession,
  submitQuestion: submitQnaQuestion,
  markAnswered: markQnaAnswered,
  clearQuestions: clearQnaQuestions,
  updateSettings: updateQnaSettings,
  setActiveQuestion: setQnaActiveQuestion
} = require('../services/qnaSession');
const { isAuthorizedPresenter, buildQnaPayload, buildResultsPayload, emitQnaState } = require('./_sharedHelpers');

function attachQnaSocketHandlers(io, socket) {
  socket.on('submit-qna-question', async ({ presentationId, slideId, participantId, participantName, text }) => {
    try {
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'qna') {
        socket.emit('error', { message: 'Q&A slide not found' });
        return;
      }

      initializeQnaSession({
        slideId: slide._id,
        allowMultiple: Boolean(slide.qnaSettings?.allowMultiple)
      });

      // Create response in DB first
      const response = new Response({
        presentationId,
        slideId: slide._id,
        participantId,
        participantName,
        answer: text,
        isAnswered: false
      });
      await response.save();

      const result = submitQnaQuestion({
        slideId: slide._id,
        participantId,
        participantName,
        text,
        id: response._id.toString()
      });

      if (result.error) {
        await Response.deleteOne({ _id: response._id });
        socket.emit('error', { message: result.error });
        return;
      }

      emitQnaState({ io, presentationId, slideId: slide._id });

      const responses = await Response.find({ slideId: slide._id });
      const results = buildResultsPayload(slide, responses);
      io.to(`presentation-${presentationId}`).emit('response-updated', {
        slideId: slide._id.toString(),
        ...results
      });

      socket.emit('qna-question-submitted', {
        slideId: slide._id,
        questionId: result.question.id
      });
    } catch (error) {
      Logger.error('Submit Q&A question error', error);
      socket.emit('error', { message: 'Failed to submit question' });
    }
  });

  socket.on('mark-qna-answered', async ({ presentationId, slideId, questionId, answered, answerText = null }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can manage Q&A' });
        return;
      }
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'qna') {
        socket.emit('error', { message: 'Q&A slide not found' });
        return;
      }

      // Update Response model - store answer text in the answer field (it currently stores the question text)
      const updateData = { isAnswered: answered };
      if (answerText !== null && answerText !== undefined) {
        // Store the presenter's answer - we'll keep the original question in a separate field if needed
        // For now, we'll store the answer text in the answer field when answered
        updateData.presenterAnswer = answerText.trim().slice(0, 1000);
      }

      await Response.findByIdAndUpdate(questionId, updateData);

      const result = markQnaAnswered({ slideId: slide._id, questionId, answered, answerText });
      if (result.error) {
        Logger.warn(`In-memory QnA update failed: ${result.error}`);
      }

      await emitQnaState({ io, presentationId, slideId: slide._id });

      const responses = await Response.find({ slideId: slide._id });
      const results = buildResultsPayload(slide, responses);
      io.to(`presentation-${presentationId}`).emit('response-updated', {
        slideId: slide._id.toString(),
        ...results
      });
    } catch (error) {
      Logger.error('Mark Q&A answered error', error);
      socket.emit('error', { message: 'Failed to update question status' });
    }
  });

  socket.on('set-qna-active-question', async ({ presentationId, slideId, questionId }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can manage Q&A' });
        return;
      }
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'qna') {
        socket.emit('error', { message: 'Q&A slide not found' });
        return;
      }

      const result = setQnaActiveQuestion({ slideId: slide._id, questionId });
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      await emitQnaState({ io, presentationId, slideId: slide._id });
    } catch (error) {
      Logger.error('Set Q&A active question error', error);
      socket.emit('error', { message: 'Failed to set active question' });
    }
  });

  socket.on('clear-qna-questions', async ({ presentationId, slideId }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can manage Q&A' });
        return;
      }
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'qna') {
        socket.emit('error', { message: 'Q&A slide not found' });
        return;
      }

      await Response.deleteMany({ slideId: slide._id });

      const result = clearQnaQuestions({ slideId: slide._id });
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      await emitQnaState({ io, presentationId, slideId: slide._id });

      const responses = [];
      const results = buildResultsPayload(slide, responses);
      io.to(`presentation-${presentationId}`).emit('response-updated', {
        slideId: slide._id.toString(),
        ...results
      });
    } catch (error) {
      Logger.error('Clear Q&A questions error', error);
      socket.emit('error', { message: 'Failed to clear questions' });
    }
  });

  socket.on('update-qna-settings', async ({ presentationId, slideId, allowMultiple }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can manage Q&A' });
        return;
      }
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'qna') {
        socket.emit('error', { message: 'Q&A slide not found' });
        return;
      }

      updateQnaSettings({ slideId: slide._id, allowMultiple });
      await emitQnaState({ io, presentationId, slideId: slide._id });
    } catch (error) {
      Logger.error('Update Q&A settings error', error);
      socket.emit('error', { message: 'Failed to update Q&A settings' });
    }
  });

  socket.on('request-qna-state', async ({ presentationId, slideId }) => {
    try {
      const payload = await buildQnaPayload(slideId);
      socket.emit('qna-updated', payload);
    } catch (error) {
      Logger.error('Request Q&A state error', error);
    }
  });
}

module.exports = { attachQnaSocketHandlers };
