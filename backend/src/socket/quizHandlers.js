const Slide = require('../models/Slide');
const Response = require('../models/Response');
const quizSessionService = require('../services/quizSessionService');
const quizScoringService = require('../services/quizScoringService');
const Logger = require('../utils/logger');

/**
 * Attach quiz-related socket handlers
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 */
function attachQuizHandlers(io, socket) {
  // Start quiz countdown
  socket.on('start-quiz', async ({ presentationId, slideId }) => {
    try {
      const slide = await Slide.findById(slideId);

      if (!slide || slide.type !== 'quiz') {
        socket.emit('error', { message: 'Quiz slide not found' });
        return;
      }

      let session = quizSessionService.getSession(slideId);
      if (!session) {
        session = quizSessionService.initializeSession({
          slideId,
          timeLimit: slide.quizSettings.timeLimit,
          correctOptionId: slide.quizSettings.correctOptionId,
        });
      }

      // Start (or restart) the session
      session = quizSessionService.startSession(slideId);

      if (typeof slide.quizSettings.timeLimit === 'number' && slide.quizSettings.timeLimit > 0) {
        const delay = Math.max(0, slide.quizSettings.timeLimit * 1000);
        quizSessionService.scheduleAutoEnd(slideId, async () => {
          try {
            quizSessionService.endSession(slideId);
            const results = quizSessionService.getResults(slideId);
            const leaderboard = await quizScoringService.getLeaderboardWithDeltas(
              presentationId,
              slideId,
              10,
            );

            io.to(`presentation-${presentationId}`).emit('quiz-ended', {
              slideId,
              results,
              leaderboard,
            });

            io.to(`presenter-${presentationId}`).emit('quiz-ended', {
              slideId,
              results,
              leaderboard,
            });

          } catch (autoEndError) {
            Logger.error('Error auto-ending quiz', autoEndError);
            io.to(`presenter-${presentationId}`).emit('error', {
              message: 'Quiz ended but results could not be finalized automatically',
            });
          }
        }, delay);
      }

      // Broadcast to all participants that quiz has started
      io.to(`presentation-${presentationId}`).emit('quiz-started', {
        slideId,
        timeLimit: slide.quizSettings.timeLimit,
        startTime: session.startTime,
      });

      // Also notify presenter
      io.to(`presenter-${presentationId}`).emit('quiz-started', {
        slideId,
        timeLimit: slide.quizSettings.timeLimit,
        startTime: session.startTime,
      });

    } catch (error) {
      Logger.error('Error starting quiz', error);
      socket.emit('error', { message: 'Failed to start quiz' });
    }
  });

  // Submit quiz answer
  socket.on('submit-quiz-answer', async ({ 
    presentationId, 
    slideId, 
    participantId, 
    participantName,
    answer, 
    responseTime 
  }) => {
    try {
      const slide = await Slide.findById(slideId);

      if (!slide || slide.type !== 'quiz') {
        socket.emit('error', { message: 'Quiz slide not found' });
        return;
      }

      const session = quizSessionService.getSession(slideId);
      if (!session || !session.isActive) {
        socket.emit('error', { message: 'Quiz is not active' });
        return;
      }

      // Check if participant already answered
      if (quizSessionService.hasParticipantResponded(slideId, participantId)) {
        socket.emit('error', { message: 'You have already answered this quiz' });
        return;
      }

      // Record response in session
      const sessionResponse = quizSessionService.recordResponse({
        slideId,
        participantId,
        answer,
        responseTime
      });

      // Calculate score - incorrect answers get 0 points
      const score = quizScoringService.calculateQuestionScore({
        isCorrect: sessionResponse.isCorrect,
        responseTime,
        timeLimit: slide.quizSettings.timeLimit
      });
      
      // Log for debugging - ensure incorrect answers get 0
      if (!sessionResponse.isCorrect && score !== 0) {
        Logger.warn(`Incorrect answer but score is not 0: score=${score}, isCorrect=${sessionResponse.isCorrect}`);
      }
      
      // Force score to 0 if answer is incorrect (safety check)
      const finalScore = sessionResponse.isCorrect ? score : 0;

      // Save response to database - use finalScore (0 for incorrect)
      const response = new Response({
        presentationId,
        slideId,
        participantId,
        participantName,
        answer,
        responseTime,
        isCorrect: sessionResponse.isCorrect,
        score: finalScore
      });

      await response.save();

      // Update participant's cumulative score - use finalScore (0 for incorrect)
      await quizScoringService.updateParticipantScore({
        presentationId,
        participantId,
        participantName,
        slideId,
        score: finalScore,
        responseTime,
        isCorrect: sessionResponse.isCorrect
      });

      // Notify participant of successful submission - use finalScore
      socket.emit('quiz-answer-submitted', {
        slideId,
        isCorrect: sessionResponse.isCorrect,
        score: finalScore,
        responseTime
      });

      // Get updated results and broadcast to presenter
      const results = quizSessionService.getResults(slideId);
      io.to(`presenter-${presentationId}`).emit('quiz-results-updated', {
        slideId,
        results
      });

      // Update and broadcast leaderboard in real-time
      try {
        const leaderboard = await quizScoringService.getLeaderboard(presentationId, 10);
        
        // Broadcast updated leaderboard to all connected clients (including results page)
        // Results page joins presentation-${presentationId} room
        io.to(`presentation-${presentationId}`).emit('leaderboard-updated', {
          presentationId,
          leaderboard
        });
        
        // Also send to presenter room
        io.to(`presenter-${presentationId}`).emit('leaderboard-data', {
          presentationId,
          leaderboard
        });
      } catch (leaderboardError) {
        Logger.error('Error updating leaderboard after quiz answer', leaderboardError);
        // Don't fail the quiz submission if leaderboard update fails
      }

    } catch (error) {
      Logger.error('Error submitting quiz answer', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // End quiz (manual or automatic)
  socket.on('end-quiz', async ({ presentationId, slideId }) => {
    try {
      const slide = await Slide.findById(slideId);

      if (!slide || slide.type !== 'quiz') {
        socket.emit('error', { message: 'Quiz slide not found' });
        return;
      }

      const session = quizSessionService.getSession(slideId);
      if (!session) {
        socket.emit('error', { message: 'Quiz session not found' });
        return;
      }

      // End the session
      quizSessionService.endSession(slideId);
      quizSessionService.clearAutoEndTimer(slideId);

      // Get final results
      const results = quizSessionService.getResults(slideId);

      // Get leaderboard with deltas
      const leaderboard = await quizScoringService.getLeaderboardWithDeltas(
        presentationId,
        slideId,
        10
      );

      // Broadcast quiz ended to all
      io.to(`presentation-${presentationId}`).emit('quiz-ended', {
        slideId,
        results,
        leaderboard
      });

      io.to(`presenter-${presentationId}`).emit('quiz-ended', {
        slideId,
        results,
        leaderboard
      });

    } catch (error) {
      Logger.error('Error ending quiz', error);
      socket.emit('error', { message: 'Failed to end quiz' });
    }
  });

  // Get current quiz state
  socket.on('request-quiz-state', async ({ presentationId, slideId }) => {
    try {
      const session = quizSessionService.getSession(slideId);

      if (!session) {
        socket.emit('quiz-state', {
          slideId,
          isActive: false,
          startTime: null,
          results: null
        });
        return;
      }

      const results = quizSessionService.getResults(slideId);

      socket.emit('quiz-state', {
        slideId,
        isActive: session.isActive,
        startTime: session.startTime,
        timeLimit: session.timeLimit,
        results
      });
    } catch (error) {
      Logger.error('Error fetching quiz state', error);
      socket.emit('error', { message: 'Failed to fetch quiz state' });
    }
  });

  // Get leaderboard
  socket.on('request-leaderboard', async ({ presentationId, limit = 10 }) => {
    try {
      const leaderboard = await quizScoringService.getLeaderboard(presentationId, limit);

      // Send to requester
      socket.emit('leaderboard-data', {
        presentationId,
        leaderboard
      });

      // Also broadcast to presenter room
      io.to(`presenter-${presentationId}`).emit('leaderboard-data', {
        presentationId,
        leaderboard
      });

    } catch (error) {
      Logger.error('Error fetching leaderboard', error);
      socket.emit('error', { message: 'Failed to fetch leaderboard' });
    }
  });
}

module.exports = {
  attachQuizHandlers,
};
