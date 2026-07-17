const { randomUUID } = require('crypto');
const Presentation = require("../models/Presentation");
const Slide = require("../models/Slide");
const Response = require("../models/Response");
const leaderboardService = require('../services/leaderboardService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

function sanitizeRankingItems(items) {
  if (!Array.isArray(items)) return null;

  const sanitized = items
    .map((item, index) => {
      if (!item) return null;
      const rawLabel = typeof item === 'string' ? item : item.label;
      const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
      if (!label) return null;

      const idSource = typeof item === 'object' && item !== null ? item.id : null;
      const id = typeof idSource === 'string' && idSource.trim() ? idSource.trim() : randomUUID();
      return { id, label };
    })
    .filter(Boolean);

  return sanitized.length ? sanitized : null;
}

function sanitizeHundredPointsItems(items) {
  if (!Array.isArray(items)) return null;

  const sanitized = items
    .map((item) => {
      if (!item) return null;
      const rawLabel = typeof item === 'string' ? item : item.label;
      const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
      if (!label) return null;

      const idSource = typeof item === 'object' && item !== null ? item.id : null;
      const id = typeof idSource === 'string' && idSource.trim() ? idSource.trim() : randomUUID();
      return { id, label };
    })
    .filter(Boolean);

  return sanitized.length ? sanitized : null;
}

async function reorderSlides(presentationId) {
  // Get all slides for this presentation
  const slides = await Slide.find({ presentationId });
  
  // Extract all order values and sort them numerically
  const existingOrders = slides.map(slide => slide.order).filter(order => typeof order === 'number').sort((a, b) => a - b);
  
  // Check if orders are already sequential starting from 0
  let isSequential = true;
  for (let i = 0; i < existingOrders.length; i++) {
    if (existingOrders[i] !== i) {
      isSequential = false;
      break;
    }
  }
  
  // Only reorder if orders are not sequential
  if (!isSequential) {
    // Create a map of old order to new order
    const orderMap = {};
    existingOrders.forEach((order, index) => {
      orderMap[order] = index;
    });
    
    // Update slides with new sequential orders
    await Promise.all(
      slides.map(slide => {
        const newOrder = orderMap[slide.order];
        if (newOrder !== undefined && slide.order !== newOrder) {
          slide.order = newOrder;
          return slide.save();
        }
        return Promise.resolve();
      })
    );
  }
}

/**
 * Create a new slide
 * @route POST /api/presentations/:presentationId/slides
 * @access Private
 */
module.exports.createSlide = asyncHandler(async (req, res, next) => {
  const { presentationId } = req.params;
  const userId = req.userId;
    const {
      type,
      question,
      options,
      minValue,
      maxValue,
      minLabel,
      maxLabel,
      statements,
      rankingItems,
      hundredPointsItems,
      gridItems,
      gridAxisXLabel,
      gridAxisYLabel,
      gridAxisRange,
      maxWordsPerParticipant,
      openEndedSettings,
      qnaSettings,
      guessNumberSettings,
      pinOnImageSettings,
      quizSettings,
      textContent,
      imageUrl,
      imagePublicId,
      videoUrl,
      videoPublicId,
      instructionContent,
      miroUrl,
      powerpointUrl,
      powerpointPublicId,
      googleSlidesUrl,
      pdfUrl,
      pdfPublicId,
      pdfPages,
      order  // Accept order from frontend
    } = req.body;

  const presentation = await Presentation.findOne({ _id: presentationId, userId });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (!type || (!question && type !== 'instruction')) {
    throw new AppError('Slide type and question are required', 400, 'VALIDATION_ERROR');
  }

  if (type === 'instruction') {
    const existingInstructionSlide = await Slide.findOne({ presentationId, type: 'instruction' });
    if (existingInstructionSlide) {
      throw new AppError('Only one instruction slide is allowed per presentation', 400, 'VALIDATION_ERROR');
    }
  }

  if (type === 'leaderboard') {
    throw new AppError('Leaderboard slides are generated automatically for quizzes', 400, 'VALIDATION_ERROR');
  }

  let slideOrder;
  if (typeof order === 'number' && order >= 0) {
    slideOrder = order;
  } else {
    const lastSlide = await Slide.findOne({ presentationId }).sort({ order: -1 });
    slideOrder = lastSlide ? lastSlide.order + 1 : 0;
  }

  let sanitizedRankingItems = null;
  let sanitizedHundredPointsItems = null;
  let sanitizedGridItems = null;

  if (type === 'ranking') {
    sanitizedRankingItems = sanitizeRankingItems(rankingItems);
    if (!sanitizedRankingItems || sanitizedRankingItems.length === 0) {
      throw new AppError('Ranking slides require at least one item with text', 400, 'VALIDATION_ERROR');
    }
  }

  if (type === 'hundred_points') {
    sanitizedHundredPointsItems = sanitizeHundredPointsItems(hundredPointsItems);
    if (!sanitizedHundredPointsItems || sanitizedHundredPointsItems.length < 2) {
      throw new AppError('100 Points slides require at least two items with text', 400, 'VALIDATION_ERROR');
    }
  }

  if (type === '2x2_grid') {
    sanitizedGridItems = sanitizeHundredPointsItems(gridItems);
    if (!sanitizedGridItems || sanitizedGridItems.length < 1) {
      throw new AppError('2x2 Grid slides require at least one item with text', 400, 'VALIDATION_ERROR');
    }
  }

  const slide = new Slide({
      presentationId,
      order: slideOrder,
      type,
      question: type === 'instruction' ? 'Instructions' : question.trim(),
      options: type === 'multiple_choice' ? options : null,
      minValue: type === 'scales' ? minValue : null,
      maxValue: type === 'scales' ? maxValue : null,
      minLabel: type === 'scales' ? minLabel : null,
      maxLabel: type === 'scales' ? maxLabel : null,
      statements: type === 'scales' ? statements : null,
      rankingItems: type === 'ranking' ? sanitizedRankingItems : null,
      hundredPointsItems: type === 'hundred_points' ? sanitizedHundredPointsItems : undefined,
      gridItems: type === '2x2_grid' ? sanitizedGridItems : undefined,
      gridAxisXLabel: type === '2x2_grid' ? (gridAxisXLabel || '') : undefined,
      gridAxisYLabel: type === '2x2_grid' ? (gridAxisYLabel || '') : undefined,
      gridAxisRange: type === '2x2_grid' ? (gridAxisRange || { min: 0, max: 10 }) : undefined,
      maxWordsPerParticipant: type === 'word_cloud' ? (Number(maxWordsPerParticipant) || 1) : undefined,
      openEndedSettings: type === 'open_ended' ? openEndedSettings : undefined,
      qnaSettings: type === 'qna' ? qnaSettings : undefined,
      guessNumberSettings: type === 'guess_number' ? (guessNumberSettings || { minValue: 1, maxValue: 10, correctAnswer: 5 }) : undefined,
      pinOnImageSettings: type === 'pin_on_image' ? pinOnImageSettings : undefined,
      quizSettings: type === 'quiz' ? quizSettings : undefined,
      textContent: type === 'text' ? (textContent || '') : undefined,
      imageUrl: type === 'image' ? (imageUrl || '') : undefined,
      imagePublicId: type === 'image' ? imagePublicId : undefined,
      videoUrl: type === 'video' ? (videoUrl || '') : undefined,
      videoPublicId: type === 'video' ? videoPublicId : undefined,
      instructionContent: type === 'instruction' ? (instructionContent || '') : undefined,
      options: (type === 'multiple_choice' || type === 'pick_answer') ? options : undefined,
      openEndedSettings: (type === 'open_ended' || type === 'type_answer') ? openEndedSettings : undefined,
      miroUrl: type === 'miro' ? (miroUrl || '') : undefined,
      powerpointUrl: type === 'powerpoint' ? (powerpointUrl || '') : undefined,
      powerpointPublicId: type === 'powerpoint' ? powerpointPublicId : undefined,
      googleSlidesUrl: type === 'google_slides' ? (googleSlidesUrl || '') : undefined,
      pdfUrl: type === 'pdf' ? (pdfUrl || '') : undefined,
      pdfPublicId: type === 'pdf' ? pdfPublicId : undefined,
      pdfPages: type === 'pdf' ? (pdfPages || []) : undefined,
  });

  await slide.save();

  let leaderboardSlideResponse = null;
  if (slide.type === 'quiz') {
    const leaderboardSlide = await leaderboardService.createLeaderboardSlide({
      presentationId,
      quizSlideId: slide._id,
      quizSlideOrder: slide.order
    });

    if (leaderboardSlide) {
      await reorderSlides(presentationId);
      leaderboardSlideResponse = {
        id: leaderboardSlide._id,
        order: leaderboardSlide.order,
        type: leaderboardSlide.type,
        question: leaderboardSlide.question,
        leaderboardSettings: leaderboardSlide.leaderboardSettings,
        createdAt: leaderboardSlide.createdAt,
        updatedAt: leaderboardSlide.updatedAt
      };
    }
  }

  const responsePayload = {
    success: true,
    message: 'Slide created successfully',
    slide: {
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
        guessNumberSettings: slide.guessNumberSettings,
        pinOnImageSettings: slide.pinOnImageSettings,
        quizSettings: slide.quizSettings,
        leaderboardSettings: slide.leaderboardSettings,
        textContent: slide.textContent,
        imageUrl: slide.imageUrl,
        imagePublicId: slide.imagePublicId,
        videoUrl: slide.videoUrl,
        videoPublicId: slide.videoPublicId,
        instructionContent: slide.instructionContent,
        miroUrl: slide.miroUrl,
        powerpointUrl: slide.powerpointUrl,
        powerpointPublicId: slide.powerpointPublicId,
        googleSlidesUrl: slide.googleSlidesUrl,
        pdfUrl: slide.pdfUrl,
        pdfPublicId: slide.pdfPublicId,
        pdfPages: slide.pdfPages,
        createdAt: slide.createdAt,
        updatedAt: slide.updatedAt
      }
    };

  if (leaderboardSlideResponse) {
    responsePayload.leaderboardSlide = leaderboardSlideResponse;
  }

  res.status(201).json(responsePayload);
});

/**
 * Update slide
 * @route PUT /api/presentations/:presentationId/slides/:slideId
 * @access Private
 */
module.exports.updateSlide = asyncHandler(async (req, res, next) => {
  const { presentationId, slideId } = req.params;
  const userId = req.userId;
    const {
      question,
      options,
      minValue,
      maxValue,
      minLabel,
      maxLabel,
      statements,
      rankingItems,
      hundredPointsItems,
      gridItems,
      gridAxisXLabel,
      gridAxisYLabel,
      gridAxisRange,
      maxWordsPerParticipant,
      openEndedSettings,
      qnaSettings,
      guessNumberSettings,
      pinOnImageSettings,
      quizSettings,
      textContent,
      imageUrl,
      imagePublicId,
      videoUrl,
      videoPublicId,
      instructionContent,
      miroUrl,
      powerpointUrl,
      powerpointPublicId,
      googleSlidesUrl,
      pdfUrl,
      pdfPublicId,
      pdfPages,
      order  // Add order field
    } = req.body;

  const presentation = await Presentation.findOne({ _id: presentationId, userId });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const slide = await Slide.findOne({ _id: slideId, presentationId });

  if (!slide) {
    throw new AppError('Slide not found', 404, 'RESOURCE_NOT_FOUND');
  }
    if (question !== undefined && slide.type !== 'instruction') slide.question = question.trim();
    if (options !== undefined && (slide.type === 'multiple_choice' || slide.type === 'pick_answer')) slide.options = options;
    if (minValue !== undefined && slide.type === 'scales') slide.minValue = minValue;
    if (maxValue !== undefined && slide.type === 'scales') slide.maxValue = maxValue;
    if (minLabel !== undefined && slide.type === 'scales') slide.minLabel = minLabel;
    if (maxLabel !== undefined && slide.type === 'scales') slide.maxLabel = maxLabel;
    if (statements !== undefined && slide.type === 'scales') slide.statements = statements;
  if (rankingItems !== undefined && slide.type === 'ranking') {
    const sanitized = sanitizeRankingItems(rankingItems);
    if (!sanitized || sanitized.length === 0) {
      throw new AppError('Ranking slides require at least one item with text', 400, 'VALIDATION_ERROR');
    }
    slide.rankingItems = sanitized;
  }
  if (hundredPointsItems !== undefined && slide.type === 'hundred_points') {
    const sanitized = sanitizeHundredPointsItems(hundredPointsItems);
    if (!sanitized || sanitized.length < 2) {
      throw new AppError('100 Points slides require at least two items with text', 400, 'VALIDATION_ERROR');
    }
    slide.hundredPointsItems = sanitized;
  }
  if (gridItems !== undefined && slide.type === '2x2_grid') {
    const sanitized = sanitizeHundredPointsItems(gridItems);
    if (!sanitized || sanitized.length < 1) {
      throw new AppError('2x2 Grid slides require at least one item with text', 400, 'VALIDATION_ERROR');
    }
    slide.gridItems = sanitized;
  }
    if (gridAxisXLabel !== undefined && slide.type === '2x2_grid') {
      slide.gridAxisXLabel = gridAxisXLabel;
    }
    if (gridAxisYLabel !== undefined && slide.type === '2x2_grid') {
      slide.gridAxisYLabel = gridAxisYLabel;
    }
    if (gridAxisRange !== undefined && slide.type === '2x2_grid') {
      slide.gridAxisRange = gridAxisRange;
    }
    if (maxWordsPerParticipant !== undefined && slide.type === 'word_cloud') {
      slide.maxWordsPerParticipant = Number(maxWordsPerParticipant) || 1;
    }
    if (openEndedSettings && (slide.type === 'open_ended' || slide.type === 'type_answer')) {
      const existing = slide.openEndedSettings || {};
      slide.openEndedSettings = {
        isVotingEnabled: openEndedSettings.isVotingEnabled !== undefined ? Boolean(openEndedSettings.isVotingEnabled) : Boolean(existing.isVotingEnabled)
      };
    }
    if (qnaSettings && slide.type === 'qna') {
      const existing = slide.qnaSettings || {};
      slide.qnaSettings = {
        allowMultiple: qnaSettings.allowMultiple !== undefined ? Boolean(qnaSettings.allowMultiple) : Boolean(existing.allowMultiple)
      };
    }
    if (slide.type === 'guess_number') {
      const existing = slide.guessNumberSettings || {};
      slide.guessNumberSettings = {
        minValue: guessNumberSettings?.minValue !== undefined ? Number(guessNumberSettings.minValue) : (existing.minValue || 1),
        maxValue: guessNumberSettings?.maxValue !== undefined ? Number(guessNumberSettings.maxValue) : (existing.maxValue || 10),
        correctAnswer: guessNumberSettings?.correctAnswer !== undefined ? Number(guessNumberSettings.correctAnswer) : (existing.correctAnswer || 5)
      };
    }
    if (slide.type === 'quiz') {
      const existing = slide.quizSettings || {};
      const incomingOptions = Array.isArray(quizSettings?.options)
        ? quizSettings.options
        : Array.isArray(existing.options)
          ? existing.options
          : [];

      const sanitizedOptions = incomingOptions
        .map(option => {
          if (!option) return null;
          const text = typeof option.text === 'string' ? option.text : (typeof option === 'string' ? option : '');
          const id = option.id || (typeof option === 'string' ? randomUUID() : randomUUID());
          return { id, text };
        })
        .filter(Boolean);

      while (sanitizedOptions.length < 2) {
        sanitizedOptions.push({ id: randomUUID(), text: '' });
      }

      const requestedCorrectId = quizSettings?.correctOptionId ?? existing.correctOptionId;
      const hasValidCorrect = sanitizedOptions.some(opt => opt.id === requestedCorrectId);
      const correctOptionId = hasValidCorrect ? requestedCorrectId : '';

      const timeLimit = quizSettings?.timeLimit ?? existing.timeLimit ?? 30;
      const clampedTimeLimit = Math.max(5, Math.min(300, Number(timeLimit) || 30));

      slide.quizSettings = {
        options: sanitizedOptions,
        correctOptionId,
        timeLimit: clampedTimeLimit,
        points: quizSettings?.points ?? existing.points ?? 1000,
      };
    }
    if (pinOnImageSettings && slide.type === 'pin_on_image') {
      slide.pinOnImageSettings = pinOnImageSettings;
    }
    if (textContent !== undefined && slide.type === 'text') {
      slide.textContent = textContent;
    }
    if (imageUrl !== undefined && slide.type === 'image') {
      slide.imageUrl = imageUrl;
    }
    if (imagePublicId !== undefined && slide.type === 'image') {
      slide.imagePublicId = imagePublicId;
    }
    if (videoUrl !== undefined && slide.type === 'video') {
      slide.videoUrl = videoUrl;
    }
    if (videoPublicId !== undefined && slide.type === 'video') {
      slide.videoPublicId = videoPublicId;
    }
    if (instructionContent !== undefined && slide.type === 'instruction') {
      slide.instructionContent = instructionContent;
    }
    if (miroUrl !== undefined && slide.type === 'miro') {
      slide.miroUrl = miroUrl;
    }
    if (powerpointUrl !== undefined && slide.type === 'powerpoint') {
      slide.powerpointUrl = powerpointUrl;
    }
    if (powerpointPublicId !== undefined && slide.type === 'powerpoint') {
      slide.powerpointPublicId = powerpointPublicId;
    }
    if (googleSlidesUrl !== undefined && slide.type === 'google_slides') {
      slide.googleSlidesUrl = googleSlidesUrl;
    }
    if (pdfUrl !== undefined && slide.type === 'pdf') {
      slide.pdfUrl = pdfUrl;
    }
    if (pdfPublicId !== undefined && slide.type === 'pdf') {
      slide.pdfPublicId = pdfPublicId;
    }
    if (pdfPages !== undefined && slide.type === 'pdf') {
      slide.pdfPages = pdfPages;
    }
  if (order !== undefined) {
    slide.order = order;
  }

  await slide.save();

  let updatedLeaderboard = null;
  if (slide.type === 'quiz') {
    updatedLeaderboard = await Slide.findOneAndUpdate(
      {
        presentationId,
        type: 'leaderboard',
        'leaderboardSettings.linkedQuizSlideId': slide._id
      },
      {
        $set: {
          question: 'Quiz Leaderboard',
          updatedAt: new Date()
        }
      },
      { new: true }
    );
  }

  res.status(200).json({
    success: true,
    message: 'Slide updated successfully',
    slide: {
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
        guessNumberSettings: slide.guessNumberSettings,
        pinOnImageSettings: slide.pinOnImageSettings,
        quizSettings: slide.quizSettings,
        leaderboardSettings: slide.leaderboardSettings,
        textContent: slide.textContent,
        imageUrl: slide.imageUrl,
        imagePublicId: slide.imagePublicId,
        videoUrl: slide.videoUrl,
        videoPublicId: slide.videoPublicId,
        instructionContent: slide.instructionContent,
        miroUrl: slide.miroUrl,
        powerpointUrl: slide.powerpointUrl,
        powerpointPublicId: slide.powerpointPublicId,
        googleSlidesUrl: slide.googleSlidesUrl,
        pdfUrl: slide.pdfUrl,
        pdfPublicId: slide.pdfPublicId,
        pdfPages: slide.pdfPages,
        createdAt: slide.createdAt,
      updatedAt: slide.updatedAt
    }
  });
});

/**
 * Delete slide
 * @route DELETE /api/presentations/:presentationId/slides/:slideId
 * @access Private
 */
module.exports.deleteSlide = asyncHandler(async (req, res, next) => {
  const { presentationId, slideId } = req.params;
  const userId = req.userId;

  const presentation = await Presentation.findOne({ _id: presentationId, userId });

  if (!presentation) {
    throw new AppError('Presentation not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const slide = await Slide.findOne({ _id: slideId, presentationId });

  if (!slide) {
    throw new AppError('Slide not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (slide.type === 'leaderboard' && slide.leaderboardSettings?.isAutoGenerated) {
    throw new AppError('Auto-generated leaderboard slides cannot be deleted directly', 400, 'VALIDATION_ERROR');
  }

  let deletedLeaderboard = null;
  if (slide.type === 'quiz') {
    deletedLeaderboard = await Slide.findOneAndDelete({
      presentationId,
      type: 'leaderboard',
      'leaderboardSettings.linkedQuizSlideId': slide._id
    });
  }

  await Response.deleteMany({ slideId });
  await Slide.deleteOne({ _id: slideId });
  await reorderSlides(presentationId);

  res.status(200).json({
    success: true,
    message: 'Slide deleted successfully',
    deletedLeaderboardId: deletedLeaderboard ? deletedLeaderboard._id : null
  });
});