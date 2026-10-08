/**
 * Participant join-flow socket handlers: joining a presentation (direct or
 * via the waiting room), the presenter approving/denying a join request, and
 * joining a presentation room purely to view results. Split out of the
 * former socketHandlers.js monolith; see CODE_STANDARDS.md.
 */
const Presentation = require('../models/Presentation');
const Logger = require('../utils/logger');
const { activePresentations, admitParticipant } = require('./_sharedHelpers');

function attachParticipantJoinHandlers(io, socket) {
  // Participant joins presentation
  // Participant joins presentation
  socket.on('join-presentation', async ({ accessCode, participantId, participantName }) => {
    try {
      const presentation = await Presentation.findOne({ accessCode });

      if (!presentation) {
        socket.emit('error', { message: 'Presentation not found' });
        return;
      }

      // Always join the room so they can receive presentation-ended events
      socket.join(`presentation-${presentation._id}`);

      const presentationKey = presentation._id.toString();
      let activeEntry = activePresentations.get(presentationKey);
      if (!activeEntry) {
        activeEntry = {
          presenterSocket: null,
          participants: new Map(),
          hasEverBeenLive: false
        };
        activePresentations.set(presentationKey, activeEntry);
      }

      if (!activeEntry.participantSockets) {
        activeEntry.participantSockets = new Map();
      }

      const normalizedParticipantId = participantId || socket.id;
      const previousSocketId = activeEntry.participantSockets.get(normalizedParticipantId);
      if (previousSocketId && previousSocketId !== socket.id) {
        activeEntry.participants.delete(previousSocketId);
        const previousSocket = io.sockets.sockets.get(previousSocketId);
        previousSocket?.leave(`presentation-${presentation._id}`);
      }

      activeEntry.participantSockets.set(normalizedParticipantId, socket.id);

      if (!presentation.isLive) {
        // Distinguish "never started yet" from "was live and has since ended" using
        // whether a presenter has ever actually started this session, not merely
        // whether an in-memory entry exists (an entry now always exists by this point).
        const wasLive = Boolean(activeEntry.hasEverBeenLive);
        socket.emit('presentation-not-live', {
          message: wasLive
            ? 'The presentation has ended. Thank you for participating!'
            : 'Presentation is not live yet. Waiting for presenter...',
          ended: wasLive
        });
        return;
      }

      // Waiting room: if the presenter requires approval, park this
      // participant in a pending bucket instead of admitting them straight
      // away - they don't get a roster slot or see any slide content until
      // the presenter responds. Once approved for this live session, further
      // reconnects (e.g. a page refresh) skip the wait.
      if (presentation.requireApproval && !activeEntry.approvedParticipants?.has(normalizedParticipantId)) {
        if (!activeEntry.pendingParticipants) {
          activeEntry.pendingParticipants = new Map();
        }
        activeEntry.pendingParticipants.set(normalizedParticipantId, {
          socketId: socket.id,
          participantName: participantName || 'Anonymous'
        });

        socket.emit('join-request-pending', {
          message: 'Waiting for the presenter to let you in...'
        });

        if (activeEntry.presenterSocket) {
          io.to(`presenter-${presentationKey}`).emit('join-request-received', {
            participantId: normalizedParticipantId,
            participantName: participantName || 'Anonymous'
          });
        }
        return;
      }

      await admitParticipant({
        io,
        presentation,
        activeEntry,
        presentationKey,
        socket,
        participantId: normalizedParticipantId,
        participantName
      });

      Logger.debug(`Participant joined presentation ${presentation._id}`);
    } catch (error) {
      Logger.error('Join presentation error', error);
      socket.emit('error', { message: 'Failed to join presentation' });
    }
  });

  // Presenter accepts or denies a waiting-room join request
  // Presenter accepts or denies a waiting-room join request
  socket.on('respond-join-request', async ({ presentationId, participantId, approve }) => {
    try {
      const presentationKey = presentationId?.toString();
      const activeEntry = activePresentations.get(presentationKey);

      if (!activeEntry || activeEntry.presenterSocket !== socket.id) {
        socket.emit('error', { message: 'Only the presenter can respond to join requests' });
        return;
      }

      const pending = activeEntry.pendingParticipants?.get(participantId);
      if (!pending) {
        // Already handled, cancelled, or expired - nothing to do.
        return;
      }
      activeEntry.pendingParticipants.delete(participantId);

      const participantSocket = io.sockets.sockets.get(pending.socketId);
      if (!participantSocket) {
        // They disconnected while waiting for a decision.
        return;
      }

      if (!approve) {
        participantSocket.emit('join-denied', {
          message: 'The presenter did not let you into this presentation.'
        });
        participantSocket.leave(`presentation-${presentationId}`);
        return;
      }

      if (!activeEntry.approvedParticipants) {
        activeEntry.approvedParticipants = new Set();
      }
      activeEntry.approvedParticipants.add(participantId);

      const presentation = await Presentation.findById(presentationId);
      if (!presentation) {
        participantSocket.emit('error', { message: 'Presentation not found' });
        return;
      }

      await admitParticipant({
        io,
        presentation,
        activeEntry,
        presentationKey,
        socket: participantSocket,
        participantId,
        participantName: pending.participantName
      });
    } catch (error) {
      Logger.error('Respond to join request error', error);
      socket.emit('error', { message: 'Failed to respond to join request' });
    }
  });

  // Join presentation room for results viewing (no authentication required, just viewing results)
  // Join presentation room for results viewing (no authentication required, just viewing results)
  socket.on('join-presentation-results', ({ presentationId }) => {
    if (presentationId) {
      socket.join(`presentation-${presentationId}`);
      Logger.debug(`Socket joined presentation-${presentationId} for results viewing`);
    }
  });
}

module.exports = { attachParticipantJoinHandlers };
