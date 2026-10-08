/**
 * Presentation Controller - crud
 * Split out of the former presentationController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const Presentation = require('../../models/Presentation');
const Slide = require('../../models/Slide');
const Response = require('../../models/Response');
const User = require('../../models/User');
const quizScoringService = require('../../services/quizScoringService');
const Logger = require('../../utils/logger');
const geminiService = require('../../services/geminiService');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const { isSubscriptionActive } = require('../../services/subscriptionService');
const { THEME_IDS, isPremiumTheme } = require('../../constants/themes');

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
      theme: presentation.theme,
      requireApproval: presentation.requireApproval,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt
    }
  });
});

/**
 * Generate a presentation outline (title + slides) from a text prompt using AI.
 * Does NOT persist anything - the caller (frontend) decides whether to create a
 * new presentation from the result or append the slides to an existing one,
 * going through the normal save flow either way.
 * @route POST /api/presentations/generate-ai
 * @access Private (paid plans only)
 * @param {string} req.body.prompt - What the presentation should be about
 * @param {number} req.body.slideCount - Desired number of slides (3-15)
 * @returns {Object} { title, slides }
 */
const generatePresentationOutline = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const { prompt, slideCount } = req.body;

  if (!geminiService.isGeminiConfigured()) {
    throw new AppError('AI generation is not available right now', 503, 'AI_UNAVAILABLE');
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('A prompt is required', 400, 'VALIDATION_ERROR');
  }
  if (prompt.trim().length > 500) {
    throw new AppError('Prompt is too long (max 500 characters)', 400, 'VALIDATION_ERROR');
  }

  const parsedCount = parseInt(slideCount, 10);
  const count = Number.isFinite(parsedCount) ? Math.min(15, Math.max(3, parsedCount)) : 8;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const hasActiveSubscription = await isSubscriptionActive(user.subscription, user);
  if (!hasActiveSubscription) {
    throw new AppError('Upgrade to a paid plan to generate presentations with AI', 403, 'UPGRADE_REQUIRED');
  }

  const { title, slides } = await geminiService.generatePresentationOutline(prompt.trim(), count);

  res.status(200).json({
    success: true,
    title,
    slides
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
    theme: presentation.theme,
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
        theme: presentation.theme,
        requireApproval: presentation.requireApproval,
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
        compareSettings: slide.compareSettings,
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
        powerpointPages: slide.powerpointPages,
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
 * Update presentation
 * @route PUT /api/presentations/:id
 * @access Private
 * @param {string} req.params.id - Presentation ID
 * @param {string} req.body.title - New title (optional)
 * @param {boolean} req.body.showResults - Show results setting (optional)
 * @param {string} req.body.theme - Theme id (optional, premium themes require an active paid plan)
 * @param {boolean} req.body.requireApproval - Whether participants must be admitted by the presenter before joining (optional)
 * @returns {Object} Updated presentation object
 */
const updatePresentation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const { title, showResults, theme, requireApproval } = req.body;

  const presentation = await Presentation.findOne({ _id: id, userId });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (theme !== undefined) {
    if (!THEME_IDS.includes(theme)) {
      throw new AppError('Invalid theme', 400, 'VALIDATION_ERROR');
    }

    if (isPremiumTheme(theme)) {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const hasActiveSubscription = await isSubscriptionActive(user.subscription, user);
      if (!hasActiveSubscription) {
        throw new AppError('Upgrade to a paid plan to use this theme', 403, 'UPGRADE_REQUIRED');
      }
    }
  }

  if (title !== undefined) presentation.title = title.trim();
  if (showResults !== undefined) presentation.showResults = showResults;
  if (theme !== undefined) presentation.theme = theme;
  if (requireApproval !== undefined) presentation.requireApproval = Boolean(requireApproval);

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
      theme: presentation.theme,
      requireApproval: presentation.requireApproval,
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
  await quizScoringService.clearPresentationScores(id);
  await Presentation.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: 'Presentation and all related data deleted successfully'
  });
});

module.exports = {
  createPresentation,
  generatePresentationOutline,
  getUserPresentations,
  getPresentationById,
  updatePresentation,
  deletePresentation
};
