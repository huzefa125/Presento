const ChatMessage = require('../models/ChatMessage');
const Logger = require('../utils/logger');

// In-memory chat settings per live presentation session: Map<presentationId, { isChatEnabled: boolean }>
const chatSessions = new Map();

/**
 * Get or initialize live chat session state
 */
function getChatSessionState(presentationId) {
  const key = presentationId.toString();
  if (!chatSessions.has(key)) {
    chatSessions.set(key, { isChatEnabled: true });
  }
  return chatSessions.get(key);
}

/**
 * Setup live chat & reaction socket handlers
 */
function setupLiveChatHandlers(io, socket, activePresentations) {
  // Helper to verify presenter
  const isAuthorizedPresenter = (presentationId) => {
    const entry = activePresentations.get(presentationId?.toString());
    return Boolean(entry && entry.presenterSocket === socket.id);
  };

  // 1. Participant or Presenter sends a chat message
  socket.on('send-chat-message', async ({ presentationId, senderId, senderName, message, isPresenter }) => {
    try {
      if (!presentationId || !message || typeof message !== 'string') {
        return socket.emit('error', { message: 'Invalid chat payload' });
      }

      const cleanMessage = message.trim();
      if (!cleanMessage) return;

      const state = getChatSessionState(presentationId);
      
      // If chat disabled by presenter, reject non-presenter messages
      if (!state.isChatEnabled && !isPresenter && !isAuthorizedPresenter(presentationId)) {
        return socket.emit('error', { message: 'Chat is currently disabled by the presenter' });
      }

      // Save to database
      const chatDoc = await ChatMessage.create({
        presentationId,
        senderId: senderId || socket.id,
        senderName: senderName || (isPresenter ? 'Presenter' : 'Participant'),
        isPresenter: Boolean(isPresenter || isAuthorizedPresenter(presentationId)),
        message: cleanMessage
      });

      const messagePayload = {
        id: chatDoc._id.toString(),
        presentationId: chatDoc.presentationId.toString(),
        senderId: chatDoc.senderId,
        senderName: chatDoc.senderName,
        isPresenter: chatDoc.isPresenter,
        message: chatDoc.message,
        isPinned: chatDoc.isPinned,
        createdAt: chatDoc.createdAt
      };

      // Broadcast to all participants and presenter
      io.to(`presentation-${presentationId}`).emit('new-chat-message', messagePayload);
      io.to(`presenter-${presentationId}`).emit('new-chat-message', messagePayload);

    } catch (error) {
      Logger.error('Error sending chat message:', error);
      socket.emit('error', { message: 'Failed to send chat message' });
    }
  });

  // 2. Participant or Presenter sends floating emoji reaction
  socket.on('send-floating-reaction', ({ presentationId, emoji, senderName }) => {
    try {
      if (!presentationId || !emoji) return;

      const reactionPayload = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        emoji,
        senderName: senderName || 'Anonymous',
        timestamp: Date.now()
      };

      // Broadcast reaction to presenter & all live participants
      io.to(`presentation-${presentationId}`).emit('floating-reaction', reactionPayload);
      io.to(`presenter-${presentationId}`).emit('floating-reaction', reactionPayload);
    } catch (error) {
      Logger.error('Error sending floating reaction:', error);
    }
  });

  // 3. Presenter toggles chat status (Enable / Disable session chat)
  socket.on('toggle-chat-status', ({ presentationId, isChatEnabled }) => {
    try {
      if (!isAuthorizedPresenter(presentationId)) {
        return socket.emit('error', { message: 'Only the presenter can change chat settings' });
      }

      const state = getChatSessionState(presentationId);
      state.isChatEnabled = Boolean(isChatEnabled);

      const payload = { presentationId, isChatEnabled: state.isChatEnabled };
      io.to(`presentation-${presentationId}`).emit('chat-status-updated', payload);
      io.to(`presenter-${presentationId}`).emit('chat-status-updated', payload);

      Logger.debug(`Chat status updated for presentation ${presentationId}: ${state.isChatEnabled}`);
    } catch (error) {
      Logger.error('Error toggling chat status:', error);
    }
  });

  // 4. Presenter pins or unpins a chat message
  socket.on('pin-chat-message', async ({ presentationId, messageId, isPinned }) => {
    try {
      if (!isAuthorizedPresenter(presentationId)) {
        return socket.emit('error', { message: 'Only the presenter can pin messages' });
      }

      // If pinning, unpin previous pinned message for this presentation
      if (isPinned) {
        await ChatMessage.updateMany({ presentationId }, { isPinned: false });
      }

      const updatedDoc = await ChatMessage.findByIdAndUpdate(
        messageId,
        { isPinned: Boolean(isPinned) },
        { new: true }
      );

      const payload = {
        presentationId,
        messageId,
        isPinned: Boolean(isPinned),
        pinnedMessage: updatedDoc ? {
          id: updatedDoc._id.toString(),
          senderName: updatedDoc.senderName,
          message: updatedDoc.message,
          isPresenter: updatedDoc.isPresenter
        } : null
      };

      io.to(`presentation-${presentationId}`).emit('chat-message-pinned', payload);
      io.to(`presenter-${presentationId}`).emit('chat-message-pinned', payload);
    } catch (error) {
      Logger.error('Error pinning chat message:', error);
    }
  });

  // 5. Presenter deletes a chat message
  socket.on('delete-chat-message', async ({ presentationId, messageId }) => {
    try {
      if (!isAuthorizedPresenter(presentationId)) {
        return socket.emit('error', { message: 'Only the presenter can delete messages' });
      }

      await ChatMessage.findByIdAndDelete(messageId);

      const payload = { presentationId, messageId };
      io.to(`presentation-${presentationId}`).emit('chat-message-deleted', payload);
      io.to(`presenter-${presentationId}`).emit('chat-message-deleted', payload);
    } catch (error) {
      Logger.error('Error deleting chat message:', error);
    }
  });

  // 6. Fetch chat history for session
  socket.on('get-chat-history', async ({ presentationId }) => {
    try {
      if (!presentationId) return;

      const state = getChatSessionState(presentationId);
      const messages = await ChatMessage.find({ presentationId })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      const formattedMessages = messages.map(doc => ({
        id: doc._id.toString(),
        presentationId: doc.presentationId.toString(),
        senderId: doc.senderId,
        senderName: doc.senderName,
        isPresenter: doc.isPresenter,
        message: doc.message,
        isPinned: doc.isPinned,
        createdAt: doc.createdAt
      }));

      socket.emit('chat-history', {
        presentationId,
        isChatEnabled: state.isChatEnabled,
        messages: formattedMessages
      });
    } catch (error) {
      Logger.error('Error fetching chat history:', error);
    }
  });
}

module.exports = {
  setupLiveChatHandlers,
  getChatSessionState
};
