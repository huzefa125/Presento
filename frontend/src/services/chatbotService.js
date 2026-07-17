/**
 * Chatbot Service - API calls for chatbot functionality
 */

import { getChatbotUrl } from '../utils/config';

const CHATBOT_API_URL = getChatbotUrl();

/**
 * Send a message to the chatbot
 * @param {string} message - The user's message
 * @param {number} retryCount - Number of retry attempts
 * @returns {Promise<Object>} Response from the chatbot
 */
export const sendChatMessage = async (message, retryCount = 0) => {
  try {
    const response = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message,
        retry_count: retryCount
      })
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        response: data.response
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to get response from chatbot',
        canRetry: data.can_retry !== false
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Network Error: The server is unreachable.',
      canRetry: true,
      isNetworkError: true
    };
  }
};
