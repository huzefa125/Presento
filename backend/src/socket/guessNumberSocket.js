/**
 * Guess-number socket handlers - the socket.io wiring around
 * services/guessNumberSession.js. Split out of the former socketHandlers.js
 * monolith; see CODE_STANDARDS.md.
 */
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const Logger = require('../utils/logger');
const {
  initializeSession: initializeGuessSession,
  submitGuess,
  clearResponses: clearGuessResponses
} = require('../services/guessNumberSession');
const { isAuthorizedPresenter, buildSlidePayload, buildResultsPayload } = require('./_sharedHelpers');

function attachGuessNumberSocketHandlers(io, socket) {
  // Guess Number handlers
  // Guess Number handlers
  socket.on('submit-guess', async ({ presentationId, slideId, participantId, guess }) => {
    try {
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'guess_number') {
        socket.emit('error', { message: 'Guess slide not found' });
        return;
      }

      const { minValue, maxValue, correctAnswer } = slide.guessNumberSettings || {};

      initializeGuessSession({
        slideId: slide._id,
        minValue,
        maxValue,
        correctAnswer
      });

      // Check if guess is correct
      const guessNum = Number(guess);
      const isCorrect = correctAnswer !== null && !isNaN(guessNum) && Number(correctAnswer) === guessNum;
      // Guess number slides don't contribute to leaderboard, but track correctness for consistency
      // Ensure incorrect guesses get 0 points (correct guesses also get 0 since guess number doesn't use scoring)
      const score = 0;

      // Create response in DB first - track isCorrect and score like quiz slides
      const response = await Response.findOneAndUpdate(
        { slideId: slide._id, participantId, interactionType: 'guess_number' },
        {
          $setOnInsert: {
            presentationId,
            slideId: slide._id,
            participantId,
            participantName: participantId,
            answer: guess,
            submissionCount: 1,
            isCorrect,
            score,
            interactionType: 'guess_number'
          }
        },
        { new: true, upsert: true, includeResultMetadata: true }
      );

      if (response.lastErrorObject && !response.lastErrorObject.upserted) {
        socket.emit('error', { message: 'You have already submitted a guess for this slide.' });
        return;
      }

      const result = submitGuess({
        slideId: slide._id,
        participantId,
        guess
      });

      if (result.error) {
        // Rollback DB if in-memory fails
        await Response.deleteOne({ _id: response.value?._id });
        socket.emit('error', { message: result.error });
        return;
      }

      // Also emit standard response-updated event for consistency
      const responses = await Response.find({ slideId: slide._id });
      const results = buildResultsPayload(slide, responses);
      io.to(`presentation-${presentationId}`).emit('response-updated', {
        slideId: slide._id.toString(),
        slide: buildSlidePayload(slide),
        ...results
      });

      socket.emit('guess-submitted', { success: true });
    } catch (error) {
      Logger.error('Submit guess error', error);
      socket.emit('error', { message: 'Failed to submit guess' });
    }
  });

  socket.on('clear-guess-responses', async ({ presentationId, slideId }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can manage this' });
        return;
      }
      const slide = await Slide.findById(slideId);
      if (!slide || slide.type !== 'guess_number') {
        socket.emit('error', { message: 'Guess slide not found' });
        return;
      }

      await Response.deleteMany({ slideId: slide._id });

      const result = clearGuessResponses({ slideId: slide._id });
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      io.to(`presentation-${presentationId}`).emit('guess-reset', {
        slideId: slide._id
      });

      // Emit empty responses
      const responses = [];
      const results = buildResultsPayload(slide, responses);
      io.to(`presentation-${presentationId}`).emit('response-updated', {
        slideId: slide._id.toString(),
        slide: buildSlidePayload(slide),
        ...results
      });
    } catch (error) {
      Logger.error('Clear guess responses error', error);
      socket.emit('error', { message: 'Failed to clear responses' });
    }
  });
}

module.exports = { attachGuessNumberSocketHandlers };
