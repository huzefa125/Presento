const quizSessionService = require('../services/quizSessionService');

/**
 * Quiz interaction handler
 */
const quiz = {
  /**
   * Build results payload for quiz slides
   * @param {Object} slide - The slide document
   * @param {Array} responses - Array of response documents
   * @returns {Object} - Results payload
   */
  buildResults: (slide, responses) => {
    const slideId = slide._id || slide.id;
    
    // Try to get live session results first
    const sessionResults = quizSessionService.getResults(slideId);
    
    // If we have session results, use them
    if (sessionResults && sessionResults.totalResponses > 0) {
      // Extract voteCounts from session results for participant view
      const voteCounts = sessionResults.optionCounts || {};
      
      return {
        voteCounts, // Add voteCounts for participant view
        quizState: {
          results: sessionResults
        }
      };
    }
    
    // Otherwise, build from stored responses
    const optionCounts = {};
    const voteCounts = {}; // For participant view compatibility
    let correctCount = 0;
    let incorrectCount = 0;
    let totalResponseTime = 0;
    
    // Initialize voteCounts with all quiz options
    const quizOptions = slide?.quizSettings?.options || [];
    quizOptions.forEach(option => {
      const key = option.id || option.text || String(option);
      voteCounts[key] = 0;
    });
    
    responses.forEach((response) => {
      if (response.answer) {
        const answerKey = response.answer;
        optionCounts[answerKey] = (optionCounts[answerKey] || 0) + 1;
        // Also populate voteCounts for participant view
        if (voteCounts.hasOwnProperty(answerKey)) {
          voteCounts[answerKey]++;
        } else {
          // Fallback: try to find matching key
          const matchingKey = Object.keys(voteCounts).find(key => String(key) === String(answerKey));
          if (matchingKey) {
            voteCounts[matchingKey]++;
          } else {
            // Add if not found
            voteCounts[answerKey] = 1;
          }
        }
      }
      
      if (response.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
      
      if (response.responseTime) {
        totalResponseTime += response.responseTime;
      }
    });
    
    const totalResponses = responses.length;
    const averageResponseTime = totalResponses > 0 ? totalResponseTime / totalResponses : 0;
    
    return {
      voteCounts, // Add voteCounts for participant view
      quizState: {
        results: {
          totalResponses,
          optionCounts,
          correctCount,
          incorrectCount,
          averageResponseTime: Math.round(averageResponseTime)
        }
      }
    };
  }
};

module.exports = quiz;
