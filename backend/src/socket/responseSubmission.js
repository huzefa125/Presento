/**
 * Slide-response submission socket handler, plus wiring up the open-ended
 * voting sub-handlers. Split out of the former socketHandlers.js monolith;
 * see CODE_STANDARDS.md.
 */
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const Logger = require('../utils/logger');
const { getHandler } = require('../interactions');
const { handleOpenEndedSubmission, attachOpenEndedVotingHandlers } = require('./openEnded');
const { isAuthorizedPresenter, buildResultsPayload } = require('./_sharedHelpers');

function attachResponseSubmissionHandlers(io, socket) {
  // Participant submits response
  // Participant submits response
  socket.on('submit-response', async ({ presentationId, slideId, participantId, participantName, answer }) => {
    try {
      const slide = await Slide.findById(slideId);
      if (!slide) {
        Logger.error(`Slide not found: ${slideId}`);
        socket.emit('error', { message: 'Slide not found' });
        return;
      }

      let normalizedAnswer = answer;
      const handler = getHandler(slide.type);
      if (handler && typeof handler.normalizeAnswer === 'function') {
        try {
          normalizedAnswer = handler.normalizeAnswer(answer, slide);
        } catch (err) {
          Logger.error('Normalization error', err);
          socket.emit('error', { message: err.message || 'Invalid answer' });
          return;
        }
      }

      // Check if response already exists
      const existingResponse = await Response.findOne({ participantId, slideId });

      let submissionCount = 1;
      let maxSubmissions = null;

      if (slide.type === 'word_cloud') {
        // For word cloud, allow multiple submissions up to maxWordsPerParticipant
        maxSubmissions = Math.max(1, Number(slide.maxWordsPerParticipant) || 1);

        if (existingResponse) {
          const currentSubmissions = existingResponse.submissionCount || 1;

          if (currentSubmissions >= maxSubmissions) {
            socket.emit('error', { message: `You can only submit ${maxSubmissions} time(s) for this slide` });
            return;
          }

          // Append new words to existing answer
          const existingWords = Array.isArray(existingResponse.answer) ? existingResponse.answer : [existingResponse.answer];
          existingResponse.answer = [...existingWords, ...normalizedAnswer];
          existingResponse.submissionCount = currentSubmissions + 1;
          existingResponse.submittedAt = new Date();
          await existingResponse.save();
          submissionCount = existingResponse.submissionCount;
        } else {
          // Create new response
          const response = new Response({
            presentationId,
            slideId,
            participantId,
            participantName,
            answer: normalizedAnswer,
            submissionCount: 1
          });
          await response.save();
          submissionCount = 1;
        }
      } else if (slide.type === 'open_ended' || slide.type === 'type_answer') {
        const submissionResult = await handleOpenEndedSubmission({
          existingResponse,
          presentationId,
          slideId,
          participantId,
          participantName,
          answer: normalizedAnswer
        });

        if (!submissionResult.success) {
          socket.emit('error', { message: submissionResult.error || 'Failed to submit response' });
          return;
        }
      } else {
        // For other types (MCQ, scales), prevent duplicate submissions
        if (existingResponse) {
          socket.emit('error', { message: 'You have already submitted a response for this slide.' });
          return;
        }

        const response = new Response({
          presentationId,
          slideId,
          participantId,
          participantName,
          answer: normalizedAnswer
        });
        await response.save();
      }

      // Get updated responses for this slide
      const responses = await Response.find({ slideId });

      const results = buildResultsPayload(slide, responses);
      
      io.to(`presentation-${presentationId}`).emit('response-updated', {
        slideId: slide._id.toString(),
        ...results
      });

      const responsePayload = {
        success: true,
        slideId,
        slideType: slide.type,
      };

      if (slide.type === 'word_cloud') {
        responsePayload.submissionCount = submissionCount;
        responsePayload.maxSubmissions = maxSubmissions;
      }

      socket.emit('response-submitted', responsePayload);

      Logger.debug(`Response submitted for slide ${slideId}`);
    } catch (error) {
      Logger.error('Submit response error', error);
      socket.emit('error', { message: 'Failed to submit response' });
    }
  });
    attachOpenEndedVotingHandlers({ io, socket, buildResultsPayload, isAuthorizedPresenter });
}

module.exports = { attachResponseSubmissionHandlers };
