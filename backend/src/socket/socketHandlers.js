const Logger = require('../utils/logger');
const { attachQuizHandlers } = require('./quizHandlers');
const { setupLiveChatHandlers } = require('./liveChatHandlers');
const { activePresentations, platformStats, isAuthorizedPresenter } = require('./_sharedHelpers');
const { attachPresenterLifecycleHandlers } = require('./presenterLifecycle');
const { attachParticipantJoinHandlers } = require('./participantJoin');
const { attachResponseSubmissionHandlers } = require('./responseSubmission');
const { attachQnaSocketHandlers } = require('./qnaSocket');
const { attachGuessNumberSocketHandlers } = require('./guessNumberSocket');

/**
 * Socket.IO connection entry point.
 *
 * This used to be one 1,421-line file with every event handler inline; it is
 * now an orchestrator that wires up one module per concern (presenter
 * lifecycle, participant join flow, response submission, QnA, guess-number),
 * all sharing activePresentations/platformStats/the builder helpers via
 * _sharedHelpers.js rather than each other's closures. See CODE_STANDARDS.md.
 */
const setupSocketHandlers = (io, socket) => {
  // Setup live chat & reaction event handlers
  setupLiveChatHandlers(io, socket, activePresentations);

  // Increment count when any user connects to the platform
  platformStats.total++;
  // Emit updated total to all clients in the landing page room
  io.to('landing-page').emit('platform-users-updated', { count: platformStats.total });

  attachPresenterLifecycleHandlers(io, socket);
  attachParticipantJoinHandlers(io, socket);
  attachResponseSubmissionHandlers(io, socket);
  attachQnaSocketHandlers(io, socket);
  attachGuessNumberSocketHandlers(io, socket);

  // Handle disconnect
  socket.on('disconnect', () => {
    Logger.debug(`Client disconnected: ${socket.id}`);

    // Decrement platform user count when any user disconnects
    platformStats.total = Math.max(0, platformStats.total - 1);
    // Emit updated total to all clients in the landing page room
    io.to('landing-page').emit('platform-users-updated', { count: platformStats.total });

    let participantRemoved = false;

    // Check if disconnected socket was a presenter
    let presenterPresentationId = null;
      activePresentations.forEach((data, presentationId) => {
      if (data.presenterSocket === socket.id) {
        presenterPresentationId = presentationId;
      }

      // Drop a waiting-room request if the participant left before the
      // presenter responded, and let the presenter's pending list know.
      if (data.pendingParticipants) {
        for (const [pendingId, info] of data.pendingParticipants.entries()) {
          if (info.socketId === socket.id) {
            data.pendingParticipants.delete(pendingId);
            if (data.presenterSocket) {
              io.to(`presenter-${presentationId}`).emit('join-request-cancelled', { participantId: pendingId });
            }
            break;
          }
        }
      }

      // Check if disconnected socket was a participant
      if (data.participants.has(socket.id)) {
        data.participants.delete(socket.id);
        participantRemoved = true;
        if (data.participantSockets) {
          for (const [participantId, participantSocketId] of data.participantSockets.entries()) {
            if (participantSocketId === socket.id) {
              data.participantSockets.delete(participantId);
              break;
            }
          }
        }

        // Notify presenter
        if (data.presenterSocket) {
          // Send updated participant list to presenter
          const participantList = Array.from(data.participants.values());
          io.to(`presenter-${presentationId}`).emit('participant-list-updated', { 
            participantCount: data.participants.size,
            participants: participantList
          });
          
          // Also send the original event for backward compatibility
          io.to(`presenter-${presentationId}`).emit('participant-left', {
            participantCount: data.participants.size
          });
        }
      }
    });

    // If presenter disconnected, do NOT end the presentation automatically.
    // The user wants it to end ONLY when "End Presentation" is clicked.
    if (presenterPresentationId) {
      const presentationData = activePresentations.get(presenterPresentationId);

      if (presentationData) {
        // Just mark presenter as disconnected in memory, but keep session alive
        presentationData.presenterSocket = null;
        activePresentations.set(presenterPresentationId, presentationData);
        Logger.debug(`Presenter disconnected from ${presenterPresentationId}, keeping session alive.`);
      }
    }
  });

  // Add socket to landing page room when they connect
  // Add socket to landing page room when they connect
  socket.join('landing-page');

  // Add a new event to get current platform user count
  // Add a new event to get current platform user count
  socket.on('get-platform-users', () => {
    socket.emit('platform-users-updated', { count: platformStats.total });
  });

  // Attach quiz handlers
  // Attach quiz handlers
  attachQuizHandlers(io, socket, isAuthorizedPresenter);
};

module.exports = setupSocketHandlers;
