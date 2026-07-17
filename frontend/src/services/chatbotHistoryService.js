/**
 * Chatbot History Service - Manages conversation history in localStorage
 */

const STORAGE_KEY = 'inavora_chatbot_history';
const MAX_HISTORY_ITEMS = 50; // Maximum number of messages to store

/**
 * Check if a message is a welcome message
 * @param {Object} msg - Message object
 * @returns {boolean} True if message is a welcome message
 */
const isWelcomeMessage = (msg) => {
  if (msg.role !== 'bot' || !msg.text || typeof msg.text !== 'string') return false;
  // Check for common welcome message patterns (works across languages)
  const welcomePatterns = [
    /hello.*ready.*help/i,
    /ready.*help.*today/i,
    /how can.*help/i
  ];
  return welcomePatterns.some(pattern => pattern.test(msg.text));
};

/**
 * Save conversation history to localStorage
 * @param {Array} messages - Array of message objects
 */
export const saveConversationHistory = (messages) => {
  try {
    // Filter out welcome message and system messages
    const filteredMessages = messages.filter(msg => 
      msg.role !== 'system' && !isWelcomeMessage(msg)
    );

    if (filteredMessages.length === 0) return;

    // Keep only last MAX_HISTORY_ITEMS messages
    const messagesToSave = filteredMessages.slice(-MAX_HISTORY_ITEMS);

    // Convert Date objects to ISO strings for storage
    const serializedMessages = messagesToSave.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedMessages));
  } catch (error) {
    console.error('Failed to save conversation history:', error);
  }
};

/**
 * Load conversation history from localStorage
 * @returns {Array} Array of message objects
 */
export const loadConversationHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const messages = JSON.parse(stored);
    
    // Convert ISO strings back to Date objects
    return messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    return [];
  }
};

/**
 * Clear conversation history from localStorage
 */
export const clearConversationHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear conversation history:', error);
  }
};

/**
 * Export conversation as text
 * @param {Array} messages - Array of message objects
 * @param {boolean} includeWelcome - Whether to include welcome messages (default: false)
 * @returns {string} Formatted text string
 */
export const exportConversationAsText = (messages, includeWelcome = false) => {
  const lines = ['=== Chatbot Conversation ===\n'];
  
  // Filter messages if needed
  const messagesToExport = includeWelcome 
    ? messages 
    : messages.filter(msg => msg.role !== 'system' && !isWelcomeMessage(msg));
  
  messagesToExport.forEach((msg, index) => {
    if (!msg || !msg.text) return; // Skip invalid messages
    const timestamp = msg.timestamp instanceof Date 
      ? msg.timestamp.toLocaleString() 
      : new Date(msg.timestamp).toLocaleString();
    const role = msg.role === 'user' ? 'You' : 'Bot';
    lines.push(`[${timestamp}] ${role}:`);
    lines.push(msg.text || '(Empty message)');
    lines.push(''); // Empty line between messages
  });

  return lines.join('\n');
};

/**
 * Export conversation as JSON
 * @param {Array} messages - Array of message objects
 * @param {boolean} includeWelcome - Whether to include welcome messages (default: false)
 * @returns {string} JSON string
 */
export const exportConversationAsJSON = (messages, includeWelcome = false) => {
  // Filter messages if needed
  const messagesToExport = includeWelcome 
    ? messages 
    : messages.filter(msg => msg.role !== 'system' && !isWelcomeMessage(msg));
  
  const validMessages = messagesToExport.filter(msg => msg && msg.text);
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    messageCount: validMessages.length,
    totalMessages: messages.length,
    messages: validMessages.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp instanceof Date 
          ? msg.timestamp.toISOString() 
          : msg.timestamp,
        status: msg.status || null
      }))
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Download file with given content
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
