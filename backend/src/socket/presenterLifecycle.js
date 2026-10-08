/**
 * Presenter lifecycle socket handlers: starting a presentation, changing
 * slides, ending it, and removing a participant. Split out of the former
 * socketHandlers.js monolith; see CODE_STANDARDS.md.
 */
const jwt = require('jsonwebtoken');
const Presentation = require('../models/Presentation');
const Slide = require('../models/Slide');
const Response = require('../models/Response');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Logger = require('../utils/logger');
const { initializeSession: initializeQnaSession, updateSettings: updateQnaSettings } = require('../services/qnaSession');
const { isInstitutionSubscriptionActive } = require('../services/institutionPlanService');
const {
  activePresentations,
  isAuthorizedPresenter,
  buildSlidePayload,
  buildResultsPayload,
  emitQnaState
} = require('./_sharedHelpers');

function attachPresenterLifecycleHandlers(io, socket) {
  // Handle user authentication and join user-specific room for plan updates
  socket.on('authenticate-user', ({ userId }) => {
    if (userId) {
      socket.join(`user-${userId}`);
      Logger.debug(`User ${userId} joined their notification room`);
    }
  });

  // Presenter starts presentation
  // Presenter starts presentation
  socket.on('start-presentation', async ({ presentationId, userId, startIndex, token }) => {
    try {
      let actualUserId = userId;
      let presentation = null;

      // Handle institution admin authentication
      if (userId === 'institution-admin' && token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          if (decoded.institutionAdmin && decoded.institutionId) {
            const institution = await Institution.findById(decoded.institutionId);
            
            if (institution) {
              if (!institution.isActive || !isInstitutionSubscriptionActive(institution)) {
                socket.emit('error', { message: 'Institution access is disabled' });
                return;
              }

              // Find or create user record for institution admin
              const adminEmail = institution.adminEmail?.toLowerCase().trim();
              let adminUser = await User.findOne({ email: adminEmail });
              
              if (!adminUser) {
                try {
                  adminUser = new User({
                    email: adminEmail,
                    displayName: institution.adminName || adminEmail.split('@')[0],
                    isInstitutionUser: true,
                    institutionId: institution._id,
                    subscription: {
                      plan: 'institution',
                      status: 'active'
                    }
                  });
                  await adminUser.save();
                } catch (saveError) {
                  if (saveError.code === 11000) {
                    adminUser = await User.findOne({ email: adminEmail });
                  }
                  if (!adminUser) {
                    throw new Error('Failed to create admin user');
                  }
                }
              }
              
              actualUserId = adminUser._id;
              
              // Find presentation - check if it belongs to admin user or any institution user
              presentation = await Presentation.findOne({ _id: presentationId, userId: actualUserId });
              
              // If not found, check if it belongs to any institution user
              if (!presentation) {
                const institutionUsers = await User.find({ 
                  institutionId: institution._id,
                  isInstitutionUser: true 
                }).select('_id').lean();
                
                const institutionUserIds = institutionUsers.map(u => u._id);
                presentation = await Presentation.findOne({ 
                  _id: presentationId, 
                  userId: { $in: institutionUserIds }
                });
              }
            }
          }
        } catch (tokenError) {
          Logger.error('Institution admin token verification failed', tokenError);
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }
      } else {
        // Regular user authentication
        const requestingUser = await User.findById(actualUserId).select('isInstitutionUser institutionId').lean();
        if (requestingUser?.isInstitutionUser && requestingUser.institutionId) {
          const institution = await Institution.findById(requestingUser.institutionId);
          if (!institution || !institution.isActive || !isInstitutionSubscriptionActive(institution)) {
            socket.emit('error', { message: 'Institution access is disabled' });
            return;
          }
        }
        presentation = await Presentation.findOne({ _id: presentationId, userId: actualUserId });
      }

      if (!presentation) {
        socket.emit('error', { message: 'Presentation not found' });
        return;
      }

      const slides = await Slide.find({ presentationId }).sort({ order: 1 });

      if (!slides.length) {
        socket.emit('error', { message: 'No slides available to present' });
        return;
      }

      let sanitizedIndex = parseInt(startIndex, 10);
      if (Number.isNaN(sanitizedIndex)) {
        sanitizedIndex = 0;
      }

      if (sanitizedIndex < 0 || sanitizedIndex >= slides.length) {
        sanitizedIndex = 0;
      }

      // Update presentation to live
      presentation.isLive = true;
      presentation.currentSlideIndex = sanitizedIndex;
      await presentation.save();
      // Join presentation room
      socket.join(`presentation-${presentationId}`);
      socket.join(`presenter-${presentationId}`);

      // Store presenter socket
      const presentationKey = presentation._id.toString();
      let activePresentationEntry = activePresentations.get(presentationKey);

      if (!activePresentationEntry) {
        activePresentationEntry = {
          presenterSocket: socket.id,
          participants: new Map(),
          hasEverBeenLive: true
        };
        activePresentations.set(presentationKey, activePresentationEntry);
      } else {
        activePresentationEntry.presenterSocket = socket.id;
        activePresentationEntry.hasEverBeenLive = true;
        if (!activePresentationEntry.participants) {
          activePresentationEntry.participants = new Map();
        }
      }

      const roomName = `presentation-${presentationId}`;
      const presentationRoom = io.sockets.adapter.rooms.get(roomName);
      const updatedParticipants = new Map();

      if (presentationRoom) {
        presentationRoom.forEach(socketId => {
          if (socketId !== socket.id && activePresentationEntry.participants.has(socketId)) {
            // Preserve existing participant names when rebuilding the map
            updatedParticipants.set(socketId, activePresentationEntry.participants.get(socketId));
          }
        });
      }

      activePresentationEntry.participants = updatedParticipants;

      const participantCount = activePresentationEntry.participants.size;

      const currentSlide = slides[sanitizedIndex];

      socket.emit('presentation-started', {
        presentation: {
          id: presentation._id,
          title: presentation.title,
          accessCode: presentation.accessCode,
          isLive: presentation.isLive,
          currentSlideIndex: presentation.currentSlideIndex,
          theme: presentation.theme
        },
        slides: slides.map(s => ({
          id: s._id,
          type: s.type,
          question: s.question,
          options: s.options,
          minValue: s.minValue,
          maxValue: s.maxValue,
          minLabel: s.minLabel,
          maxLabel: s.maxLabel,
          statements: s.statements,
          rankingItems: s.rankingItems,
          gridItems: s.gridItems,
          gridAxisXLabel: s.gridAxisXLabel,
          gridAxisYLabel: s.gridAxisYLabel,
          gridAxisRange: s.gridAxisRange,
          maxWordsPerParticipant: s.maxWordsPerParticipant,
          openEndedSettings: s.openEndedSettings && typeof s.openEndedSettings.toObject === 'function'
            ? s.openEndedSettings.toObject()
            : (s.openEndedSettings || {}),
          qnaSettings: s.qnaSettings && typeof s.qnaSettings.toObject === 'function'
            ? s.qnaSettings.toObject()
            : (s.qnaSettings || {}),
          guessNumberSettings: s.type === 'guess_number'
            ? (s.guessNumberSettings && typeof s.guessNumberSettings.toObject === 'function'
                ? s.guessNumberSettings.toObject()
                : (s.guessNumberSettings || { minValue: 1, maxValue: 10, correctAnswer: 5 }))
            : undefined,
          pinOnImageSettings: s.pinOnImageSettings && typeof s.pinOnImageSettings.toObject === 'function'
            ? s.pinOnImageSettings.toObject()
            : (s.pinOnImageSettings || null),
          quizSettings: s.quizSettings && typeof s.quizSettings.toObject === 'function'
            ? s.quizSettings.toObject()
            : (s.quizSettings || null),
          leaderboardSettings: s.leaderboardSettings && typeof s.leaderboardSettings.toObject === 'function'
            ? s.leaderboardSettings.toObject()
            : (s.leaderboardSettings || null),
          compareSettings: s.compareSettings && typeof s.compareSettings.toObject === 'function'
            ? s.compareSettings.toObject()
            : (s.compareSettings || null),
          // Fields for text, image, and video slide types
          textContent: s.textContent,
          imageUrl: s.imageUrl,
          imagePublicId: s.imagePublicId,
          videoUrl: s.videoUrl,
          videoPublicId: s.videoPublicId,
          instructionContent: s.instructionContent,
          // Fields for "Bring Your Slides In" slide types
          miroUrl: s.miroUrl,
          powerpointUrl: s.powerpointUrl,
          powerpointPublicId: s.powerpointPublicId,
          powerpointPages: s.powerpointPages,
          googleSlidesUrl: s.googleSlidesUrl,
          pdfUrl: s.pdfUrl,
          pdfPublicId: s.pdfPublicId,
          pdfPages: s.pdfPages
        })),
        participantCount
      });

      // Replay any join requests still waiting for a decision (e.g. the
      // presenter refreshed the page while requests had piled up).
      if (activePresentationEntry.pendingParticipants?.size > 0) {
        socket.emit('join-requests-snapshot', {
          requests: Array.from(activePresentationEntry.pendingParticipants.entries()).map(
            ([participantId, info]) => ({ participantId, participantName: info.participantName })
          )
        });
      }

      // Initialize and broadcast existing results for the current slide
      if (currentSlide) {
        if (currentSlide.type === 'qna') {
          initializeQnaSession({
            slideId: currentSlide._id,
            allowMultiple: Boolean(currentSlide.qnaSettings?.allowMultiple)
          });
        }
        const responses = await Response.find({ slideId: currentSlide._id });
        const results = buildResultsPayload(currentSlide, responses);

        const participantPayload = {
          presentation: {
            id: presentation._id,
            title: presentation.title,
            accessCode: presentation.accessCode,
            currentSlideIndex: presentation.currentSlideIndex,
            theme: presentation.theme
          },
          slide: buildSlidePayload(currentSlide),
          slideId: currentSlide._id,
          ...results
        };

        io.to(`presentation-${presentationId}`).emit('presentation-live', participantPayload);

        io.to(`presentation-${presentationId}`).emit('response-updated', {
          slideId: currentSlide._id.toString(),
          ...results
        });

        if (currentSlide.type === 'qna') {
          await emitQnaState({ io, presentationId, slideId: currentSlide._id });
        }
      }

      Logger.debug(`Presentation ${presentationId} started`);
    } catch (error) {
      Logger.error('Start presentation error', error);
      socket.emit('error', { message: 'Failed to start presentation' });
    }
  });

  // Presenter changes slide
  socket.on('change-slide', async ({ presentationId, slideIndex, showFinalLeaderboard }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can change slides' });
        return;
      }

      const presentation = await Presentation.findById(presentationId);

      if (!presentation) {
        socket.emit('error', { message: 'Presentation not found' });
        return;
      }

      // Handle virtual final leaderboard
      if (showFinalLeaderboard) {
        // Get all slides to check if there are quiz slides
        const slides = await Slide.find({ presentationId }).sort({ order: 1 });
        const hasQuizSlides = slides.some(s => s.type === 'quiz');
        const hasFinalLeaderboard = slides.some(s => 
          s.type === 'leaderboard' && !s.leaderboardSettings?.linkedQuizSlideId
        );

        // Only show virtual final leaderboard if there are quiz slides but no final leaderboard
        if (hasQuizSlides && !hasFinalLeaderboard) {
          // Create virtual final leaderboard slide payload
          const virtualFinalLeaderboard = {
            id: 'virtual-final-leaderboard',
            _id: 'virtual-final-leaderboard',
            type: 'leaderboard',
            question: 'Final Leaderboard',
            leaderboardSettings: {
              linkedQuizSlideId: null,
              isAutoGenerated: false,
              displayCount: 10,
              isFinalLeaderboard: true
            }
          };

          const payload = {
            slide: virtualFinalLeaderboard,
            slideIndex: slides.length, // Use slides.length to indicate it's after the last slide
            isVirtualFinalLeaderboard: true
          };

          // Update presentation currentSlideIndex to the last slide for consistency
          presentation.currentSlideIndex = slides.length > 0 ? slides.length - 1 : 0;
          await presentation.save();

          io.to(`presentation-${presentationId}`).emit('slide-changed', payload);
          return;
        }
      }

      const parsedSlideIndex = Number(slideIndex);
      if (!Number.isInteger(parsedSlideIndex)) {
        socket.emit('error', { message: 'Invalid slide index' });
        return;
      }

      const slides = await Slide.find({ presentationId }).sort({ order: 1 });
      if (parsedSlideIndex < 0 || parsedSlideIndex >= slides.length) {
        socket.emit('error', { message: 'Invalid slide index' });
        return;
      }

      const currentSlide = slides[parsedSlideIndex];
      if (!currentSlide) {
        socket.emit('error', { message: 'Slide no longer exists' });
        return;
      }

      // Update current slide index only after validating against the real slide collection.
      presentation.currentSlideIndex = parsedSlideIndex;
      await presentation.save();

      if (currentSlide) {
        if (currentSlide.type === 'qna') {
          initializeQnaSession({
            slideId: currentSlide._id,
            allowMultiple: Boolean(currentSlide.qnaSettings?.allowMultiple)
          });
        }
        // Get current responses for this slide
        const responses = await Response.find({ slideId: currentSlide._id });

        if (currentSlide.type === 'qna') {
          updateQnaSettings({
            slideId: currentSlide._id,
            allowMultiple: Boolean(currentSlide.qnaSettings?.allowMultiple)
          });
        }

        const payload = {
          slide: buildSlidePayload(currentSlide),
          slideIndex: parsedSlideIndex,
          ...buildResultsPayload(currentSlide, responses)
        };

        io.to(`presentation-${presentationId}`).emit('slide-changed', payload);

        if (currentSlide.type === 'qna') {
          await emitQnaState({ io, presentationId, slideId: currentSlide._id });
        }
      }
    } catch (error) {
      Logger.error('Change slide error', error);
      socket.emit('error', { message: 'Failed to change slide' });
    }
  });

  // Presenter ends presentation
  socket.on('end-presentation', async ({ presentationId }) => {
    try {
      if (!isAuthorizedPresenter(presentationId, socket.id)) {
        socket.emit('error', { message: 'Only the presenter can end this presentation' });
        return;
      }

      const presentation = await Presentation.findById(presentationId);

      if (presentation) {
        presentation.isLive = false;
        await presentation.save();

        // Notify all participants
        io.to(`presentation-${presentationId}`).emit('presentation-ended');

        // Clean up
        activePresentations.delete(presentationId);
      }

      Logger.debug(`Presentation ${presentationId} ended`);
    } catch (error) {
      Logger.error('End presentation error', error);
    }
  });

  // Kick participant handler
  // Kick participant handler
  socket.on('kick-participant', ({ presentationId, participantName }) => {
    try {
      const presentationKey = presentationId.toString();
      const activeEntry = activePresentations.get(presentationKey);
      
      if (!activeEntry) {
        socket.emit('error', { message: 'Presentation not found' });
        return;
      }
      
      // Check if the requester is the presenter
      if (activeEntry.presenterSocket !== socket.id) {
        socket.emit('error', { message: 'Only the presenter can kick participants' });
        return;
      }
      
      // Find the participant socket ID by name
      let participantSocketId = null;
      for (const [socketId, name] of activeEntry.participants.entries()) {
        if (name === participantName) {
          participantSocketId = socketId;
          break;
        }
      }
      
      // Check if the participant exists
      if (!participantSocketId) {
        socket.emit('error', { message: 'Participant not found' });
        return;
      }
      
      // Notify the participant that they've been kicked
      io.to(participantSocketId).emit('kicked-by-presenter', {
        message: 'Sorry, you have been kicked out by the presenter'
      });
      
      // Disconnect the participant's socket
      io.sockets.sockets.get(participantSocketId)?.disconnect(true);
      
      // Remove participant from the list
      activeEntry.participants.delete(participantSocketId);
      
      // Update participant count for presenter
      const participantCount = activeEntry.participants.size;
      const participantList = Array.from(activeEntry.participants.values());
      
      // Notify presenter about updated participant count and names
      io.to(`presenter-${presentationKey}`).emit('participant-list-updated', { 
        participantCount,
        participants: participantList
      });
      
      Logger.debug(`Participant ${participantName} (${participantSocketId}) kicked from presentation ${presentationId}`);
    } catch (error) {
      Logger.error('Kick participant error', error);
      socket.emit('error', { message: 'Failed to kick participant' });
    }
  });
}

module.exports = { attachPresenterLifecycleHandlers };
