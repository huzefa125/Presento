import { useState, useRef, useEffect, Fragment } from 'react';
import { MessageCircle, X, Send, RotateCcw, Copy, Check, Clock, Wifi, WifiOff, Bot, Search, Download, FileText, FileJson, Trash2, ThumbsUp, ThumbsDown, Lightbulb, FileQuestion, HelpCircle, Edit2, Save } from 'lucide-react';
import { sendChatMessage } from '../../services/chatbotService';
import { getChatbotUrl } from '../../utils/config';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/timeUtils';
import MarkdownRenderer from './MarkdownRenderer';
import ConfirmDialog from './ConfirmDialog';
import { 
  saveConversationHistory, 
  loadConversationHistory, 
  clearConversationHistory,
  exportConversationAsText,
  exportConversationAsJSON,
  downloadFile
} from '../../services/chatbotHistoryService';

export default function Chatbot({ isOpen, onClose }) {
  const { t } = useTranslation();
  
  // Language mapping for prompt enhancement
  const languageMap = {
    'hi': 'Hindi',
    'ar': 'Arabic',
    'es': 'Spanish',
    'fr': 'French',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'te': 'Telugu',
    'mr': 'Marathi',
  };

  // Get current language and enhance prompt if not English
  const enhancePromptWithLanguage = (prompt) => {
    const currentLanguage = i18n.language || 'en';
    const languageCode = currentLanguage.split('-')[0]; // Handle 'en-US' -> 'en'
    
    // If language is not English, add language instruction
    if (languageCode !== 'en' && languageMap[languageCode]) {
      const languageName = languageMap[languageCode];
      return `${prompt}\n\n[IMPORTANT: Please respond entirely in ${languageName} language. All your output, including slide content, titles, and explanations, must be in ${languageName}.]`;
    }
    
    return prompt;
  };

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('online'); // online, offline, connecting
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [messageReactions, setMessageReactions] = useState({}); // { messageIndex: 'up' | 'down' | null }
  const [editingMessageId, setEditingMessageId] = useState(null); // Index of message being edited
  const [editText, setEditText] = useState(''); // Text being edited
  const [isSavingEdit, setIsSavingEdit] = useState(false); // Loading state for saving edit
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const editInputRef = useRef(null);

  // Load conversation history when chatbot opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const savedMessages = loadConversationHistory();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Initialize welcome message if no history
        setMessages([{
          role: 'bot',
          text: t('chatbot.welcome_message'),
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, t]);

  // Save conversation history whenever messages change (except welcome message)
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      // Don't save if only welcome message exists
      const hasUserMessages = messages.some(msg => msg.role === 'user');
      if (hasUserMessages) {
        saveConversationHistory(messages);
      }
    }
  }, [messages, isOpen]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current && !showSearch) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showSearch]);

  // Focus search input when search is opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearch]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('[data-export-menu]')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('connecting');
        const response = await fetch(`${getChatbotUrl()}/health`, {
          method: 'GET',
          mode: 'cors',
        });
        if (response.ok) {
          setConnectionStatus('online');
        } else {
          setConnectionStatus('offline');
        }
      } catch (error) {
        setConnectionStatus('offline');
      }
    };

    if (isOpen) {
      checkConnection();
      const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Copy message to clipboard
  const handleCopyMessage = async (text, messageIndex) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageIndex);
      toast.success(t('chatbot.message_copied') || 'Message copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error(t('chatbot.copy_failed') || 'Failed to copy message');
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Enhance prompt with language instruction if needed
    const enhancedPrompt = enhancePromptWithLanguage(text);

    // Save original prompt for potential retry (without language enhancement)
    setLastUserPrompt(text);
    setInputValue('');
    setRetryCount(0);
    setShowRetry(false);

    // Add user message with status (show original text to user)
    const userMessage = {
      role: 'user',
      text,
      timestamp: new Date(),
      status: 'sending'
    };
    setMessages(prev => [...prev, userMessage]);

    // Send enhanced prompt to chatbot
    setIsLoading(true);
    const result = await sendChatMessage(enhancedPrompt, 0);

    setIsLoading(false);

    // Update user message status
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 && msg.role === 'user' 
        ? { ...msg, status: result.success ? 'sent' : 'failed' }
        : msg
    ));

    if (result.success) {
      // Add bot response
      setMessages(prev => [...prev, {
        role: 'bot',
        text: result.response,
        timestamp: new Date(),
        status: 'delivered'
      }]);
      setShowRetry(true);
    } else {
      // Add error message
      const errorPrefix = t('chatbot.error_prefix');
      const errorMessage = result.isNetworkError 
        ? t('chatbot.error_network')
        : (result.error || t('chatbot.error_failed'));
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `${errorPrefix} ${errorMessage}`,
        isError: true,
        timestamp: new Date()
      }]);
      if (result.canRetry) {
        setShowRetry(true);
      }
    }
  };

  const handleRetry = async () => {
    if (!lastUserPrompt || isLoading) return;

    setRetryCount(prev => prev + 1);
    setShowRetry(false);

    // Enhance prompt with language instruction if needed
    const enhancedPrompt = enhancePromptWithLanguage(lastUserPrompt);

    // Add retry message
    setMessages(prev => [...prev, {
      role: 'bot',
      text: t('chatbot.retry_attempt', { count: retryCount + 1, prompt: lastUserPrompt }),
      timestamp: new Date()
    }]);

    setIsLoading(true);
    const result = await sendChatMessage(enhancedPrompt, retryCount + 1);

    setIsLoading(false);

    if (result.success) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: result.response,
        timestamp: new Date()
      }]);
      setShowRetry(true);
    } else {
      const errorPrefix = t('chatbot.error_prefix');
      const errorMessage = result.isNetworkError 
        ? t('chatbot.error_network')
        : (result.error || t('chatbot.error_failed'));
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `${errorPrefix} ${errorMessage}`,
        isError: true,
        timestamp: new Date()
      }]);
      if (result.canRetry) {
        setShowRetry(true);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Search functionality
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.text && typeof msg.text === 'string' && msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const handleExportTXT = () => {
    try {
      const textContent = exportConversationAsText(messages);
      const filename = `chatbot-conversation-${new Date().toISOString().split('T')[0]}.txt`;
      downloadFile(textContent, filename, 'text/plain');
      toast.success(t('chatbot.exported_txt') || 'Conversation exported as TXT');
      setShowExportMenu(false);
    } catch (error) {
      toast.error(t('chatbot.export_failed') || 'Failed to export conversation');
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonContent = exportConversationAsJSON(messages);
      const filename = `chatbot-conversation-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(jsonContent, filename, 'application/json');
      toast.success(t('chatbot.exported_json') || 'Conversation exported as JSON');
      setShowExportMenu(false);
    } catch (error) {
      toast.error(t('chatbot.export_failed') || 'Failed to export conversation');
    }
  };

  const handleClearHistory = () => {
    setShowClearHistoryDialog(true);
  };

  const handleConfirmClearHistory = () => {
    clearConversationHistory();
    setMessages([{
      role: 'bot',
      text: t('chatbot.welcome_message'),
      timestamp: new Date()
    }]);
    setShowClearHistoryDialog(false);
    toast.success(t('chatbot.history_cleared') || 'Conversation history cleared');
  };

  const handleCancelClearHistory = () => {
    setShowClearHistoryDialog(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  // Quick action suggestions
  const getQuickActions = () => {
    const hasUserMessages = messages.some(msg => msg.role === 'user');
    if (!hasUserMessages) {
      // Show initial quick actions
      return [
        { text: t('chatbot.quick_action_create_presentation') || 'Create a presentation', icon: FileQuestion },
        { text: t('chatbot.quick_action_create_quiz') || 'Create a quiz', icon: Lightbulb },
        { text: t('chatbot.quick_action_help') || 'How to use Inavora?', icon: HelpCircle },
      ];
    }
    return null; // Hide quick actions after user starts conversation
  };

  const handleQuickAction = async (actionText) => {
    const text = actionText.trim();
    if (!text || isLoading) return;

    // Enhance prompt with language instruction if needed
    const enhancedPrompt = enhancePromptWithLanguage(text);

    // Save original prompt for potential retry
    setLastUserPrompt(text);
    setInputValue('');
    setRetryCount(0);
    setShowRetry(false);

    // Add user message with status (show original text to user)
    const userMessage = {
      role: 'user',
      text,
      timestamp: new Date(),
      status: 'sending'
    };
    setMessages(prev => [...prev, userMessage]);

    // Send enhanced prompt to chatbot
    setIsLoading(true);
    const result = await sendChatMessage(enhancedPrompt, 0);

    setIsLoading(false);

    // Update user message status
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 && msg.role === 'user' 
        ? { ...msg, status: result.success ? 'sent' : 'failed' }
        : msg
    ));

    if (result.success) {
      // Add bot response
      setMessages(prev => [...prev, {
        role: 'bot',
        text: result.response,
        timestamp: new Date(),
        status: 'delivered'
      }]);
      setShowRetry(true);
    } else {
      // Add error message
      const errorPrefix = t('chatbot.error_prefix');
      const errorMessage = result.isNetworkError 
        ? t('chatbot.error_network')
        : (result.error || t('chatbot.error_failed'));
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `${errorPrefix} ${errorMessage}`,
        isError: true,
        timestamp: new Date()
      }]);
      if (result.canRetry) {
        setShowRetry(true);
      }
    }
  };

  // Message reactions
  const handleReaction = (messageIndex, reaction) => {
    setMessageReactions(prev => {
      const newReactions = {
        ...prev,
        [messageIndex]: prev[messageIndex] === reaction ? null : reaction
      };
      // Save reactions to localStorage
      try {
        const reactionsKey = 'inavora_chatbot_reactions';
        localStorage.setItem(reactionsKey, JSON.stringify(newReactions));
      } catch (error) {
        console.error('Failed to save reaction:', error);
      }
      return newReactions;
    });
  };

  // Start editing a message
  const handleStartEdit = (messageIndex) => {
    const message = messages[messageIndex];
    if (message && message.role === 'user') {
      setEditingMessageId(messageIndex);
      setEditText(message.text);
      // Focus the edit input after a short delay to ensure it's rendered
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 0);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  // Save edited message
  const handleSaveEdit = async (messageIndex) => {
    const newText = editText.trim();
    if (!newText) {
      toast.error(t('chatbot.edit_empty_error') || 'Message cannot be empty');
      return;
    }

    const message = messages[messageIndex];
    if (!message || message.role !== 'user') {
      handleCancelEdit();
      return;
    }

    // Check if text actually changed
    if (newText === message.text) {
      handleCancelEdit();
      toast.info(t('chatbot.no_changes') || 'No changes made');
      return;
    }

    setIsSavingEdit(true);

    // Update the message text and remove the bot response that came after it
    setMessages(prev => {
      const updatedMessages = prev.map((msg, idx) => 
        idx === messageIndex 
          ? { ...msg, text: newText, edited: true, editTimestamp: new Date() }
          : msg
      );
      
      // Remove bot response immediately after this user message (if any)
      const botResponseIndex = messageIndex + 1;
      if (botResponseIndex < updatedMessages.length && updatedMessages[botResponseIndex].role === 'bot') {
        return updatedMessages.filter((_, idx) => idx !== botResponseIndex);
      }
      
      return updatedMessages;
    });

    handleCancelEdit();
    toast.success(t('chatbot.message_edited') || 'Message updated successfully');

    // Resend the edited message to get a new bot response
    const enhancedPrompt = enhancePromptWithLanguage(newText);
    setIsLoading(true);
    const result = await sendChatMessage(enhancedPrompt, 0);
    setIsLoading(false);
    setIsSavingEdit(false);

    if (result.success) {
      // Add new bot response after the edited message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.splice(messageIndex + 1, 0, {
          role: 'bot',
          text: result.response,
          timestamp: new Date(),
          status: 'delivered'
        });
        // Save conversation history after bot response
        saveConversationHistory(newMessages);
        return newMessages;
      });
    } else {
      // Add error message
      const errorPrefix = t('chatbot.error_prefix');
      const errorMessage = result.isNetworkError 
        ? t('chatbot.error_network')
        : (result.error || t('chatbot.error_failed'));
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.splice(messageIndex + 1, 0, {
          role: 'bot',
          text: `${errorPrefix} ${errorMessage}`,
          isError: true,
          timestamp: new Date()
        });
        // Save conversation history after error message
        saveConversationHistory(newMessages);
        return newMessages;
      });
    }
  };

  // Handle Enter key in edit input
  const handleEditKeyPress = (e, messageIndex) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageIndex);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Load reactions from localStorage
  useEffect(() => {
    try {
      const reactionsKey = 'inavora_chatbot_reactions';
      const savedReactions = JSON.parse(localStorage.getItem(reactionsKey) || '{}');
      setMessageReactions(savedReactions);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when chatbot is open and input is not focused (or when appropriate)
      if (!isOpen) return;

      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // Ctrl/Cmd + E: Open export menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowExportMenu(!showExportMenu);
      }

      // Escape: Close search or export menu
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        }
        if (showExportMenu) {
          setShowExportMenu(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showSearch, showExportMenu]);

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Custom Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .message-fade-in {
          animation: fadeInUp 0.3s ease-out;
          animation-fill-mode: both;
        }
        
        .chatbot-messages::-webkit-scrollbar {
          width: 10px;
        }
        .chatbot-messages::-webkit-scrollbar-track {
          background: #1A1A1A;
          border-radius: 10px;
          margin: 4px 0;
        }
        .chatbot-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #2A2A2A 0%, #333333 100%);
          border-radius: 10px;
          border: 2px solid #1A1A1A;
          transition: all 0.3s ease;
        }
        .chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #4CAF50 0%, #388E3C 100%);
          border-color: #1A1A1A;
        }
        .chatbot-messages::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, #388E3C 0%, #2E7D32 100%);
        }
        /* Firefox */
        .chatbot-messages {
          scrollbar-width: thin;
          scrollbar-color: #2A2A2A #1A1A1A;
        }
        .chatbot-messages:hover {
          scrollbar-color: #4CAF50 #1A1A1A;
        }
        
        /* Markdown styles */
        .markdown-content p {
          margin: 0.5rem 0;
        }
        .markdown-content p:first-child {
          margin-top: 0;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .markdown-content code {
          font-family: 'Courier New', monospace;
        }
        .markdown-content pre {
          margin: 0.75rem 0;
        }
        .markdown-content ul, .markdown-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .markdown-content li {
          margin: 0.25rem 0;
        }
        .markdown-content a {
          word-break: break-all;
        }
        
        /* Prevent word breaking in user messages */
        .user-message-text {
          word-break: normal !important;
          overflow-wrap: normal !important;
          white-space: normal !important;
          word-spacing: normal !important;
          hyphens: none !important;
        }
        
        /* Ensure user message container doesn't break words */
        .group.max-w-\\[80\\%\\] {
          word-break: normal !important;
        }
        
        /* Edit mode animations */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-[calc(100vw-2rem)] lg:w-96 max-w-[calc(100vw-2rem)] lg:max-w-96 h-[calc(100vh-8rem)] lg:h-[600px] max-h-[600px] bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg shadow-2xl flex flex-col" role="dialog" aria-label={t('chatbot.title')} aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#252525] rounded-t-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <MessageCircle className="h-5 w-5 text-[#4CAF50]" />
              {connectionStatus === 'online' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#4CAF50] rounded-full border border-[#252525]"></div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-[#E0E0E0]">{t('chatbot.title')}</h3>
              <div className="flex items-center gap-1.5">
                {connectionStatus === 'online' && (
                  <>
                    <Wifi className="h-3 w-3 text-[#4CAF50]" />
                    <span className="text-xs text-[#9ACFA7]">{t('chatbot.online') || 'Online'}</span>
                  </>
                )}
                {connectionStatus === 'offline' && (
                  <>
                    <WifiOff className="h-3 w-3 text-[#D32F2F]" />
                    <span className="text-xs text-[#F48FB1]">{t('chatbot.offline') || 'Offline'}</span>
                  </>
                )}
                {connectionStatus === 'connecting' && (
                  <>
                    <Clock className="h-3 w-3 text-[#FFA726]" />
                    <span className="text-xs text-[#FFB74D]">{t('chatbot.connecting') || 'Connecting...'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Search Button */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setSearchQuery('');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                showSearch 
                  ? 'bg-[#4CAF50] text-white' 
                  : 'hover:bg-[#333333] text-[#B0B0B0]'
              }`}
              title={t('chatbot.search') || 'Search'}
              aria-label={t('chatbot.search') || 'Search'}
            >
              <Search className="h-4 w-4" />
            </button>
            
            {/* Export Menu */}
            <div className="relative" data-export-menu>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 rounded-lg hover:bg-[#333333] transition-colors text-[#B0B0B0]"
                title={t('chatbot.export') || 'Export'}
                aria-label={t('chatbot.export') || 'Export'}
              >
                <Download className="h-4 w-4" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#2A2A2A] border border-[#333333] rounded-lg shadow-xl z-50 min-w-[160px]" data-export-menu>
                  <button
                    onClick={handleExportTXT}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#E0E0E0] hover:bg-[#333333] transition-colors rounded-t-lg"
                  >
                    <FileText className="h-4 w-4" />
                    {t('chatbot.export_txt') || 'Export as TXT'}
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#E0E0E0] hover:bg-[#333333] transition-colors"
                  >
                    <FileJson className="h-4 w-4" />
                    {t('chatbot.export_json') || 'Export as JSON'}
                  </button>
                  <div className="border-t border-[#333333] my-1"></div>
                  <button
                    onClick={handleClearHistory}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#D32F2F] hover:bg-[#333333] transition-colors rounded-b-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('chatbot.clear_history') || 'Clear History'}
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#333333] transition-colors"
              aria-label={t('chatbot.close_chatbot')}
            >
              <X className="h-5 w-5 text-[#B0B0B0]" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 py-2 border-b border-[#2A2A2A] bg-[#252525]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8A8A]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder={t('chatbot.search_placeholder') || 'Search messages...'}
                className="w-full pl-9 pr-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-lg text-[#E0E0E0] placeholder-[#8A8A8A] focus:outline-none focus:border-[#4CAF50] text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#333333] text-[#8A8A8A]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-[#8A8A8A]">
                {filteredMessages.length} {t('chatbot.search_results') || 'results found'}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="chatbot-messages flex-1 overflow-y-auto p-4 space-y-4 bg-[#1A1A1A]" role="log" aria-live="polite" aria-label={t('chatbot.messages_area') || 'Chat messages'}>
        {filteredMessages.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Search className="h-12 w-12 text-[#8A8A8A] mb-4" />
            <p className="text-[#8A8A8A]">{t('chatbot.no_search_results') || 'No messages found'}</p>
          </div>
        ) : (
          filteredMessages.map((message, index) => {
            // Highlight search matches in message text
            const highlightText = (text, query) => {
              if (!query.trim() || !text || typeof text !== 'string') return text;
              
              const parts = [];
              const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
              let lastIndex = 0;
              let match;

              while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                  parts.push(text.substring(lastIndex, match.index));
                }
                parts.push(
                  <mark key={`highlight-${match.index}-${index}`} className="bg-[#4CAF50]/30 text-[#E0E0E0] px-0.5 rounded">
                    {match[0]}
                  </mark>
                );
                lastIndex = match.index + match[0].length;
              }
              if (lastIndex < text.length) {
                parts.push(text.substring(lastIndex));
              }

              return parts.length > 0 ? parts : [text];
            };

            return (
          <div
            key={index}
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} gap-1 message-fade-in`}
            style={{
              animationDelay: `${Math.min(index * 0.05, 0.5)}s`
            }}
          >
            <div className={`flex items-end gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Bot Avatar - only show for bot messages */}
              {message.role === 'bot' && !message.isError && (
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#388E3C] flex items-center justify-center shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  {connectionStatus === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4CAF50] rounded-full border-2 border-[#1A1A1A] animate-pulse"></div>
                  )}
                </div>
              )}
              
              <div
                className={`group relative max-w-[80%] transition-all duration-200 ${
                  editingMessageId === index
                    ? 'rounded-lg px-4 py-3 bg-[#252525] border border-[#4CAF50]/30'
                    : message.role === 'user'
                    ? 'rounded-lg px-4 py-2 bg-[#4CAF50] text-white'
                    : message.isError
                    ? 'rounded-lg px-4 py-2 bg-[#D32F2F] text-white'
                    : 'rounded-lg px-4 py-2 bg-[#2A2A2A] text-[#E0E0E0]'
                }`}
                style={message.role === 'user' && editingMessageId !== index ? { wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal', hyphens: 'none' } : {}}
              >
                {message.role === 'bot' && !message.isError ? (
                  <div className="text-sm break-words">
                    {searchQuery ? (
                      <div>{highlightText(message.text, searchQuery)}</div>
                    ) : (
                      <MarkdownRenderer content={message.text} />
                    )}
                  </div>
                ) : editingMessageId === index ? (
                  // Edit mode - clean and professional
                  <div className="w-full">
                    <textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleEditKeyPress(e, index)}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#4CAF50]/40 rounded-lg text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#4CAF50] text-sm resize-none transition-colors disabled:opacity-60"
                      rows={Math.min(Math.max(editText.split('\n').length, 1), 5)}
                      placeholder={t('chatbot.edit_message_placeholder') || 'Edit your message...'}
                      disabled={isSavingEdit}
                    />
                    <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                      {/* Left: Character count */}
                      {editText.length > 0 && (
                        <span className={`text-xs whitespace-nowrap ${editText.length > 1000 ? 'text-[#FF6B6B]' : 'text-[#666666]'}`}>
                          {editText.length} {t('chatbot.characters') || 'characters'}
                        </span>
                      )}
                      
                      {/* Middle: Hint text - flex-1 to take available space */}
                      <span className="flex-1 text-xs text-[#666666] text-center hidden sm:inline whitespace-nowrap">
                        {t('chatbot.edit_hint') || 'Press Enter to save, Esc to cancel'}
                      </span>
                      
                      {/* Right: Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-[#CCCCCC] hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs whitespace-nowrap"
                          title={t('chatbot.cancel_edit') || 'Cancel editing'}
                        >
                          <X className="h-3 w-3" />
                          {t('chatbot.cancel') || 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          disabled={!editText.trim() || isSavingEdit || isLoading}
                          className="px-3 py-1.5 bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs whitespace-nowrap"
                          title={t('chatbot.save_edit') || 'Save changes'}
                        >
                          {isSavingEdit ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>{t('chatbot.saving') || 'Saving...'}</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3" />
                              <span>{t('chatbot.save') || 'Save'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm user-message-text">
                    {searchQuery ? (
                      highlightText(message.text, searchQuery)
                    ) : (
                      <>
                        {message.text}
                        {message.edited && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#4CAF50]/20 text-[#4CAF50] text-xs rounded-md font-medium">
                            <Edit2 className="h-2.5 w-2.5" />
                            {t('chatbot.edited') || 'edited'}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
                
                {/* Action buttons - appears on hover (only when not editing) */}
                {editingMessageId !== index && (
                  <>
                    {/* Copy button - only for bot messages */}
                    {message.role === 'bot' && (
                      <button
                        onClick={() => handleCopyMessage(message.text, index)}
                        className={`absolute right-1 top-1 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40 ${
                          copiedMessageId === index ? 'opacity-100' : ''
                        }`}
                        title={t('chatbot.copy_message') || 'Copy message'}
                      >
                        {copiedMessageId === index ? (
                          <Check className="h-3 w-3 text-[#4CAF50]" />
                        ) : (
                          <Copy className="h-3 w-3 text-current" />
                        )}
                      </button>
                    )}
                    
                    {/* Edit button - only for user messages */}
                    {message.role === 'user' && message.status === 'sent' && (
                      <button
                        onClick={() => handleStartEdit(index)}
                        className="absolute left-1 top-1 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/20 hover:bg-[#4CAF50]/20 hover:scale-110 active:scale-95"
                        title={t('chatbot.edit_message') || 'Edit message'}
                        aria-label={t('chatbot.edit_message') || 'Edit message'}
                      >
                        <Edit2 className="h-3 w-3 text-current" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Timestamp and status */}
            <div className={`flex items-center gap-2 text-xs text-[#8A8A8A] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <span>{formatRelativeTime(message.timestamp)}</span>
              {message.role === 'user' && message.status && (
                <>
                  <span>•</span>
                  {message.status === 'sending' && (
                    <span className="text-[#FFA726] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('chatbot.sending') || 'Sending...'}
                    </span>
                  )}
                  {message.status === 'sent' && (
                    <span className="text-[#4CAF50] flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {t('chatbot.sent') || 'Sent'}
                    </span>
                  )}
                  {message.status === 'failed' && (
                    <span className="text-[#D32F2F] flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {t('chatbot.failed') || 'Failed'}
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Message Reactions - only for bot messages */}
            {message.role === 'bot' && !message.isError && (
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => handleReaction(index, 'up')}
                  className={`p-1.5 rounded transition-colors ${
                    messageReactions[index] === 'up'
                      ? 'bg-[#4CAF50]/20 text-[#4CAF50]'
                      : 'text-[#8A8A8A] hover:bg-[#333333] hover:text-[#4CAF50]'
                  }`}
                  title={t('chatbot.reaction_helpful') || 'Helpful'}
                  aria-label={t('chatbot.reaction_helpful') || 'Helpful'}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleReaction(index, 'down')}
                  className={`p-1.5 rounded transition-colors ${
                    messageReactions[index] === 'down'
                      ? 'bg-[#D32F2F]/20 text-[#D32F2F]'
                      : 'text-[#8A8A8A] hover:bg-[#333333] hover:text-[#D32F2F]'
                  }`}
                  title={t('chatbot.reaction_not_helpful') || 'Not helpful'}
                  aria-label={t('chatbot.reaction_not_helpful') || 'Not helpful'}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
            );
          })
        )}
        {isLoading && (
          <div className="flex items-end gap-2 animate-fade-in">
            {/* Bot Avatar for typing indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#388E3C] flex items-center justify-center shadow-lg">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4CAF50] rounded-full border-2 border-[#1A1A1A] animate-pulse"></div>
            </div>
            <div className="bg-[#2A2A2A] rounded-lg px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}></div>
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#1F1F1F] rounded-b-lg">
        {/* Quick Action Buttons */}
        {getQuickActions() && (
          <div className="mb-3 flex flex-wrap gap-2">
            {getQuickActions().map((action, idx) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] hover:border-[#4CAF50] rounded-lg text-xs text-[#E0E0E0] transition-colors"
                  disabled={isLoading}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span>{action.text}</span>
                </button>
              );
            })}
          </div>
        )}
        
        {showRetry && lastUserPrompt && (
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="mb-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#6c757d] hover:bg-[#5a6268] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            {t('chatbot.retry')}
          </button>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatbot.placeholder')}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#333333] rounded-lg text-[#E0E0E0] placeholder-[#8A8A8A] focus:outline-none focus:border-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            aria-label={t('chatbot.input_label') || 'Type your message'}
            aria-describedby="chatbot-input-help"
          />
          <div id="chatbot-input-help" className="sr-only">
            {t('chatbot.input_help') || 'Press Enter to send, Shift+Enter for new line'}
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={t('chatbot.send')}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
      </div>
      
      {/* Clear History Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearHistoryDialog}
        title={t('chatbot.clear_history') || 'Clear History'}
        description={t('chatbot.clear_history_confirm') || 'Are you sure you want to clear conversation history? This action cannot be undone.'}
        confirmLabel={t('chatbot.clear_history') || 'Clear History'}
        cancelLabel={t('chatbot.cancel') || 'Cancel'}
        onConfirm={handleConfirmClearHistory}
        onCancel={handleCancelClearHistory}
      />
    </Fragment>
  );
}
