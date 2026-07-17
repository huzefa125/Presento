const Presentation = require('../models/Presentation');
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const User = require('../models/User');
const XLSX = require('xlsx');
const leaderboardService = require('../services/leaderboardService');
const quizScoringService = require('../services/quizScoringService');
const qnaSession = require('../services/qnaSession');
const quizSessionService = require('../services/quizSessionService');
const guessNumberSession = require('../services/guessNumberSession');
const { createSlide, updateSlide, deleteSlide } = require('./slideController.js');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const { isSubscriptionActive } = require('../services/subscriptionService');

/**
 * Create a new presentation
 * @route POST /api/presentations
 * @access Private
 * @param {string} req.body.title - Presentation title
 * @returns {Object} Created presentation object
 */
const createPresentation = asyncHandler(async (req, res, next) => {
  const { title } = req.body;
  const userId = req.userId;

  if (!userId) {
    Logger.error('createPresentation: userId is missing', { userId, user: req.user });
    throw new AppError('User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!title || !title.trim()) {
    throw new AppError('Presentation title is required', 400, 'VALIDATION_ERROR');
  }

  // Enforce free plan limit: max 3 presentations in the last 30 days
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const hasActiveSubscription = await isSubscriptionActive(user.subscription, user);

  if (!hasActiveSubscription) {
    // User is effectively on the free plan
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPresentationCount = await Presentation.countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    if (recentPresentationCount >= 3) {
      // Use a stable code so the frontend can translate this message
      throw new AppError(
        'FREE_PLAN_PRESENTATION_LIMIT',
        403,
        'FREE_PLAN_PRESENTATION_LIMIT'
      );
    }
  }

  let accessCode;
  let isUnique = false;

  while (!isUnique) {
    accessCode = Presentation.generateAccessCode();
    const existing = await Presentation.findOne({ accessCode });
    if (!existing) isUnique = true;
  }

  const presentation = new Presentation({
    userId,
    title: title.trim(),
    accessCode,
    isLive: false,
    currentSlideIndex: 0,
    showResults: true
  });

  await presentation.save();

  res.status(201).json({
    success: true,
    message: 'Presentation created successfully',
    presentation: {
      id: presentation._id,
      title: presentation.title,
      accessCode: presentation.accessCode,
      isLive: presentation.isLive,
      currentSlideIndex: presentation.currentSlideIndex,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt
    }
  });
});

/**
 * Get all presentations for the logged-in user
 * @route GET /api/presentations
 * @access Private
 * @param {number} req.query.limit - Maximum number of presentations to return (default: 20)
 * @param {number} req.query.skip - Number of presentations to skip (default: 0)
 * @returns {Object} Array of presentations with slide counts
 */
const getUserPresentations = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const { limit = 20, skip = 0 } = req.query;

  const presentations = await Presentation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

  const presentationIds = presentations.map(p => p._id);
  const slideCounts = await Slide.aggregate([
    { $match: { presentationId: { $in: presentationIds } } },
    { $group: { _id: '$presentationId', count: { $sum: 1 } } }
  ]);
  
  const slideCountMap = new Map(slideCounts.map(sc => [sc._id.toString(), sc.count]));

  const presentationsWithSlideCount = presentations.map((presentation) => ({
    id: presentation._id,
    title: presentation.title,
    accessCode: presentation.accessCode,
    isLive: presentation.isLive,
    currentSlideIndex: presentation.currentSlideIndex,
    showResults: presentation.showResults,
    slideCount: slideCountMap.get(presentation._id.toString()) || 0,
    createdAt: presentation.createdAt,
    updatedAt: presentation.updatedAt
  }));

  res.status(200).json({
    success: true,
    presentations: presentationsWithSlideCount,
    total: presentations.length
  });
});

/**
 * Get a single presentation by ID with all slides
 * @route GET /api/presentations/:id
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @returns {Object} Presentation object with slides array
 */
const getPresentationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const isInstitutionAdmin = req.institutionAdmin;
  const institutionId = req.institution?.id || req.institution?._id;

  // First check if presentation exists at all
  const presentationExists = await Presentation.findById(id).lean();
  
  if (!presentationExists) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if it belongs to the user (this will work for both regular users and admin's own presentations)
  let presentation = await Presentation.findOne({ _id: id, userId }).lean();

  // If not found and user is an institution admin, check if presentation belongs to any institution user
  if (!presentation && isInstitutionAdmin && institutionId) {
    const mongoose = require('mongoose');
    const institutionObjectId = mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId;
    
    // Get all users in this institution (must have both institutionId matching AND isInstitutionUser flag)
    const institutionUsers = await User.find({ 
      institutionId: institutionObjectId,
      isInstitutionUser: true 
    }).select('_id institutionId').lean();
    
    // Also check if admin user exists and belongs to this institution
    const adminEmail = req.institution?.adminEmail;
    let adminUser = null;
    if (adminEmail) {
      adminUser = await User.findOne({ 
        email: adminEmail.toLowerCase(),
        institutionId: institutionObjectId
      }).select('_id institutionId').lean();
      
      // Add admin user to list if it belongs to this institution
      if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
        const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
        if (!adminInList) {
          institutionUsers.push(adminUser);
        }
      }
    }
    
    // Build list of all valid institution user IDs
    const institutionUserIds = institutionUsers
      .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
      .map(u => u._id.toString());
    
    // Also check if the presentation's creator user belongs to this institution
    // (even if they're not in the isInstitutionUser list, if they have the same institutionId)
    const presentationCreator = await User.findById(presentationExists.userId).select('institutionId').lean();
    
    // Check if presentation belongs to any institution user OR if creator has matching institutionId
    const presentationUserIdStr = presentationExists.userId.toString();
    const belongsToInstitutionUser = institutionUserIds.includes(presentationUserIdStr);
    const creatorBelongsToInstitution = presentationCreator && 
      presentationCreator.institutionId && 
      presentationCreator.institutionId.toString() === institutionId.toString();
    
    if (belongsToInstitutionUser || creatorBelongsToInstitution) {
      presentation = presentationExists;
    }
  }

  if (!presentation) {
    // Presentation exists but doesn't belong to this user or their institution
    throw new AppError('Presentation not found or access denied', 404, 'RESOURCE_NOT_FOUND');
  }

  const slides = await Slide.find({ presentationId: id })
      .sort({ order: 1 })
      .select('-__v')
      .lean();

  res.status(200).json({
    success: true,
      presentation: {
        id: presentation._id,
        title: presentation.title,
        accessCode: presentation.accessCode,
        isLive: presentation.isLive,
        currentSlideIndex: presentation.currentSlideIndex,
        showResults: presentation.showResults,
        createdAt: presentation.createdAt,
        updatedAt: presentation.updatedAt
      },
      slides: slides.map(slide => ({
        id: slide._id,
        order: slide.order,
        type: slide.type,
        question: slide.question,
        options: slide.options,
        minValue: slide.minValue,
        maxValue: slide.maxValue,
        minLabel: slide.minLabel,
        maxLabel: slide.maxLabel,
        statements: slide.statements,
        rankingItems: slide.rankingItems,
        hundredPointsItems: slide.hundredPointsItems,
        gridItems: slide.gridItems,
        gridAxisXLabel: slide.gridAxisXLabel,
        gridAxisYLabel: slide.gridAxisYLabel,
        gridAxisRange: slide.gridAxisRange,
        maxWordsPerParticipant: slide.maxWordsPerParticipant,
        openEndedSettings: slide.openEndedSettings,
        qnaSettings: slide.qnaSettings,
        guessNumberSettings: slide.type === 'guess_number'
          ? (slide.guessNumberSettings || { minValue: 1, maxValue: 10, correctAnswer: 5 })
          : slide.guessNumberSettings,
        pinOnImageSettings: slide.pinOnImageSettings,
        quizSettings: slide.quizSettings,
        leaderboardSettings: slide.leaderboardSettings,
        textContent: slide.textContent,
        imageUrl: slide.imageUrl,
        imagePublicId: slide.imagePublicId,
        videoUrl: slide.videoUrl,
        videoPublicId: slide.videoPublicId,
        instructionContent: slide.instructionContent,
        // Fields for "Bring Your Slides In" slide types
        miroUrl: slide.miroUrl,
        powerpointUrl: slide.powerpointUrl,
        powerpointPublicId: slide.powerpointPublicId,
        googleSlidesUrl: slide.googleSlidesUrl,
        pdfUrl: slide.pdfUrl,
        pdfPublicId: slide.pdfPublicId,
        pdfPages: slide.pdfPages,
        createdAt: slide.createdAt,
        updatedAt: slide.updatedAt
      }))
  });
});


/**
 * Get presentation results with aggregated data
 * @route GET /api/presentations/:id/results
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @returns {Object} Aggregated results for all slides
 */
const getPresentationResultById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const isInstitutionAdmin = req.institutionAdmin;
  const institutionId = req.institution?.id || req.institution?._id;

  // First check if presentation exists at all
  const presentationExists = await Presentation.findById(id).lean();
  
  if (!presentationExists) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if it belongs to the user (this will work for both regular users and admin's own presentations)
  let presentation = await Presentation.findOne({ _id: id, userId }).lean();

  // If not found and user is an institution admin, check if presentation belongs to any institution user
  if (!presentation && isInstitutionAdmin && institutionId) {
    const mongoose = require('mongoose');
    const institutionObjectId = mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId;
    
    // Get all users in this institution (must have both institutionId matching AND isInstitutionUser flag)
    const institutionUsers = await User.find({ 
      institutionId: institutionObjectId,
      isInstitutionUser: true 
    }).select('_id institutionId').lean();
    
    // Also check if admin user exists and belongs to this institution
    const adminEmail = req.institution?.adminEmail;
    let adminUser = null;
    if (adminEmail) {
      adminUser = await User.findOne({ 
        email: adminEmail.toLowerCase(),
        institutionId: institutionObjectId
      }).select('_id institutionId').lean();
      
      // Add admin user to list if it belongs to this institution
      if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
        const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
        if (!adminInList) {
          institutionUsers.push(adminUser);
        }
      }
    }
    
    // Build list of all valid institution user IDs
    const institutionUserIds = institutionUsers
      .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
      .map(u => u._id.toString());
    
    // Also check if the presentation's creator user belongs to this institution
    // (even if they're not in the isInstitutionUser list, if they have the same institutionId)
    const presentationCreator = await User.findById(presentationExists.userId).select('institutionId').lean();
    
    // Check if presentation belongs to any institution user OR if creator has matching institutionId
    const presentationUserIdStr = presentationExists.userId.toString();
    const belongsToInstitutionUser = institutionUserIds.includes(presentationUserIdStr);
    const creatorBelongsToInstitution = presentationCreator && 
      presentationCreator.institutionId && 
      presentationCreator.institutionId.toString() === institutionId.toString();
    
    if (belongsToInstitutionUser || creatorBelongsToInstitution) {
      presentation = presentationExists;
    }
  }

  if (!presentation) {
    // Presentation exists but doesn't belong to this user or their institution
    throw new AppError('Presentation not found or access denied', 404, 'RESOURCE_NOT_FOUND');
  }

    const slides = await Slide.find({ presentationId: id }).sort({ order: 1 });
    const responses = await Response.find({ presentationId: id });
    const results = {};

    for (const slide of slides) {
      const slideResponses = responses.filter(r => r.slideId.toString() === slide._id.toString());
      const totalResponses = slideResponses.length;

      let slideResult = {
        slideId: slide._id,
        type: slide.type,
        totalResponses
      };

      switch (slide.type) {
        case 'multiple_choice':
          const voteCounts = {};
          if (slide.options) {
            slide.options.forEach(opt => voteCounts[opt] = 0);
          }
          slideResponses.forEach(r => {
            if (voteCounts[r.answer] !== undefined) {
              voteCounts[r.answer]++;
            }
          });
          slideResult.voteCounts = voteCounts;
          break;

        case 'word_cloud':
          const wordFrequencies = {};
          slideResponses.forEach(r => {
            const words = Array.isArray(r.answer) ? r.answer : [r.answer];
            words.forEach(word => {
              if (word) {
                const normalizedWord = word.toLowerCase().trim();
                wordFrequencies[normalizedWord] = (wordFrequencies[normalizedWord] || 0) + 1;
              }
            });
          });
          slideResult.wordFrequencies = wordFrequencies;
          break;

        case 'scales':
          const scaleDistribution = {};
          const scaleStatements = slide.statements || [];
          const statementCounts = new Array(scaleStatements.length).fill(0);
          const statementSums = new Array(scaleStatements.length).fill(0);

          slideResponses.forEach(r => {
            if (typeof r.answer === 'object' && r.answer !== null) {
              Object.entries(r.answer).forEach(([statementIndex, value]) => {
                const idx = parseInt(statementIndex);
                if (!isNaN(idx) && idx < scaleStatements.length) {
                  if (!scaleDistribution[idx]) scaleDistribution[idx] = {};
                  scaleDistribution[idx][value] = (scaleDistribution[idx][value] || 0) + 1;
                  statementSums[idx] += value;
                  statementCounts[idx]++;
                }
              });
            }
          });

          const scaleStatementAverages = statementSums.map((sum, idx) =>
            statementCounts[idx] > 0 ? sum / statementCounts[idx] : 0
          );

          const totalSum = statementSums.reduce((a, b) => a + b, 0);
          const totalCount = statementCounts.reduce((a, b) => a + b, 0);
          const scaleOverallAverage = totalCount > 0 ? totalSum / totalCount : 0;

          slideResult.scaleDistribution = scaleDistribution;
          slideResult.scaleStatementAverages = scaleStatementAverages;
          slideResult.scaleOverallAverage = scaleOverallAverage;
          slideResult.statementCounts = statementCounts;
          slideResult.scaleStatements = scaleStatements;
          break;

        case 'ranking':
          const rankingResults = slide.rankingItems ? slide.rankingItems.map(item => ({
            id: item.id,
            label: item.label,
            score: 0
          })) : [];

          slideResponses.forEach(r => {
            if (Array.isArray(r.answer)) {
              r.answer.forEach((itemId, index) => {
                const points = (slide.rankingItems?.length || 0) - index;
                const item = rankingResults.find(i => i.id === itemId);
                if (item) {
                  item.score += points;
                }
              });
            }
          });
          rankingResults.sort((a, b) => b.score - a.score);
          slideResult.rankingResults = rankingResults;
          break;

        case 'hundred_points':
          const hundredPointsResults = slide.hundredPointsItems ? slide.hundredPointsItems.map(item => ({
            id: item.id,
            label: item.label,
            totalPoints: 0,
            averagePoints: 0
          })) : [];

          slideResponses.forEach(r => {
            // Handle array format: [{ item: 'uuid', points: 20 }, ...]
            if (Array.isArray(r.answer)) {
              r.answer.forEach(entry => {
                if (entry && entry.item) {
                  const item = hundredPointsResults.find(i => i.id === entry.item);
                  if (item) {
                    item.totalPoints += (parseInt(entry.points) || 0);
                  }
                }
              });
            }
            // Handle object format: { 'uuid': 20 }
            else if (typeof r.answer === 'object' && r.answer !== null) {
              Object.entries(r.answer).forEach(([itemId, points]) => {
                const item = hundredPointsResults.find(i => i.id === itemId);
                if (item) {
                  item.totalPoints += (parseInt(points) || 0);
                }
              });
            }
          });

          hundredPointsResults.forEach(item => {
            item.averagePoints = totalResponses > 0 ? item.totalPoints / totalResponses : 0;
          });

          slideResult.hundredPointsResults = hundredPointsResults;
          break;

        case 'open_ended':
          slideResult.responses = slideResponses.map(r => ({
            id: r._id,
            text: r.answer,
            participantName: r.participantName,
            submittedAt: r.submittedAt,
            votes: r.voteCount || 0
          }));
          break;

        case 'qna':
          slideResult.questions = slideResponses.map(r => ({
            id: r._id,
            text: r.answer,
            participantName: r.participantName,
            submittedAt: r.submittedAt,
            upvotes: r.voteCount || 0,
            isAnswered: r.isAnswered || false
          }));
          break;

        case 'guess_number':
          const guessDistribution = {};
          slideResponses.forEach(r => {
            let val = r.answer;
            if (Array.isArray(val) && val.length > 0) {
              val = val[0];
            }
            guessDistribution[val] = (guessDistribution[val] || 0) + 1;
          });
          slideResult.distribution = guessDistribution;
          break;

        case '2x2_grid':
          const gridResults = [];
          slideResponses.forEach(r => {
            if (Array.isArray(r.answer)) {
              r.answer.forEach(item => {
                gridResults.push({
                  participantName: r.participantName,
                  x: item.x,
                  y: item.y,
                  itemId: item.item
                });
              });
            } else if (r.answer && typeof r.answer === 'object') {
              gridResults.push({
                participantName: r.participantName,
                x: r.answer.x,
                y: r.answer.y,
                itemId: r.answer.itemId
              });
            }
          });
          slideResult.gridResults = gridResults;
          break;

        case 'pin_on_image':
          const pinResults = slideResponses.map(r => ({
            participantName: r.participantName,
            x: r.answer.x,
            y: r.answer.y
          }));
          slideResult.pinResults = pinResults;
          break;

        case 'quiz':
          // Calculate quiz statistics
          let correctCount = 0;
          const quizState = {
            results: {} // optionId -> count
          };

          if (slide.quizSettings?.options) {
            slide.quizSettings.options.forEach(opt => {
              quizState.results[opt.id] = 0;
            });
          }

          slideResponses.forEach(r => {
            if (r.isCorrect) correctCount++;
            if (quizState.results[r.answer] !== undefined) {
              quizState.results[r.answer]++;
            }
          });

          slideResult.quizState = quizState;
          slideResult.correctCount = correctCount;
          slideResult.accuracy = totalResponses > 0 ? (correctCount / totalResponses) * 100 : 0;
          break;

        case 'leaderboard':
          // Leaderboard data is usually calculated dynamically or stored separately
          // We can fetch the leaderboard summary here
          try {
            const leaderboardData = await buildLeaderboardSummary({
              presentationId: id,
              limit: slide.leaderboardSettings?.displayCount || 10
            });

            // If it's a linked leaderboard, filter for that
            if (slide.leaderboardSettings?.linkedQuizSlideId) {
              const linkedId = slide.leaderboardSettings.linkedQuizSlideId.toString();
              const specificBoard = leaderboardData.perQuizLeaderboards.find(b => b.quizSlideId === linkedId);
              slideResult.leaderboard = specificBoard ? specificBoard.leaderboard : [];
            } else {
              slideResult.leaderboard = leaderboardData.finalLeaderboard;
            }
          } catch (err) {
            Logger.error('Error building leaderboard for result', err);
            slideResult.leaderboard = [];
          }
          break;

        case 'pick_answer':
          // Same handling as multiple_choice
          const pickAnswerVoteCounts = {};
          if (slide.options) {
            slide.options.forEach(opt => pickAnswerVoteCounts[opt] = 0);
          }
          slideResponses.forEach(r => {
            if (pickAnswerVoteCounts[r.answer] !== undefined) {
              pickAnswerVoteCounts[r.answer]++;
            }
          });
          slideResult.voteCounts = pickAnswerVoteCounts;
          break;

        case 'type_answer':
          // Same handling as open_ended
          slideResult.responses = slideResponses.map(r => ({
            id: r._id,
            text: r.answer,
            participantName: r.participantName,
            submittedAt: r.submittedAt,
            votes: r.voteCount || 0
          }));
          break;
        
        // "Bring Your Slides In" slide types - no additional processing needed
        case 'miro':
        case 'powerpoint':
        case 'google_slides':
          // These slide types don't have complex results, just show total responses
          // The totalResponses field is already set above
          break;
      }

      // Store results with slide._id as string key to match frontend slide.id format
      // Frontend receives slides with id: slide._id (which is serialized as string)
      const slideIdKey = slide._id.toString();
      results[slideIdKey] = slideResult;
    }

    res.status(200).json({
      success: true,
      results
    });
});

/**
 * Export presentation results
 * @route GET /api/presentations/:id/export
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @param {string} req.query.format - Export format (csv, excel)
 */
const exportPresentationResults = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { format = 'csv' } = req.query;
  const userId = req.userId;

  if (!['csv', 'excel'].includes(format)) {
    throw new AppError('Invalid export format. Use: csv or excel', 400, 'VALIDATION_ERROR');
  }

  const presentation = await Presentation.findOne({ _id: id, userId });
  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const slides = await Slide.find({ presentationId: id }).sort({ order: 1 });
  const responses = await Response.find({ presentationId: id });
  
  // First, calculate all slide results
  const results = {};
  for (const slide of slides) {
    const slideResponses = responses.filter(r => r.slideId.toString() === slide._id.toString());
    let slideResult = { totalResponses: slideResponses.length };

    if (slide.type === 'scales') {
      const scaleStatements = slide.statements || [];
      const statementSums = new Array(scaleStatements.length).fill(0);
      const statementCounts = new Array(scaleStatements.length).fill(0);

      slideResponses.forEach(r => {
        if (typeof r.answer === 'object' && r.answer !== null) {
          Object.entries(r.answer).forEach(([statementIndex, value]) => {
            const idx = parseInt(statementIndex);
            if (!isNaN(idx) && idx < scaleStatements.length) {
              statementSums[idx] += value;
              statementCounts[idx]++;
            }
          });
        }
      });

      slideResult.scaleStatementAverages = statementSums.map((sum, idx) =>
        statementCounts[idx] > 0 ? sum / statementCounts[idx] : 0
      );
    } else if (slide.type === 'ranking') {
      const rankingResults = slide.rankingItems ? slide.rankingItems.map(item => ({
        id: item.id,
        label: item.label,
        score: 0
      })) : [];

      slideResponses.forEach(r => {
        if (Array.isArray(r.answer)) {
          r.answer.forEach((itemId, index) => {
            const points = (slide.rankingItems?.length || 0) - index;
            const item = rankingResults.find(i => i.id === itemId);
            if (item) {
              item.score += points;
            }
          });
        }
      });
      rankingResults.sort((a, b) => b.score - a.score);
      slideResult.rankingResults = rankingResults;
    } else if (slide.type === 'hundred_points') {
      const hundredPointsResults = slide.hundredPointsItems ? slide.hundredPointsItems.map(item => ({
        id: item.id,
        label: item.label,
        totalPoints: 0,
        averagePoints: 0
      })) : [];

      slideResponses.forEach(r => {
        if (Array.isArray(r.answer)) {
          r.answer.forEach(entry => {
            if (entry && entry.item) {
              const item = hundredPointsResults.find(i => i.id === entry.item);
              if (item) {
                item.totalPoints += (parseInt(entry.points) || 0);
              }
            }
          });
        } else if (typeof r.answer === 'object' && r.answer !== null) {
          Object.entries(r.answer).forEach(([itemId, points]) => {
            const item = hundredPointsResults.find(i => i.id === itemId);
            if (item) {
              item.totalPoints += (parseInt(points) || 0);
            }
          });
        }
      });

      hundredPointsResults.forEach(item => {
        item.averagePoints = slideResponses.length > 0 ? item.totalPoints / slideResponses.length : 0;
      });
      slideResult.hundredPointsResults = hundredPointsResults;
    }

    results[slide._id] = slideResult;
  }

  // Now build export data using the calculated results
  const exportData = [];
  
  for (const slide of slides) {
    const slideResponses = responses.filter(r => r.slideId.toString() === slide._id.toString());
    const slideTitle = typeof slide.question === 'string' ? slide.question : (slide.question?.text || `Slide ${slide.order + 1}`);
    const slideResult = results[slide._id];
    
    switch (slide.type) {
      case 'multiple_choice':
      case 'pick_answer':
        const voteCounts = {};
        if (slide.options) {
          slide.options.forEach(opt => voteCounts[opt] = 0);
        }
        slideResponses.forEach(r => {
          if (voteCounts[r.answer] !== undefined) {
            voteCounts[r.answer]++;
          }
        });
        
        exportData.push({
          'Slide Title': slideTitle,
          'Slide Type': slide.type,
          'Total Responses': slideResponses.length,
          'Option': '',
          'Votes': '',
          'Percentage': ''
        });
        
        Object.entries(voteCounts).forEach(([option, count]) => {
          const percentage = slideResponses.length > 0 ? ((count / slideResponses.length) * 100).toFixed(2) + '%' : '0%';
          exportData.push({
            'Slide Title': '',
            'Slide Type': '',
            'Total Responses': '',
            'Option': option,
            'Votes': count,
            'Percentage': percentage
          });
        });
        exportData.push({}); // Empty row separator
        break;

      case 'open_ended':
      case 'type_answer':
        exportData.push({
          'Slide Title': slideTitle,
          'Slide Type': slide.type,
          'Total Responses': slideResponses.length,
          'Response': '',
          'Participant': '',
          'Submitted At': '',
          'Votes': ''
        });
        
        slideResponses.forEach(r => {
          exportData.push({
            'Slide Title': '',
            'Slide Type': '',
            'Total Responses': '',
            'Response': r.answer || '',
            'Participant': r.participantName || 'Anonymous',
            'Submitted At': new Date(r.submittedAt).toLocaleString(),
            'Votes': r.voteCount || 0
          });
        });
        exportData.push({}); // Empty row separator
        break;

      case 'quiz':
        const quizVoteCounts = {};
        if (slide.quizSettings?.options) {
          slide.quizSettings.options.forEach(opt => {
            quizVoteCounts[opt.text || opt.id] = 0;
          });
        }
        let correctCount = 0;
        slideResponses.forEach(r => {
          if (r.isCorrect) correctCount++;
          const optionText = slide.quizSettings?.options?.find(opt => opt.id === r.answer)?.text || r.answer;
          if (quizVoteCounts[optionText] !== undefined) {
            quizVoteCounts[optionText]++;
          }
        });
        
        exportData.push({
          'Slide Title': slideTitle,
          'Slide Type': 'quiz',
          'Total Responses': slideResponses.length,
          'Correct Responses': correctCount,
          'Accuracy': slideResponses.length > 0 ? ((correctCount / slideResponses.length) * 100).toFixed(2) + '%' : '0%',
          'Option': '',
          'Votes': '',
          'Percentage': ''
        });
        
        Object.entries(quizVoteCounts).forEach(([option, count]) => {
          const percentage = slideResponses.length > 0 ? ((count / slideResponses.length) * 100).toFixed(2) + '%' : '0%';
          exportData.push({
            'Slide Title': '',
            'Slide Type': '',
            'Total Responses': '',
            'Correct Responses': '',
            'Accuracy': '',
            'Option': option,
            'Votes': count,
            'Percentage': percentage
          });
        });
        exportData.push({}); // Empty row separator
        break;

      case 'scales':
        exportData.push({
          'Slide Title': slideTitle,
          'Slide Type': 'scales',
          'Total Responses': slideResponses.length,
          'Statement': '',
          'Average': ''
        });
        
        if (slide.statements && slideResult?.scaleStatementAverages) {
          slide.statements.forEach((statement, idx) => {
            exportData.push({
              'Slide Title': '',
              'Slide Type': '',
              'Total Responses': '',
              'Statement': statement,
              'Average': slideResult.scaleStatementAverages[idx]?.toFixed(2) || '0'
            });
          });
        }
        exportData.push({}); // Empty row separator
        break;

      case 'ranking':
        if (slideResult?.rankingResults) {
          exportData.push({
            'Slide Title': slideTitle,
            'Slide Type': 'ranking',
            'Total Responses': slideResponses.length,
            'Item': '',
            'Score': '',
            'Rank': ''
          });
          
          slideResult.rankingResults.forEach((item, idx) => {
            exportData.push({
              'Slide Title': '',
              'Slide Type': '',
              'Total Responses': '',
              'Item': item.label,
              'Score': item.score,
              'Rank': idx + 1
            });
          });
        }
        exportData.push({}); // Empty row separator
        break;

      case 'hundred_points':
        if (slideResult?.hundredPointsResults) {
          exportData.push({
            'Slide Title': slideTitle,
            'Slide Type': 'hundred_points',
            'Total Responses': slideResponses.length,
            'Item': '',
            'Total Points': '',
            'Average Points': ''
          });
          
          slideResult.hundredPointsResults.forEach(item => {
            exportData.push({
              'Slide Title': '',
              'Slide Type': '',
              'Total Responses': '',
              'Item': item.label,
              'Total Points': item.totalPoints,
              'Average Points': item.averagePoints.toFixed(2)
            });
          });
        }
        exportData.push({}); // Empty row separator
        break;

      case 'qna':
        exportData.push({
          'Slide Title': slideTitle,
          'Slide Type': 'qna',
          'Total Questions': slideResponses.length,
          'Question': '',
          'Participant': '',
          'Submitted At': '',
          'Upvotes': '',
          'Answered': ''
        });
        
        slideResponses.forEach(r => {
          exportData.push({
            'Slide Title': '',
            'Slide Type': '',
            'Total Questions': '',
            'Question': r.answer || '',
            'Participant': r.participantName || 'Anonymous',
            'Submitted At': new Date(r.submittedAt).toLocaleString(),
            'Upvotes': r.voteCount || 0,
            'Answered': r.isAnswered ? 'Yes' : 'No'
          });
        });
        exportData.push({}); // Empty row separator
        break;

      default:
        exportData.push({
          'Slide Title': slideTitle,
          'Slide Type': slide.type,
          'Total Responses': slideResponses.length
        });
        exportData.push({}); // Empty row separator
    }
  }

  if (format === 'csv') {
    // Convert to CSV
    if (exportData.length === 0) {
      throw new AppError('No data to export', 400, 'VALIDATION_ERROR');
    }
    const headers = Object.keys(exportData[0] || {});
    const csvRows = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=presentation-results-${presentation.title.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } else if (format === 'excel') {
    // Convert to Excel
    if (exportData.length === 0) {
      throw new AppError('No data to export', 400, 'VALIDATION_ERROR');
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=presentation-results-${presentation.title.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.xlsx`);
    return res.send(excelBuffer);
  }
});

/**
 * Update presentation
 * @route PUT /api/presentations/:id
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @param {string} req.body.title - New title (optional)
 * @param {boolean} req.body.showResults - Show results setting (optional)
 * @returns {Object} Updated presentation object
 */
const updatePresentation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const { title, showResults } = req.body;

  const presentation = await Presentation.findOne({ _id: id, userId });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (title !== undefined) presentation.title = title.trim();
  if (showResults !== undefined) presentation.showResults = showResults;

  await presentation.save();

  res.status(200).json({
    success: true,
    message: 'Presentation updated successfully',
    presentation: {
      id: presentation._id,
      title: presentation.title,
      accessCode: presentation.accessCode,
      isLive: presentation.isLive,
      currentSlideIndex: presentation.currentSlideIndex,
      showResults: presentation.showResults,
      updatedAt: presentation.updatedAt
    }
  });
});

/**
 * Delete presentation and all related data
 * @route DELETE /api/presentations/:id
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @returns {Object} Success message
 */
const deletePresentation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;

  const presentation = await Presentation.findOne({ _id: id, userId });

  if (!presentation) {
    throw new AppError('Presentation not found or you do not have permission to delete it', 404, 'RESOURCE_NOT_FOUND');
  }

  await Response.deleteMany({ presentationId: id });
  await Slide.deleteMany({ presentationId: id });
  await Presentation.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: 'Presentation and all related data deleted successfully'
  });
});

/**
 * Create leaderboard slide for a quiz
 * @route POST /api/presentations/:presentationId/slides/:slideId/leaderboard
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {string} req.params.slideId - Quiz slide ID
 * @returns {Object} Created leaderboard slide
 */
const createLeaderboardForQuiz = asyncHandler(async (req, res, next) => {
  const { presentationId, slideId } = req.params;
  const userId = req.userId;

  const presentation = await Presentation.findOne({
    _id: presentationId,
    userId
  });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const quizSlide = await Slide.findOne({
    _id: slideId,
    presentationId,
    type: 'quiz'
  });

  if (!quizSlide) {
    throw new AppError('Quiz slide not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const leaderboard = await leaderboardService.createLeaderboardSlide({
    presentationId,
    quizSlideId: slideId,
    quizSlideOrder: quizSlide.order
  });

  res.status(201).json({
    success: true,
    message: 'Leaderboard created successfully',
    leaderboard
  });
});

/**
 * Get leaderboard for presentation
 */
const buildLeaderboardSummary = async ({ presentationId, limit = 10 }) => {
  const quizSlides = await Slide.find({ presentationId, type: 'quiz' })
    .select('_id question order')
    .sort({ order: 1 })
    .lean();

  const { leaderboardsBySlide, finalLeaderboard } = await quizScoringService.getCumulativeLeaderboards(
    presentationId,
    quizSlides,
    limit
  );

  const perQuizLeaderboards = quizSlides.map((quiz) => {
    const board = leaderboardsBySlide[quiz._id.toString()] || [];
    return {
      quizSlideId: quiz._id.toString(),
      leaderboard: board
    };
  });

  return {
    perQuizLeaderboards,
    finalLeaderboard
  };
};

/**
 * Get leaderboard for presentation
 * @route GET /api/presentations/:presentationId/leaderboard
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {number} req.query.limit - Limit for leaderboard entries (default: 10)
 * @returns {Object} Leaderboard data
 */
const getLeaderboard = asyncHandler(async (req, res, next) => {
  const { presentationId } = req.params;
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 10;

  const presentation = await Presentation.findOne({
    _id: presentationId,
    userId
  });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const { perQuizLeaderboards, finalLeaderboard } = await buildLeaderboardSummary({
    presentationId,
    limit,
  });

  res.status(200).json({
    success: true,
    finalLeaderboard,
    perQuizLeaderboards,
  });
});

/**
 * Generate leaderboard slides for all quizzes with responses
 * @route POST /api/presentations/:presentationId/leaderboards/generate
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @returns {Object} Created leaderboard slides
 */
const generateLeaderboards = asyncHandler(async (req, res, next) => {
  const { presentationId } = req.params;
  const userId = req.userId;

  const presentation = await Presentation.findOne({
    _id: presentationId,
    userId
  });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const leaderboards = await leaderboardService.createLeaderboardsForPresentation(presentationId);

  res.status(200).json({
    success: true,
    message: `Created ${leaderboards.length} leaderboard slide(s)`,
    leaderboards
  });
});

/**
 * Toggle QnA question status (answered/unanswered)
 * @route PUT /api/presentations/:presentationId/questions/:questionId/status
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {string} req.params.questionId - Question/Response ID
 * @param {boolean} req.body.isAnswered - Answered status
 * @returns {Object} Updated question status
 */
const toggleQnaStatus = asyncHandler(async (req, res, next) => {
  const { presentationId, questionId } = req.params;
  const { isAnswered } = req.body;
  const userId = req.userId;

  const presentation = await Presentation.findOne({ _id: presentationId, userId });
  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const response = await Response.findOneAndUpdate(
    { _id: questionId, presentationId },
    { $set: { isAnswered } },
    { new: true }
  );

  if (!response) {
    throw new AppError('Question not found', 404, 'RESOURCE_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    question: {
      id: response._id,
      isAnswered: response.isAnswered
    }
  });
});

/**
 * Get all responses for a specific slide
 * @route GET /api/presentations/:presentationId/slides/:slideId/responses
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {string} req.params.slideId - Slide ID
 * @returns {Object} Array of responses with aggregated data
 */
const getSlideResponses = asyncHandler(async (req, res, next) => {
  const { presentationId, slideId } = req.params;
  const userId = req.userId;

  // Check if slideId is a valid MongoDB ObjectId (not a temporary ID)
  if (!slideId || slideId.startsWith('temp-') || !/^[0-9a-fA-F]{24}$/.test(slideId)) {
    throw new AppError('Invalid slide ID', 400, 'VALIDATION_ERROR');
  }

  // Verify presentation belongs to user
  const presentation = await Presentation.findOne({ _id: presentationId, userId });
  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Verify slide belongs to presentation
  const slide = await Slide.findOne({ _id: slideId, presentationId });
  if (!slide) {
    throw new AppError('Slide not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Get all responses for this slide
  const responses = await Response.find({ slideId }).sort({ createdAt: 1 }).lean();

  // Build aggregated data using the same logic as socket handlers
  const { getHandler } = require('../interactions');
  const handler = getHandler(slide.type);
  let aggregatedData = { totalResponses: responses.length };

  if (handler && typeof handler.buildResults === 'function') {
    const openEndedSettings = slide.openEndedSettings && typeof slide.openEndedSettings.toObject === 'function'
      ? slide.openEndedSettings.toObject()
      : (slide.openEndedSettings || {});
    const qnaSettings = slide.qnaSettings && typeof slide.qnaSettings.toObject === 'function'
      ? slide.qnaSettings.toObject()
      : (slide.qnaSettings || {});

    aggregatedData = {
      ...aggregatedData,
      ...handler.buildResults(slide, responses, {
        openEndedSettings,
        qnaSettings
      })
    };
  }

  // For QnA slides, get questions from session
  if (slide.type === 'qna') {
    const { getState: getQnaState } = require('../services/qnaSession');
    const qnaState = getQnaState(slideId);
    if (qnaState) {
      aggregatedData.questions = qnaState.questions || [];
    }
  }

  // For leaderboard slides, fetch leaderboard data
  if (slide.type === 'leaderboard') {
    try {
      const leaderboardData = await buildLeaderboardSummary({
        presentationId,
        limit: slide.leaderboardSettings?.displayCount || 10
      });

      // If it's a linked leaderboard, filter for that
      if (slide.leaderboardSettings?.linkedQuizSlideId) {
        const linkedId = slide.leaderboardSettings.linkedQuizSlideId.toString();
        const specificBoard = leaderboardData.perQuizLeaderboards.find(b => b.quizSlideId === linkedId);
        aggregatedData.leaderboard = specificBoard ? specificBoard.leaderboard : [];
      } else {
        aggregatedData.leaderboard = leaderboardData.finalLeaderboard || [];
      }
      aggregatedData.totalResponses = aggregatedData.leaderboard.length;
    } catch (err) {
      Logger.error('Error building leaderboard for export', err);
      aggregatedData.leaderboard = [];
      aggregatedData.totalResponses = 0;
    }
  }

  res.status(200).json({
    success: true,
    slide: {
      id: slide._id,
      type: slide.type,
      question: slide.question,
      options: slide.options,
      statements: slide.statements,
      rankingItems: slide.rankingItems,
      hundredPointsItems: slide.hundredPointsItems,
      gridItems: slide.gridItems,
      quizSettings: slide.quizSettings,
      guessNumberSettings: slide.guessNumberSettings,
      qnaSettings: slide.qnaSettings,
      openEndedSettings: slide.openEndedSettings,
      pinOnImageSettings: slide.pinOnImageSettings,
      leaderboardSettings: slide.leaderboardSettings,
      minValue: slide.minValue,
      maxValue: slide.maxValue,
      minLabel: slide.minLabel,
      maxLabel: slide.maxLabel,
      gridAxisXLabel: slide.gridAxisXLabel,
      gridAxisYLabel: slide.gridAxisYLabel,
      gridAxisRange: slide.gridAxisRange,
      maxWordsPerParticipant: slide.maxWordsPerParticipant,
      instructionContent: slide.instructionContent,
      content: slide.content
    },
    responses: responses.map(r => ({
      id: r._id,
      participantId: r.participantId,
      participantName: r.participantName,
      answer: r.answer,
      votes: r.votes,
      isCorrect: r.isCorrect,
      responseTime: r.responseTime,
      createdAt: r.createdAt
    })),
    aggregatedData
  });
});

/**
 * Clear all results for a presentation (responses, scores, sessions)
 * @route DELETE /api/presentations/:id/results
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @returns {Object} Success message
 */
const clearPresentationResults = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const isInstitutionAdmin = req.institutionAdmin;
  const institutionId = req.institution?.id || req.institution?._id;

  // First check if presentation exists at all
  const presentationExists = await Presentation.findById(id).lean();
  
  if (!presentationExists) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if it belongs to the user
  let presentation = await Presentation.findOne({ _id: id, userId }).lean();

  // If not found and user is an institution admin, check if presentation belongs to any institution user
  if (!presentation && isInstitutionAdmin && institutionId) {
    const mongoose = require('mongoose');
    const institutionObjectId = mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId;
    
    const institutionUsers = await User.find({ 
      institutionId: institutionObjectId,
      isInstitutionUser: true 
    }).select('_id institutionId').lean();
    
    const adminEmail = req.institution?.adminEmail;
    let adminUser = null;
    if (adminEmail) {
      adminUser = await User.findOne({ 
        email: adminEmail.toLowerCase(),
        institutionId: institutionObjectId
      }).select('_id institutionId').lean();
      
      if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
        const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
        if (!adminInList) {
          institutionUsers.push(adminUser);
        }
      }
    }
    
    const institutionUserIds = institutionUsers
      .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
      .map(u => u._id.toString());
    
    const presentationCreator = await User.findById(presentationExists.userId).select('institutionId').lean();
    
    const presentationUserIdStr = presentationExists.userId.toString();
    const belongsToInstitutionUser = institutionUserIds.includes(presentationUserIdStr);
    const creatorBelongsToInstitution = presentationCreator && 
      presentationCreator.institutionId && 
      presentationCreator.institutionId.toString() === institutionId.toString();
    
    if (belongsToInstitutionUser || creatorBelongsToInstitution) {
      presentation = presentationExists;
    }
  }

  if (!presentation) {
    throw new AppError('Presentation not found or access denied', 404, 'RESOURCE_NOT_FOUND');
  }

  // Get all slides for this presentation
  const slides = await Slide.find({ presentationId: id });
  const slideIds = slides.map(slide => slide._id.toString());

  // Delete all responses for this presentation
  await Response.deleteMany({ presentationId: id });

  // Clear quiz participant scores
  await quizScoringService.clearPresentationScores(id);

  // Clear all session data for all slides in this presentation
  qnaSession.clearAllSessionsForPresentation(id, slideIds);
  quizSessionService.clearAllSessions(slideIds);
  guessNumberSession.clearAllSessionsForPresentation(id, slideIds);

  res.status(200).json({
    success: true,
    message: 'All presentation results cleared successfully'
  });
});

/**
 * Recalculate and fix scores for existing quiz results
 * This ensures incorrect answers have 0 points
 * @route POST /api/presentations/:id/recalculate-scores
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @returns {Object} Success message with count of fixed participants
 */
const recalculatePresentationScores = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const isInstitutionAdmin = req.institutionAdmin;
  const institutionId = req.institution?.id || req.institution?._id;

  // First check if presentation exists at all
  const presentationExists = await Presentation.findById(id).lean();
  
  if (!presentationExists) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if it belongs to the user
  let presentation = await Presentation.findOne({ _id: id, userId }).lean();

  // If not found and user is an institution admin, check if presentation belongs to any institution user
  if (!presentation && isInstitutionAdmin && institutionId) {
    const mongoose = require('mongoose');
    const institutionObjectId = mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId;
    
    const institutionUsers = await User.find({ 
      institutionId: institutionObjectId,
      isInstitutionUser: true 
    }).select('_id institutionId').lean();
    
    const adminEmail = req.institution?.adminEmail;
    let adminUser = null;
    if (adminEmail) {
      adminUser = await User.findOne({ 
        email: adminEmail.toLowerCase(),
        institutionId: institutionObjectId
      }).select('_id institutionId').lean();
      
      if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
        const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
        if (!adminInList) {
          institutionUsers.push(adminUser);
        }
      }
    }
    
    const institutionUserIds = institutionUsers
      .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
      .map(u => u._id.toString());
    
    const presentationCreator = await User.findById(presentationExists.userId).select('institutionId').lean();
    
    const presentationUserIdStr = presentationExists.userId.toString();
    const belongsToInstitutionUser = institutionUserIds.includes(presentationUserIdStr);
    const creatorBelongsToInstitution = presentationCreator && 
      presentationCreator.institutionId && 
      presentationCreator.institutionId.toString() === institutionId.toString();
    
    if (belongsToInstitutionUser || creatorBelongsToInstitution) {
      presentation = presentationExists;
    }
  }

  if (!presentation) {
    throw new AppError('Presentation not found or access denied', 404, 'RESOURCE_NOT_FOUND');
  }

  // Recalculate scores using the service
  const result = await quizScoringService.recalculatePresentationScores(id);

  // Also fix Response model scores
  const Response = require('../models/Response');
  const responses = await Response.find({ 
    presentationId: id,
    isCorrect: false,
    score: { $ne: 0 }
  });

  let fixedResponses = 0;
  for (const response of responses) {
    response.score = 0;
    await response.save();
    fixedResponses++;
  }

  res.status(200).json({
    success: true,
    message: `Scores recalculated successfully. Fixed ${result.fixedCount} participant(s) and ${fixedResponses} response(s).`,
    fixedCount: result.fixedCount,
    fixedResponses
  });
});

/**
 * Clear results for a specific slide
 * @route DELETE /api/presentations/:presentationId/slides/:slideId/results
 * @access Private
 * @param {string} req.params.presentationId - Presentation ID
 * @param {string} req.params.slideId - Slide ID
 * @returns {Object} Success message
 */
const clearSlideResults = asyncHandler(async (req, res, next) => {
  const { presentationId, slideId } = req.params;
  const userId = req.userId;
  const isInstitutionAdmin = req.institutionAdmin;
  const institutionId = req.institution?.id || req.institution?._id;

  // First check if presentation exists
  const presentationExists = await Presentation.findById(presentationId).lean();
  
  if (!presentationExists) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if it belongs to the user
  let presentation = await Presentation.findOne({ _id: presentationId, userId }).lean();

  // If not found and user is an institution admin, check if presentation belongs to any institution user
  if (!presentation && isInstitutionAdmin && institutionId) {
    const mongoose = require('mongoose');
    const institutionObjectId = mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId;
    
    const institutionUsers = await User.find({ 
      institutionId: institutionObjectId,
      isInstitutionUser: true 
    }).select('_id institutionId').lean();
    
    const adminEmail = req.institution?.adminEmail;
    let adminUser = null;
    if (adminEmail) {
      adminUser = await User.findOne({ 
        email: adminEmail.toLowerCase(),
        institutionId: institutionObjectId
      }).select('_id institutionId').lean();
      
      if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
        const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
        if (!adminInList) {
          institutionUsers.push(adminUser);
        }
      }
    }
    
    const institutionUserIds = institutionUsers
      .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
      .map(u => u._id.toString());
    
    const presentationCreator = await User.findById(presentationExists.userId).select('institutionId').lean();
    
    const presentationUserIdStr = presentationExists.userId.toString();
    const belongsToInstitutionUser = institutionUserIds.includes(presentationUserIdStr);
    const creatorBelongsToInstitution = presentationCreator && 
      presentationCreator.institutionId && 
      presentationCreator.institutionId.toString() === institutionId.toString();
    
    if (belongsToInstitutionUser || creatorBelongsToInstitution) {
      presentation = presentationExists;
    }
  }

  if (!presentation) {
    throw new AppError('Presentation not found or access denied', 404, 'RESOURCE_NOT_FOUND');
  }

  // Check if slide exists and belongs to this presentation
  const slide = await Slide.findOne({ _id: slideId, presentationId });
  if (!slide) {
    throw new AppError('Slide not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Delete all responses for this slide
  await Response.deleteMany({ slideId: slide._id });

  // Clear session data for this specific slide
  qnaSession.clearSession(slide._id.toString());
  quizSessionService.clearSession(slide._id.toString());
  guessNumberSession.clearSession(slide._id.toString());

  // Get socket.io instance to emit events
  const io = req.app.get('io');

  // If this is a quiz slide, clear participant scores for this slide
  // This will also affect any leaderboard slides linked to this quiz
  if (slide.type === 'quiz') {
    await quizScoringService.clearSlideScores(presentationId, slide._id.toString());

    if (io) {
      // Find all leaderboard slides linked to this quiz slide
      const linkedLeaderboardSlides = await Slide.find({
        presentationId,
        type: 'leaderboard',
        'leaderboardSettings.linkedQuizSlideId': slide._id
      });

      // Emit events to update linked leaderboard slides
      for (const leaderboardSlide of linkedLeaderboardSlides) {
        // Get updated leaderboard data
        try {
          const leaderboardData = await buildLeaderboardSummary({
            presentationId,
            limit: leaderboardSlide.leaderboardSettings?.displayCount || 10
          });

          const linkedId = slide._id.toString();
          const specificBoard = leaderboardData.perQuizLeaderboards.find(
            b => b.quizSlideId === linkedId
          );

          // Emit updated leaderboard data to clients (using leaderboard-data format that frontend expects)
          io.to(`presentation-${presentationId}`).emit('leaderboard-data', {
            presentationId,
            slideId: leaderboardSlide._id.toString(),
            leaderboard: specificBoard ? specificBoard.leaderboard : [],
            quizSlideId: linkedId
          });
        } catch (err) {
          Logger.error('Error building leaderboard after clearing quiz slide', err);
        }
      }
    }
  }

  // Emit slide-results-cleared event for all clients (for all slide types)
  if (io) {
    io.to(`presentation-${presentationId}`).emit('slide-results-cleared', {
      slideId: slide._id.toString(),
      slideType: slide.type
    });
  }

  res.status(200).json({
    success: true,
    message: 'Slide results cleared successfully'
  });
});

module.exports = {
  createPresentation,
  getUserPresentations,
  getPresentationById,
  getPresentationResultById,
  exportPresentationResults,
  updatePresentation,
  deletePresentation,
  createSlide,
  updateSlide,
  deleteSlide,
  recalculatePresentationScores,
  createLeaderboardForQuiz,
  getLeaderboard,
  generateLeaderboards,
  toggleQnaStatus,
  getSlideResponses,
  clearPresentationResults,
  clearSlideResults
};
