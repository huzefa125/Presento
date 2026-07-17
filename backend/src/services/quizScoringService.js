const ParticipantScore = require('../models/ParticipantScore');
const Logger = require('../utils/logger');

/**
 * Quiz Scoring Service
 * Implements time-based scoring algorithm for quiz questions
 */

const SCORING_CONFIG = {
  MAX_SCORE: 1000,
  MIN_SCORE: 500
};

/**
 * Calculate score for a quiz question based on correctness and response time
 * @param {Object} params
 * @param {boolean} params.isCorrect - Whether the answer is correct
 * @param {number} params.responseTime - Time taken to answer in milliseconds
 * @param {number} params.timeLimit - Maximum time allowed in seconds
 * @returns {number} - Calculated score
 */
function calculateQuestionScore({ isCorrect, responseTime, timeLimit }) {
  // No points for incorrect answers
  if (!isCorrect) {
    return 0;
  }

  const { MAX_SCORE, MIN_SCORE } = SCORING_CONFIG;
  const maxTimeMs = timeLimit * 1000;

  // If response time exceeds limit, give minimum score
  if (responseTime > maxTimeMs) {
    return MIN_SCORE;
  }

  // Calculate time-based bonus
  // Score = MIN_SCORE + (MAX_SCORE - MIN_SCORE) * (1 - responseTime / maxTime)
  const timeRatio = responseTime / maxTimeMs;
  const score = MIN_SCORE + (MAX_SCORE - MIN_SCORE) * (1 - timeRatio);

  // Ensure score is within bounds
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));
}

/**
 * Update participant's cumulative score
 * @param {Object} params
 * @param {string} params.presentationId
 * @param {string} params.participantId
 * @param {string} params.participantName
 * @param {string} params.slideId
 * @param {number} params.score
 * @param {number} params.responseTime
 * @param {boolean} params.isCorrect
 * @returns {Promise<Object>} - Updated participant score document
 */
async function updateParticipantScore({
  presentationId,
  participantId,
  participantName,
  slideId,
  score,
  responseTime,
  isCorrect
}) {
  try {
    // Find or create participant score document
    let participantScore = await ParticipantScore.findOne({
      presentationId,
      participantId
    });

    if (!participantScore) {
      participantScore = new ParticipantScore({
        presentationId,
        participantId,
        participantName,
        totalScore: 0,
        quizScores: []
      });
    }

    // Check if this quiz was already answered
    const existingQuizIndex = participantScore.quizScores.findIndex(
      q => q.slideId.toString() === slideId.toString()
    );

    if (existingQuizIndex !== -1) {
      // Update existing quiz score (in case of re-submission)
      const oldScore = participantScore.quizScores[existingQuizIndex].score;
      participantScore.totalScore = participantScore.totalScore - oldScore + score;
      participantScore.quizScores[existingQuizIndex] = {
        slideId,
        score,
        responseTime,
        isCorrect,
        answeredAt: new Date()
      };
    } else {
      // Add new quiz score
      participantScore.totalScore += score;
      participantScore.quizScores.push({
        slideId,
        score,
        responseTime,
        isCorrect,
        answeredAt: new Date()
      });
    }

    // Update participant name if it changed
    participantScore.participantName = participantName;

    await participantScore.save();
    return participantScore;
  } catch (error) {
    Logger.error('Error updating participant score', error);
    throw error;
  }
}

/**
 * Get leaderboard for a presentation
 * @param {string} presentationId
 * @param {number} limit - Number of top participants to return (default: 10)
 * @returns {Promise<Array>} - Array of top participants with scores
 */
async function getLeaderboard(presentationId, limit = 10) {
  try {
    const leaderboard = await ParticipantScore.find({ presentationId })
      .sort({ totalScore: -1 })
      .limit(limit)
      .lean();

    return leaderboard.map((participant, index) => ({
      rank: index + 1,
      participantId: participant.participantId,
      participantName: participant.participantName,
      totalScore: participant.totalScore,
      quizCount: participant.quizScores.length
    }));
  } catch (error) {
    Logger.error('Error fetching leaderboard', error);
    throw error;
  }
}

/**
 * Get leaderboard with score deltas (change from previous quiz)
 * @param {string} presentationId
 * @param {string} slideId - Current quiz slide ID
 * @param {number} limit - Number of top participants to return (default: 10)
 * @returns {Promise<Array>} - Array of top participants with scores and deltas
 */
async function getLeaderboardWithDeltas(presentationId, slideId, limit = 10) {
  try {
    const participants = await ParticipantScore.find({ presentationId })
      .sort({ totalScore: -1, lastUpdated: 1 })
      .limit(limit)
      .lean();

    return participants.map((participant, index) => {
      // Find the score for this specific quiz
      const currentQuiz = participant.quizScores.find(
        q => q.slideId.toString() === slideId.toString()
      );
      const delta = currentQuiz ? currentQuiz.score : 0;

      return {
        rank: index + 1,
        participantId: participant.participantId,
        participantName: participant.participantName,
        totalScore: participant.totalScore,
        delta: delta,
        quizCount: participant.quizScores.length
      };
    });
  } catch (error) {
    Logger.error('Error fetching leaderboard with deltas', error);
    throw error;
  }
}

/**
 * Get leaderboard for a specific quiz slide (single round scores)
 * @param {string} presentationId
 * @param {string} slideId - Quiz slide ID
 * @param {number} limit
 * @returns {Promise<Array>} - Array of participants ranked by this quiz score
 */
async function getSingleQuizLeaderboard(presentationId, slideId, limit = 10) {
  try {
    const participants = await ParticipantScore.find({ presentationId }).lean();

    const quizResults = participants
      .map((participant) => {
        const quizEntry = participant.quizScores.find(
          (q) => q.slideId.toString() === slideId.toString()
        );

        if (!quizEntry) {
          return null;
        }

        return {
          participantId: participant.participantId,
          participantName: participant.participantName,
          score: quizEntry.score,
          responseTime: quizEntry.responseTime,
          answeredAt: quizEntry.answeredAt,
          totalScore: participant.totalScore,
          quizCount: participant.quizScores.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.responseTime !== null && b.responseTime !== null && a.responseTime !== b.responseTime) {
          return a.responseTime - b.responseTime; // faster response ranks higher
        }
        if (a.answeredAt && b.answeredAt && a.answeredAt.getTime() !== b.answeredAt.getTime()) {
          return a.answeredAt - b.answeredAt;
        }
        return a.participantName.localeCompare(b.participantName);
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        participantId: entry.participantId,
        participantName: entry.participantName,
        score: entry.score,
        totalScore: entry.totalScore,
        quizCount: entry.quizCount,
        responseTime: entry.responseTime,
      }));

    return quizResults;
  } catch (error) {
    Logger.error('Error fetching single quiz leaderboard', error);
    throw error;
  }
}

/**
 * Build cumulative leaderboards after each quiz slide
 * @param {string} presentationId
 * @param {Array} quizSlides - Ordered quiz slides
 * @param {number} limit
 * @returns {Promise<Object>} - { leaderboardsBySlide, finalLeaderboard }
 */
async function getCumulativeLeaderboards(presentationId, quizSlides = [], limit = 10) {
  try {
    const participants = await ParticipantScore.find({ presentationId }).lean();

    const cumulativeMap = new Map();
    const leaderboardsBySlide = {};

    for (const quiz of quizSlides) {
      const quizId = quiz?._id?.toString?.() || quiz?.toString?.();
      if (!quizId) continue;

      participants.forEach((participant) => {
        const prev = cumulativeMap.get(participant.participantId) || {
          participantName: participant.participantName,
          totalScore: 0,
          quizCount: 0,
          lastAnsweredAt: null,
        };

        const quizEntry = Array.isArray(participant.quizScores)
          ? participant.quizScores.find((q) => q.slideId.toString() === quizId)
          : null;

        if (quizEntry) {
          prev.totalScore += quizEntry.score;
          prev.quizCount += 1;
          prev.lastAnsweredAt = quizEntry.answeredAt || prev.lastAnsweredAt;
        }

        if (quizEntry || prev.quizCount > 0 || prev.totalScore > 0) {
          prev.participantName = participant.participantName;
          cumulativeMap.set(participant.participantId, prev);
        }
      });

      const leaderboardList = Array.from(cumulativeMap.entries())
        .map(([participantId, summary]) => ({
          participantId,
          participantName: summary.participantName,
          totalScore: summary.totalScore,
          quizCount: summary.quizCount,
          lastAnsweredAt: summary.lastAnsweredAt,
        }))
        .sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          if (b.quizCount !== a.quizCount) return b.quizCount - a.quizCount;
          if (a.lastAnsweredAt && b.lastAnsweredAt && a.lastAnsweredAt !== b.lastAnsweredAt) {
            return a.lastAnsweredAt - b.lastAnsweredAt;
          }
          return a.participantName.localeCompare(b.participantName);
        })
        .slice(0, limit)
        .map((entry, index) => ({
          rank: index + 1,
          participantId: entry.participantId,
          participantName: entry.participantName,
          totalScore: entry.totalScore,
          quizCount: entry.quizCount,
        }));

      leaderboardsBySlide[quizId] = leaderboardList;
    }

    const quizIds = quizSlides
      .map((quiz) => quiz?._id?.toString?.())
      .filter(Boolean);

    const finalLeaderboard = quizIds.length > 0
      ? leaderboardsBySlide[quizIds[quizIds.length - 1]] || []
      : [];

    return {
      leaderboardsBySlide,
      finalLeaderboard,
    };
  } catch (error) {
    Logger.error('Error building cumulative leaderboards', error);
    throw error;
  }
}

/**
 * Get participant's score for a specific presentation
 * @param {string} presentationId
 * @param {string} participantId
 * @returns {Promise<Object|null>} - Participant score document
 */
async function getParticipantScore(presentationId, participantId) {
  try {
    return await ParticipantScore.findOne({
      presentationId,
      participantId
    }).lean();
  } catch (error) {
    Logger.error('Error fetching participant score', error);
    throw error;
  }
}

/**
 * Clear all scores for a presentation (useful for resetting)
 * @param {string} presentationId
 * @returns {Promise<Object>} - Delete result
 */
async function clearPresentationScores(presentationId) {
  try {
    return await ParticipantScore.deleteMany({ presentationId });
  } catch (error) {
    Logger.error('Error clearing presentation scores', error);
    throw error;
  }
}

/**
 * Clear scores for a specific slide and recalculate total scores
 * @param {string} presentationId
 * @param {string} slideId - The slide ID to clear scores for
 * @returns {Promise<Object>} - Update result with count of participants affected
 */
async function clearSlideScores(presentationId, slideId) {
  try {
    // Find all participant scores for this presentation
    const participants = await ParticipantScore.find({ presentationId });

    let affectedCount = 0;

    // For each participant, remove the score for this slide and recalculate total
    for (const participant of participants) {
      const quizScoreIndex = participant.quizScores.findIndex(
        q => q.slideId.toString() === slideId.toString()
      );

      if (quizScoreIndex !== -1) {
        // Remove the score for this slide
        const removedScore = participant.quizScores[quizScoreIndex].score;
        participant.quizScores.splice(quizScoreIndex, 1);
        
        // Recalculate total score
        participant.totalScore = Math.max(0, participant.totalScore - removedScore);
        
        // Update lastUpdated timestamp
        participant.lastUpdated = new Date();
        
        await participant.save();
        affectedCount++;
      }
    }

    Logger.info(`Cleared scores for slide ${slideId}, affected ${affectedCount} participants`);
    
    return {
      success: true,
      affectedCount
    };
  } catch (error) {
    Logger.error('Error clearing slide scores', error);
    throw error;
  }
}

/**
 * Recalculate and fix scores for all participants in a presentation
 * This ensures that incorrect answers have 0 points
 * @param {string} presentationId
 * @returns {Promise<Object>} - Update result with count of participants fixed
 */
async function recalculatePresentationScores(presentationId) {
  try {
    const Response = require('../models/Response');
    const participants = await ParticipantScore.find({ presentationId });

    let fixedCount = 0;

    for (const participant of participants) {
      let totalScore = 0;
      let needsUpdate = false;

      // Recalculate scores for each quiz
      for (let i = 0; i < participant.quizScores.length; i++) {
        const quizScore = participant.quizScores[i];
        
        // If the answer was incorrect but score is not 0, fix it
        if (!quizScore.isCorrect && quizScore.score !== 0) {
          quizScore.score = 0;
          needsUpdate = true;
        }
        
        totalScore += quizScore.score;
      }

      // Update if needed
      if (needsUpdate || participant.totalScore !== totalScore) {
        participant.totalScore = totalScore;
        participant.lastUpdated = new Date();
        await participant.save();
        fixedCount++;
      }
    }

    Logger.info(`Recalculated scores for presentation ${presentationId}, fixed ${fixedCount} participants`);
    
    return {
      success: true,
      fixedCount
    };
  } catch (error) {
    Logger.error('Error recalculating presentation scores', error);
    throw error;
  }
}

module.exports = {
  calculateQuestionScore,
  updateParticipantScore,
  getLeaderboard,
  getLeaderboardWithDeltas,
  getSingleQuizLeaderboard,
  getCumulativeLeaderboards,
  getParticipantScore,
  clearPresentationScores,
  clearSlideScores,
  recalculatePresentationScores,
  SCORING_CONFIG
};
