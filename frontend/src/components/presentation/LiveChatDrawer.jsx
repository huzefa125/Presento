import { useState, useEffect, useRef } from 'react';
import { X, Send, Pin, Trash2, MessageSquare, Lock, Smile, Sparkles, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const EMOJI_REACTIONS = ['❤️', '👏', '🔥', '👍', '💡', '🎉'];

export default function LiveChatDrawer({
  isOpen,
  onClose,
  socket,
  presentationId,
  isPresenter = false,
  participantName = 'Participant',
  participantId = ''
}) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket event subscriptions
  useEffect(() => {
    if (!socket || !presentationId) return;

    // Fetch initial chat history
    socket.emit('get-chat-history', { presentationId });

    // History response
    const handleChatHistory = (data) => {
      if (data.presentationId?.toString() === presentationId?.toString()) {
        setIsChatEnabled(Boolean(data.isChatEnabled));
        setMessages(data.messages || []);
        
        // Check for pinned message
        const pinned = data.messages?.find((m) => m.isPinned);
        if (pinned) setPinnedMessage(pinned);
      }
    };

    // New incoming message
    const handleNewMessage = (msg) => {
      if (msg.presentationId?.toString() === presentationId?.toString()) {
        setMessages((prev) => [...prev, msg]);
        if (msg.isPinned) {
          setPinnedMessage(msg);
        }
      }
    };

    // Chat status updated (enabled/disabled)
    const handleStatusUpdated = (data) => {
      if (data.presentationId?.toString() === presentationId?.toString()) {
        setIsChatEnabled(Boolean(data.isChatEnabled));
        if (!data.isChatEnabled && !isPresenter) {
          toast(t('live_chat.disabled_by_presenter') || 'Live chat disabled by presenter', {
            icon: '🔒'
          });
        }
      }
    };

    // Message pinned
    const handleMessagePinned = (data) => {
      if (data.presentationId?.toString() === presentationId?.toString()) {
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            isPinned: m.id === data.messageId ? data.isPinned : false
          }))
        );
        setPinnedMessage(data.isPinned ? data.pinnedMessage : null);
      }
    };

    // Message deleted
    const handleMessageDeleted = (data) => {
      if (data.presentationId?.toString() === presentationId?.toString()) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        setPinnedMessage((prev) => (prev?.id === data.messageId ? null : prev));
      }
    };

    socket.on('chat-history', handleChatHistory);
    socket.on('new-chat-message', handleNewMessage);
    socket.on('chat-status-updated', handleStatusUpdated);
    socket.on('chat-message-pinned', handleMessagePinned);
    socket.on('chat-message-deleted', handleMessageDeleted);

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('new-chat-message', handleNewMessage);
      socket.off('chat-status-updated', handleStatusUpdated);
      socket.off('chat-message-pinned', handleMessagePinned);
      socket.off('chat-message-deleted', handleMessageDeleted);
    };
  }, [socket, presentationId, isPresenter, t]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handlers
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !socket) return;

    if (!isChatEnabled && !isPresenter) {
      toast.error('Chat is disabled by the presenter');
      return;
    }

    socket.emit('send-chat-message', {
      presentationId,
      senderId: participantId || socket.id,
      senderName: participantName || (isPresenter ? 'Presenter' : 'Participant'),
      message: newMessage.trim(),
      isPresenter
    });

    setNewMessage('');
  };

  const handleSendReaction = (emoji) => {
    if (!socket) return;
    socket.emit('send-floating-reaction', {
      presentationId,
      emoji,
      senderName: participantName || (isPresenter ? 'Presenter' : 'Participant')
    });
  };

  const handleToggleChat = () => {
    if (!isPresenter || !socket) return;
    const newStatus = !isChatEnabled;
    socket.emit('toggle-chat-status', { presentationId, isChatEnabled: newStatus });
    toast.success(newStatus ? 'Live chat enabled' : 'Live chat disabled');
  };

  const handlePinMessage = (messageId, currentPinned) => {
    if (!isPresenter || !socket) return;
    socket.emit('pin-chat-message', {
      presentationId,
      messageId,
      isPinned: !currentPinned
    });
  };

  const handleDeleteMessage = (messageId) => {
    if (!isPresenter || !socket) return;
    socket.emit('delete-chat-message', { presentationId, messageId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col font-sans animate-fadeIn">
      {/* Drawer Header */}
      <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              {t('live_chat.title') || 'Live Chat'}
              {!isChatEnabled && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Paused
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Presenter Moderation Toggle */}
          {isPresenter && (
            <button
              onClick={handleToggleChat}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isChatEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title={isChatEnabled ? 'Disable Live Chat' : 'Enable Live Chat'}
            >
              {isChatEnabled ? 'Chat ON' : 'Chat OFF'}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="px-4 py-2.5 bg-amber-50/90 border-b border-amber-200/80 flex items-start justify-between gap-2 shrink-0">
          <div className="flex items-start gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5 fill-amber-700" />
            <div className="text-xs">
              <span className="font-bold text-amber-900">{pinnedMessage.senderName}: </span>
              <span className="text-amber-800 break-words">{pinnedMessage.message}</span>
            </div>
          </div>
          {isPresenter && (
            <button
              onClick={() => handlePinMessage(pinnedMessage.id, true)}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline shrink-0 cursor-pointer"
            >
              Unpin
            </button>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-500">No messages yet</p>
            <p className="text-[11px] text-gray-400 mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === (participantId || socket?.id);
            const isMsgPresenter = msg.isPresenter;

            return (
              <div
                key={msg.id}
                className={`group relative flex flex-col max-w-[85%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Sender Name */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-gray-600 truncate">
                    {msg.senderName}
                  </span>
                  {isMsgPresenter && (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5 fill-current" /> Presenter
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-2xs relative ${
                    isMsgPresenter
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : isMe
                      ? 'bg-indigo-500 text-white rounded-tr-xs'
                      : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-xs'
                  } ${msg.isPinned ? 'ring-2 ring-amber-400' : ''}`}
                >
                  {msg.message}

                  {/* Presenter Actions on hover */}
                  {isPresenter && (
                    <div className="absolute top-1/2 -translate-y-1/2 -left-16 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-lg p-1 z-10">
                      <button
                        onClick={() => handlePinMessage(msg.id, msg.isPinned)}
                        className={`p-1 rounded hover:bg-gray-100 cursor-pointer ${
                          msg.isPinned ? 'text-amber-600 fill-amber-600' : 'text-gray-400'
                        }`}
                        title={msg.isPinned ? 'Unpin' : 'Pin message'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Reaction Bar */}
      <div className="px-3 py-2 border-t border-gray-100 bg-white flex items-center justify-center gap-2 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">React:</span>
        <div className="flex items-center gap-1.5">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="p-1.5 rounded-full hover:bg-indigo-50 text-base transition-transform active:scale-125 cursor-pointer"
              title={`Send ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Section */}
      <div className="p-3 border-t border-gray-200 bg-white shrink-0">
        {!isChatEnabled && !isPresenter ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-xs font-medium text-amber-800 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Live chat is currently paused by the presenter
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('live_chat.placeholder') || 'Type a message...'}
              maxLength={500}
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-100 border border-transparent focus:border-indigo-500 focus:bg-white text-xs sm:text-sm text-gray-900 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
