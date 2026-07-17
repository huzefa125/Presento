import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getSocketUrl } from '../../utils/config';
import { X, ChevronLeft, ChevronRight, Users, ArrowLeft, Ban } from 'lucide-react';
import * as presentationService from '../../services/presentationService';
import MCQPresenterResults from '../interactions/mcq/PresenterResults';
import WordCloudPresenterResults from '../interactions/wordCloud/PresenterResults';
import OpenEndedPresenter from '../interactions/openEnded/PresenterView';
import ScalesPresenterView from '../interactions/scales/PresenterView';
import RankingPresenterView from '../interactions/ranking/PresenterView';
import HundredPointsPresenterView from '../interactions/hundredPoints/PresenterView';
import PresenterQnaView from '../interactions/qna/PresenterView';
import PresenterGuessView from '../interactions/guessNumber/PresenterView';
import QuizPresenterResults from '../interactions/quiz/PresenterResults';
import LeaderboardPresenterResults from '../interactions/leaderboard/PresenterResults';
import PickAnswerPresenterView from '../interactions/pickAnswer/presenter/PresenterView';
import TypeAnswerPresenterView from '../interactions/typeAnswer/presenter/PresenterView';
import MiroPresenterView from '../interactions/miro/presenter/PresenterView';
import PowerPointPresenterView from '../interactions/powerpoint/presenter/PresenterView';
import GoogleSlidesPresenterView from '../interactions/googleSlides/presenter/PresenterView';
import PdfPresenterView from '../interactions/pdf/presenter/PresenterView';
import {
  defaultOpenEndedSettings,
  mergeOpenEndedState,
  initializeOpenEndedStateForSlide,
  emitOpenEndedSettingsUpdate,
  isOpenEndedSlide,
} from '../interactions/openEnded/utils';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import TwoByTwoGridPresenterView from '../interactions/twoByTwoGrid/PresenterView';
import PinOnImagePresenterView from '../interactions/pinOnImage/PresenterView';
import InstructionPresenterView from '../interactions/instruction/presenter/PresenterView';
import SlideCanvas from '../presentation/SlideCanvas';

const PresentMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [presentation, setPresentation] = useState(null);
  const [slides, setSlides] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideIndexRef = useRef(0);
  const slidesRef = useRef([]);
  
  // Reorder slides so leaderboards appear right after their linked quiz slides
  const orderedSlides = useMemo(() => {
    if (!slides || slides.length === 0) return [];
    
    // First, ensure slides are sorted by order field (with fallback to index)
    const sortedSlides = [...slides].sort((a, b) => {
      // Use order field if available, otherwise use index as fallback
      const orderA = a.order !== undefined && a.order !== null ? a.order : 999999;
      const orderB = b.order !== undefined && b.order !== null ? b.order : 999999;
      
      // If orders are equal, maintain original array order
      if (orderA === orderB) {
        return 0;
      }
      return orderA - orderB;
    });
    
    // Create a map of quiz slide IDs to their leaderboards
    const quizToLeaderboard = new Map();
    const unlinkedLeaderboards = [];
    
    // Helper function to get all possible ID representations for a slide
    const getAllSlideIds = (slide) => {
      const ids = new Set();
      if (!slide) return ids;
      
      // Try both id and _id fields
      const id1 = slide.id;
      const id2 = slide._id;
      
      if (id1) {
        ids.add(String(id1));
        if (typeof id1 === 'object' && id1.toString) {
          ids.add(id1.toString());
        }
      }
      
      if (id2) {
        ids.add(String(id2));
        if (typeof id2 === 'object' && id2.toString) {
          ids.add(id2.toString());
        }
      }
      
      return ids;
    };
    
    // Build a map of all quiz slide IDs to their slides
    // Use a map that stores all possible ID formats for each quiz
    const quizSlideMap = new Map(); // Map of quiz slide -> all its ID strings
    const quizIdToSlide = new Map(); // Map of any ID string -> quiz slide
    
    sortedSlides.forEach(slide => {
      if (slide.type === 'quiz') {
        const allIds = getAllSlideIds(slide);
        quizSlideMap.set(slide, allIds);
        // Map each ID format to the quiz slide
        allIds.forEach(idStr => {
          quizIdToSlide.set(idStr, slide);
        });
      }
    });
    
    // Map leaderboards to their linked quiz slides
    sortedSlides.forEach(slide => {
      if (slide.type === 'leaderboard') {
        const linkedQuizId = slide.leaderboardSettings?.linkedQuizSlideId;
        if (linkedQuizId) {
          // Try to find matching quiz by comparing all possible ID formats
          const linkedIdStr = String(linkedQuizId);
          const linkedIdStr2 = (linkedQuizId && typeof linkedQuizId === 'object' && linkedQuizId.toString) 
            ? linkedQuizId.toString() 
            : linkedIdStr;
          
          // Try to find the quiz that matches this linked ID
          let matchingQuiz = null;
          
          // First try direct lookup in the ID map
          matchingQuiz = quizIdToSlide.get(linkedIdStr) || quizIdToSlide.get(linkedIdStr2);
          
          // If not found, try comparing with all quiz IDs using the Set
          if (!matchingQuiz) {
            for (const [quizSlide, quizIds] of quizSlideMap.entries()) {
              if (quizIds.has(linkedIdStr) || quizIds.has(linkedIdStr2)) {
                matchingQuiz = quizSlide;
                break;
              }
            }
          }
          
          if (matchingQuiz) {
            // Store the leaderboard with all possible quiz ID formats as keys
            // This ensures we can find it regardless of which ID format is used
            const allQuizIds = getAllSlideIds(matchingQuiz);
            allQuizIds.forEach(quizIdStr => {
              quizToLeaderboard.set(quizIdStr, slide);
            });
          } else {
            // Leaderboard linked to a quiz that doesn't exist or ID mismatch
            unlinkedLeaderboards.push(slide);
          }
        } else {
          // Leaderboard without a linked quiz (final leaderboard)
          unlinkedLeaderboards.push(slide);
        }
      }
    });
    
    // Build ordered array: iterate through sorted slides and insert leaderboards after their quiz
    const orderedSlidesArray = [];
    const processedLeaderboards = new Set();
    
    sortedSlides.forEach(slide => {
      // Skip leaderboards in the first pass - we'll add them after their quiz
      if (slide.type === 'leaderboard') {
        return;
      }
      
      // Add the slide
      orderedSlidesArray.push(slide);
      
      // If this is a quiz slide, add its linked leaderboard right after
      if (slide.type === 'quiz') {
        // Try all possible ID formats to find the leaderboard
        const quizIds = getAllSlideIds(slide);
        let linkedLeaderboard = null;
        
        // Try to find the leaderboard using any of the quiz's ID formats
        for (const quizIdStr of quizIds) {
          linkedLeaderboard = quizToLeaderboard.get(quizIdStr);
          if (linkedLeaderboard) break;
        }
        
        if (linkedLeaderboard) {
          const leaderboardId = String(linkedLeaderboard.id || linkedLeaderboard._id);
          if (leaderboardId && !processedLeaderboards.has(leaderboardId)) {
            orderedSlidesArray.push(linkedLeaderboard);
            processedLeaderboards.add(leaderboardId);
          }
        }
      }
    });
    
    // Add any remaining leaderboards that weren't linked to a quiz (final leaderboards)
    // These should maintain their original order
    unlinkedLeaderboards.forEach(leaderboard => {
      const leaderboardId = String(leaderboard.id || leaderboard._id);
      if (!processedLeaderboards.has(leaderboardId)) {
        orderedSlidesArray.push(leaderboard);
        processedLeaderboards.add(leaderboardId);
      }
    });
    
    // Check if there are quiz slides but no final leaderboard
    // If so, add a virtual final leaderboard slide at the end
    const hasQuizSlides = sortedSlides.some(slide => slide.type === 'quiz');
    // Check if there's already a final leaderboard (unlinked leaderboard) in the slides
    const hasFinalLeaderboard = unlinkedLeaderboards.length > 0 || 
      sortedSlides.some(slide => 
        slide.type === 'leaderboard' && 
        !slide.leaderboardSettings?.linkedQuizSlideId
      );
    
    if (hasQuizSlides && !hasFinalLeaderboard) {
      // Create a virtual final leaderboard slide
      const virtualFinalLeaderboard = {
        id: 'virtual-final-leaderboard',
        _id: 'virtual-final-leaderboard',
        type: 'leaderboard',
        question: 'Final Leaderboard',
        order: sortedSlides.length > 0 ? Math.max(...sortedSlides.map(s => s.order || 0)) + 1 : 0,
        leaderboardSettings: {
          linkedQuizSlideId: null,
          isAutoGenerated: false,
          displayCount: 10,
          isFinalLeaderboard: true
        }
      };
      orderedSlidesArray.push(virtualFinalLeaderboard);
    }
    
    return orderedSlidesArray;
  }, [slides]);
  
  // Map currentSlideIndex to the ordered slides array
  // Since we're reordering, we need to find the correct index in the ordered array
  const getOrderedIndex = useCallback((originalIndex) => {
    // Handle virtual slide marker (slides.length indicates virtual final leaderboard)
    if (originalIndex === slides.length && orderedSlides.length > 0) {
      const lastSlide = orderedSlides[orderedSlides.length - 1];
      if (lastSlide && (lastSlide.id === 'virtual-final-leaderboard' || lastSlide._id === 'virtual-final-leaderboard')) {
        return orderedSlides.length - 1;
      }
    }
    
    if (!slides || originalIndex < 0 || originalIndex >= slides.length) return 0;
    const originalSlide = slides[originalIndex];
    const orderedIndex = orderedSlides.findIndex(s => {
      const originalId = originalSlide.id || originalSlide._id;
      const orderedId = s.id || s._id;
      return String(originalId) === String(orderedId);
    });
    return orderedIndex >= 0 ? orderedIndex : 0;
  }, [slides, orderedSlides]);
  
  // Map ordered index back to original index
  const getOriginalIndex = useCallback((orderedIndex) => {
    if (!orderedSlides || orderedIndex < 0 || orderedIndex >= orderedSlides.length) return 0;
    const orderedSlide = orderedSlides[orderedIndex];
    
    // Handle virtual slides (like virtual-final-leaderboard)
    if (orderedSlide.id === 'virtual-final-leaderboard' || orderedSlide._id === 'virtual-final-leaderboard') {
      // For virtual slides, return the last index of original slides as a fallback
      // This ensures we don't break navigation, but the slide will be rendered from orderedSlides
      return slides.length > 0 ? slides.length - 1 : 0;
    }
    
    const originalIndex = slides.findIndex(s => {
      const orderedId = orderedSlide.id || orderedSlide._id;
      const originalId = s.id || s._id;
      return String(orderedId) === String(originalId);
    });
    return originalIndex >= 0 ? originalIndex : 0;
  }, [slides, orderedSlides]);
  
  const mappedCurrentSlideIndex = useMemo(() => {
    return getOrderedIndex(currentSlideIndex);
  }, [currentSlideIndex, getOrderedIndex]);
  
  // Keep refs in sync with state
  useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex]);
  
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);
  const [voteCounts, setVoteCounts] = useState({});
  const [showParticipantsDropdown, setShowParticipantsDropdown] = useState(false);
  const [showKickConfirmation, setShowKickConfirmation] = useState(false);
  const [participantToKick, setParticipantToKick] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const participantsPerPage = 10;

  // Get paginated participants
  const paginatedParticipants = useMemo(() => {
    const startIndex = (currentPage - 1) * participantsPerPage;
    return participants.slice(startIndex, startIndex + participantsPerPage);
  }, [participants, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(participants.length / participantsPerPage);

  // Generate user icon initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };

  // Get color class based on index for consistent coloring
  const getUserColorClass = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showParticipantsDropdown) {
        const dropdown = document.getElementById('participants-dropdown');
        const userIconsContainer = document.getElementById('user-icons-container');
        
        if (dropdown && !dropdown.contains(event.target) && 
            userIconsContainer && !userIconsContainer.contains(event.target)) {
          setShowParticipantsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showParticipantsDropdown]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [wordFrequencies, setWordFrequencies] = useState({});
  const [openEndedResponses, setOpenEndedResponses] = useState([]);
  const [openEndedSettings, setOpenEndedSettings] = useState(defaultOpenEndedSettings);
  const [scaleDistribution, setScaleDistribution] = useState({});
  const [scaleAverage, setScaleAverage] = useState(0);
  const [scaleStatementAverages, setScaleStatementAverages] = useState([]);
  const [scaleStatements, setScaleStatements] = useState([]);
  const [statementCounts, setStatementCounts] = useState([]);
  const [rankingResults, setRankingResults] = useState([]);
  const [hundredPointsResults, setHundredPointsResults] = useState([]);
  const [qnaQuestions, setQnaQuestions] = useState([]);
  const [guessDistribution, setGuessDistribution] = useState({});
  const [showEndModal, setShowEndModal] = useState(false);
  const [gridResults, setGridResults] = useState([]);
  const [pinResults, setPinResults] = useState([]);
  const [qnaActiveQuestionId, setQnaActiveQuestionId] = useState(null);
  const [scaleOverallAverage, setScaleOverallAverage] = useState(null);
  const [quizState, setQuizState] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [initialSlideIndex] = useState(() => {
    const params = new URLSearchParams(location.search);
    const slideParam = Number(params.get('slide'));
    if (Number.isNaN(slideParam) || slideParam < 0) {
      return 0;
    }
    return slideParam;
  });

  useEffect(() => {
    const newSocket = io(getSocketUrl());
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('end-presentation', { presentationId: id });
        newSocket.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    // Check if user is authenticated (either Firebase user or institution admin)
    const hasInstitutionAdminToken = sessionStorage.getItem('institutionAdminToken');
    if (!currentUser && !hasInstitutionAdminToken) {
      // Wait a bit for auth to initialize, but don't wait forever
      const timeout = setTimeout(() => {
        if (!currentUser && !hasInstitutionAdminToken) {
          console.error('No authentication found');
          setIsLoading(false);
          toast.error(t('toasts.presentation.failed_to_load') || 'Failed to load presentation');
          navigate('/dashboard');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.error('Presentation loading timeout');
      setIsLoading(false);
      toast.error(t('toasts.presentation.loading_timeout') || 'Loading timeout. Please try again.');
    }, 10000); // 10 second timeout

    const initPresentation = async () => {
      try {
        const data = await presentationService.getPresentationById(id);
        clearTimeout(loadingTimeout);
        
        setPresentation(data.presentation);
        const loadedSlides = data.slides || [];
        
        // Ensure PDF and PowerPoint fields are preserved when loading slides
        const mappedSlides = loadedSlides.map(slide => {
          // Preserve all PDF-related fields
          if (slide.type === 'pdf') {
            // Ensure pdfPages is an array and has content
            const pdfPages = Array.isArray(slide.pdfPages) && slide.pdfPages.length > 0 
              ? slide.pdfPages 
              : (slide.pdfPages || []);
            
            return {
              ...slide,
              pdfUrl: slide.pdfUrl || '',
              pdfPublicId: slide.pdfPublicId || null,
              pdfPages: pdfPages
            };
          }
          // Preserve all PowerPoint-related fields
          if (slide.type === 'powerpoint') {
            return {
              ...slide,
              powerpointUrl: slide.powerpointUrl || '',
              powerpointPublicId: slide.powerpointPublicId || null
            };
          }
          return slide;
        });
        
        // Debug: Log slides to check PDF data
        console.log('PresentMode - Loaded slides:', mappedSlides);
        const pdfSlides = mappedSlides.filter(s => s.type === 'pdf');
        if (pdfSlides.length > 0) {
          console.log('PresentMode - PDF slides found:', pdfSlides);
          pdfSlides.forEach((slide, idx) => {
            console.log(`PDF Slide ${idx}:`, {
              id: slide.id,
              pdfUrl: slide.pdfUrl,
              pdfPublicId: slide.pdfPublicId,
              pdfPages: slide.pdfPages,
              pdfPagesLength: slide.pdfPages?.length
            });
          });
        }
        
        setSlides(mappedSlides);

        if (loadedSlides.length === 0) {
          console.error('Presentation has no slides');
          toast.error(t('toasts.presentation.no_slides') || 'Presentation has no slides');
          setIsLoading(false);
          return;
        }

        const maxIndex = Math.max(0, loadedSlides.length - 1);
        const startIndex = Math.min(initialSlideIndex, maxIndex);
        setCurrentSlideIndex(startIndex);

        initializeOpenEndedStateForSlide({
          slide: loadedSlides[startIndex],
          setResponses: setOpenEndedResponses,
          setSettings: setOpenEndedSettings,
        });

        // Get userId - use currentUser id if available, otherwise use a fallback
        const userId = currentUser?.id || (hasInstitutionAdminToken ? 'institution-admin' : null);
        
        // Get token for institution admin authentication
        const token = hasInstitutionAdminToken ? sessionStorage.getItem('institutionAdminToken') : null;

        socket.emit('start-presentation', {
          presentationId: id,
          userId: userId,
          startIndex,
          ...(token && { token }), // Only include token if it exists
        });

        setIsLoading(false);
      } catch (error) {
        clearTimeout(loadingTimeout);
        console.error('Failed to load presentation:', error);
        toast.error(t('toasts.presentation.failed_to_load') || 'Failed to load presentation');
        setIsLoading(false);
        // Don't navigate away immediately - let user see the error
        setTimeout(() => {
          const hasInstitutionAdminToken = sessionStorage.getItem('institutionAdminToken');
          if (hasInstitutionAdminToken) {
            navigate('/institution-admin');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      }
    };

    initPresentation();

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [socket, id, currentUser, navigate, initialSlideIndex, t]);

  const getSlideId = (slide) => {
    if (!slide) return null;
    const idValue = slide.id || slide._id;
    return idValue ? idValue.toString() : null;
  };

  const updateQnaState = (qnaState) => {
    setQnaQuestions(Array.isArray(qnaState?.questions) ? qnaState.questions : []);
    setQnaActiveQuestionId(qnaState?.activeQuestionId ?? null);
  };

  useEffect(() => {
    if (!socket) return;

    const handlePresentationStarted = (data) => {
      if (!hasStarted) {
        setHasStarted(true);
        toast.success(t('toasts.present_mode.presentation_live'));
      }
      if (data?.presentation?.currentSlideIndex !== undefined) {
        setCurrentSlideIndex(data.presentation.currentSlideIndex);
      }
      if (typeof data?.participantCount === 'number') {
        setParticipantCount(data.participantCount);
      }
      if (Array.isArray(data?.slides) && data.slides.length > 0) {
        // Ensure PDF fields are preserved when setting slides from socket
        // Merge with existing slides to preserve PDF data
        setSlides((prevSlides) => {
          return data.slides.map((incomingSlide) => {
            // Find the corresponding existing slide
            const existingSlide = prevSlides.find(s => {
              const existingId = getSlideId(s);
              const incomingId = getSlideId(incomingSlide);
              return existingId && incomingId && existingId === incomingId;
            });
            
            // If it's a PDF slide, preserve PDF fields from existing slide if incoming is empty
            if (incomingSlide.type === 'pdf' || existingSlide?.type === 'pdf') {
              const existingPdfFields = existingSlide ? {
                pdfUrl: existingSlide.pdfUrl,
                pdfPublicId: existingSlide.pdfPublicId,
                pdfPages: existingSlide.pdfPages
              } : {};
              
              // Use incoming PDF fields if they're valid, otherwise use existing
              const pdfUrl = (incomingSlide.pdfUrl && incomingSlide.pdfUrl !== '') 
                ? incomingSlide.pdfUrl 
                : (existingPdfFields.pdfUrl || '');
              
              const pdfPublicId = (incomingSlide.pdfPublicId && incomingSlide.pdfPublicId !== null)
                ? incomingSlide.pdfPublicId
                : (existingPdfFields.pdfPublicId || null);
              
              const pdfPages = (Array.isArray(incomingSlide.pdfPages) && incomingSlide.pdfPages.length > 0)
                ? incomingSlide.pdfPages
                : (Array.isArray(existingPdfFields.pdfPages) && existingPdfFields.pdfPages.length > 0)
                  ? existingPdfFields.pdfPages
                  : [];
              
              return {
                ...incomingSlide,
                pdfUrl,
                pdfPublicId,
                pdfPages
              };
            }
            
            return incomingSlide;
          });
        });
      }
    };

    const handleResponseUpdated = (data) => {
      // Use refs to get the latest values without closure issues
      const currentIndex = currentSlideIndexRef.current;
      const currentSlides = slidesRef.current;
      const currentSlide = currentSlides[currentIndex];
      const currentSlideId = getSlideId(currentSlide);
      
      // Normalize slideId from response - handle both ObjectId and string formats
      let responseSlideId = null;
      if (data.slideId) {
        responseSlideId = String(data.slideId).trim();
      } else if (data.slide) {
        responseSlideId = String(data.slide.id || data.slide._id || '').trim();
      }
      
      const normalizedCurrentSlideId = currentSlideId ? String(currentSlideId).trim() : null;
      
      // Only update if this response is for the current slide, or if slideId is not provided (backward compatibility)
      // Be more lenient - if we have a current slide but no response slideId, still process (backward compat)
      // If we have both, they must match
      if (responseSlideId && normalizedCurrentSlideId && responseSlideId !== normalizedCurrentSlideId) {
        // Response is for a different slide, ignore it
        return;
      }
      
      // If we don't have a current slide ID, we can't verify, so skip
      if (!normalizedCurrentSlideId) {
        return;
      }
      
      // Process the response update
      if (data.voteCounts !== undefined) {
        console.log('[handleResponseUpdated] Setting voteCounts:', data.voteCounts);
        console.log('[handleResponseUpdated] voteCounts type:', typeof data.voteCounts);
        console.log('[handleResponseUpdated] voteCounts keys:', Object.keys(data.voteCounts || {}));
        console.log('[handleResponseUpdated] voteCounts values:', Object.values(data.voteCounts || {}));
        // Create a new object to ensure React detects the change
        setVoteCounts({ ...data.voteCounts });
      } else {
        console.log('[handleResponseUpdated] voteCounts is undefined in data');
      }
      if (data.wordFrequencies !== undefined) setWordFrequencies(data.wordFrequencies);
      if (data.totalResponses !== undefined) {
        console.log('[handleResponseUpdated] Setting totalResponses:', data.totalResponses);
        setTotalResponses(data.totalResponses);
      }
      if (data.scaleDistribution !== undefined) {
        console.log('[handleResponseUpdated] Setting scaleDistribution:', data.scaleDistribution);
        setScaleDistribution(data.scaleDistribution);
      }
      if (data.scaleAverage !== undefined) setScaleAverage(data.scaleAverage);
      if (data.scaleStatementAverages !== undefined) setScaleStatementAverages(data.scaleStatementAverages);
      if (data.scaleStatements !== undefined) setScaleStatements(data.scaleStatements);
      if (data.statementCounts !== undefined) setStatementCounts(data.statementCounts);
      if (data.scaleOverallAverage !== undefined) setScaleOverallAverage(data.scaleOverallAverage);
      if (data.rankingResults !== undefined) {
        setRankingResults(Array.isArray(data.rankingResults) ? data.rankingResults : []);
      } else if (data.slide?.type !== 'ranking') {
        setRankingResults([]);
      }
      if (data.hundredPointsResults !== undefined) {
        setHundredPointsResults(Array.isArray(data.hundredPointsResults) ? data.hundredPointsResults : []);
      } else if (data.slide?.type !== 'hundred_points') {
        setHundredPointsResults([]);
      }
      if (data.quizState !== undefined) {
        setQuizState(prev => ({
          ...prev,
          ...data.quizState
        }));
      }
      if (data.qnaState && data.slideId) {
        if (currentSlideId && currentSlideId === data.slideId.toString()) {
          updateQnaState(data.qnaState);
        }
      }
      if (data.gridResults !== undefined) {
        setGridResults(Array.isArray(data.gridResults) ? data.gridResults : []);
      } else if (data.slide?.type !== '2x2_grid') {
        setGridResults([]);
      }
      if (data.pinResults !== undefined) {
        setPinResults(Array.isArray(data.pinResults) ? data.pinResults : []);
      } else if (data.slide?.type !== 'pin_on_image') {
        setPinResults([]);
      }
      if (data.slide) {
        const incomingSlideId = data.slide.id?.toString() ?? data.slide._id?.toString() ?? null;
        setSlides((prevSlides) =>
          prevSlides.map((slideItem) => {
            const existingId = getSlideId(slideItem);
            if (incomingSlideId && existingId === incomingSlideId) {
              // Preserve PDF fields when updating slide from socket
              // Extract PDF fields first before spreading data.slide
              const existingPdfFields = slideItem.type === 'pdf' ? {
                pdfUrl: slideItem.pdfUrl,
                pdfPublicId: slideItem.pdfPublicId,
                pdfPages: slideItem.pdfPages
              } : {};
              
              // Remove PDF fields from data.slide if they're invalid to prevent overwriting
              const { pdfUrl: _, pdfPublicId: __, pdfPages: ___, ...dataSlideWithoutPdf } = data.slide;
              
              // Spread data.slide (without PDF fields) to update other fields
              const updatedSlide = { ...slideItem, ...dataSlideWithoutPdf };
              
              // Restore PDF fields - only use incoming if valid, otherwise preserve existing
              if (slideItem.type === 'pdf' || data.slide.type === 'pdf') {
                // Only update PDF fields if incoming data has valid values
                if (data.slide.pdfUrl !== undefined && data.slide.pdfUrl !== null && data.slide.pdfUrl !== '') {
                  updatedSlide.pdfUrl = data.slide.pdfUrl;
                } else if (existingPdfFields.pdfUrl) {
                  updatedSlide.pdfUrl = existingPdfFields.pdfUrl;
                }
                
                if (data.slide.pdfPublicId !== undefined && data.slide.pdfPublicId !== null) {
                  updatedSlide.pdfPublicId = data.slide.pdfPublicId;
                } else if (existingPdfFields.pdfPublicId) {
                  updatedSlide.pdfPublicId = existingPdfFields.pdfPublicId;
                }
                
                // Only use incoming pdfPages if it's a non-empty array, otherwise preserve existing
                if (data.slide.pdfPages !== undefined && Array.isArray(data.slide.pdfPages) && data.slide.pdfPages.length > 0) {
                  updatedSlide.pdfPages = data.slide.pdfPages;
                } else if (existingPdfFields.pdfPages && Array.isArray(existingPdfFields.pdfPages) && existingPdfFields.pdfPages.length > 0) {
                  updatedSlide.pdfPages = existingPdfFields.pdfPages;
                } else {
                  updatedSlide.pdfPages = existingPdfFields.pdfPages || [];
                }
              }
              return updatedSlide;
            }
            return slideItem;
          }),
        );
      }
      if (data.slide?.type !== 'qna') {
        setQnaQuestions([]);
        setQnaActiveQuestionId(null);
      }
      if (data.slide?.type === 'guess_number') {
        if (data.guessNumberState) {
          setGuessDistribution(data.guessNumberState.distribution || {});
        } else {
          setGuessDistribution({});
        }
      } else {
        setGuessDistribution({});
      }
      mergeOpenEndedState({
        payload: data,
        setResponses: setOpenEndedResponses,
        setSettings: setOpenEndedSettings,
      });
    };

    const handleSlideChanged = (data) => {
      if (data.voteCounts !== undefined) setVoteCounts(data.voteCounts);
      if (data.wordFrequencies !== undefined) setWordFrequencies(data.wordFrequencies);
      if (data.totalResponses !== undefined) setTotalResponses(data.totalResponses);
      if (data.scaleDistribution !== undefined) setScaleDistribution(data.scaleDistribution);
      if (data.scaleAverage !== undefined) setScaleAverage(data.scaleAverage);
      if (data.scaleStatementAverages !== undefined) setScaleStatementAverages(data.scaleStatementAverages);
      if (data.scaleStatements !== undefined) setScaleStatements(data.scaleStatements);
      if (data.statementCounts !== undefined) setStatementCounts(data.statementCounts);
      if (data.scaleOverallAverage !== undefined) setScaleOverallAverage(data.scaleOverallAverage);
      if (data.rankingResults !== undefined) {
        setRankingResults(Array.isArray(data.rankingResults) ? data.rankingResults : []);
      }
      if (data.hundredPointsResults !== undefined) {
        setHundredPointsResults(Array.isArray(data.hundredPointsResults) ? data.hundredPointsResults : []);
      }
      if (data.quizState !== undefined) {
        setQuizState(data.quizState);
      } else if (data.slide?.type === 'quiz') {
        // Reset quiz state when changing to a quiz slide
        setQuizState({});
      }
      if (data.slide) {
        const incomingSlideId = data.slide.id?.toString() ?? data.slide._id?.toString() ?? null;
        
        // Update the slide in the slides array and find its index
        setSlides((prevSlides) => {
          const updatedSlides = prevSlides.map((slideItem) => {
            const existingId = getSlideId(slideItem);
            if (incomingSlideId && existingId === incomingSlideId) {
              // Preserve PDF fields when updating slide from socket
              // Extract PDF fields first before spreading data.slide
              const existingPdfFields = slideItem.type === 'pdf' ? {
                pdfUrl: slideItem.pdfUrl,
                pdfPublicId: slideItem.pdfPublicId,
                pdfPages: slideItem.pdfPages
              } : {};
              
              // Remove PDF fields from data.slide if they're invalid to prevent overwriting
              const { pdfUrl: _, pdfPublicId: __, pdfPages: ___, ...dataSlideWithoutPdf } = data.slide;
              
              // Spread data.slide (without PDF fields) to update other fields
              const updatedSlide = { ...slideItem, ...dataSlideWithoutPdf };
              
              // Restore PDF fields - only use incoming if valid, otherwise preserve existing
              if (slideItem.type === 'pdf' || data.slide.type === 'pdf') {
                // Only update PDF fields if incoming data has valid values
                if (data.slide.pdfUrl !== undefined && data.slide.pdfUrl !== null && data.slide.pdfUrl !== '') {
                  updatedSlide.pdfUrl = data.slide.pdfUrl;
                } else if (existingPdfFields.pdfUrl) {
                  updatedSlide.pdfUrl = existingPdfFields.pdfUrl;
                }
                
                if (data.slide.pdfPublicId !== undefined && data.slide.pdfPublicId !== null) {
                  updatedSlide.pdfPublicId = data.slide.pdfPublicId;
                } else if (existingPdfFields.pdfPublicId) {
                  updatedSlide.pdfPublicId = existingPdfFields.pdfPublicId;
                }
                
                // Only use incoming pdfPages if it's a non-empty array, otherwise preserve existing
                if (data.slide.pdfPages !== undefined && Array.isArray(data.slide.pdfPages) && data.slide.pdfPages.length > 0) {
                  updatedSlide.pdfPages = data.slide.pdfPages;
                } else if (existingPdfFields.pdfPages && Array.isArray(existingPdfFields.pdfPages) && existingPdfFields.pdfPages.length > 0) {
                  updatedSlide.pdfPages = existingPdfFields.pdfPages;
                } else {
                  updatedSlide.pdfPages = existingPdfFields.pdfPages || [];
                }
              }
              return updatedSlide;
            }
            return slideItem;
          });
          
          // Update currentSlideIndex if provided, otherwise find it by slide ID
          if (data.slideIndex !== undefined) {
            if (data.slideIndex !== currentSlideIndex) {
              setCurrentSlideIndex(data.slideIndex);
            }
          } else if (incomingSlideId) {
            const slideIndex = updatedSlides.findIndex((slideItem) => {
              const existingId = getSlideId(slideItem);
              return existingId === incomingSlideId;
            });
            if (slideIndex !== -1 && slideIndex !== currentSlideIndex) {
              setCurrentSlideIndex(slideIndex);
            }
          }
          
          return updatedSlides;
        });
      } else if (data.slideIndex !== undefined && data.slideIndex !== currentSlideIndex) {
        // Update index even if slide data is not provided
        setCurrentSlideIndex(data.slideIndex);
      }
      if (data.slide?.type === 'qna') {
        if (data.qnaState) {
          updateQnaState(data.qnaState);
        } else {
          updateQnaState({ allowMultiple: data.slide?.qnaSettings?.allowMultiple, questions: [] });
        }
      } else {
        setQnaQuestions([]);
        setQnaActiveQuestionId(null);
      }
      if (data.slide?.type === 'guess_number') {
        if (data.guessNumberState) {
          setGuessDistribution(data.guessNumberState.distribution || {});
        } else {
          setGuessDistribution({});
        }
      } else {
        setGuessDistribution({});
      }
      if (data.gridResults !== undefined) {
        setGridResults(Array.isArray(data.gridResults) ? data.gridResults : []);
      } else if (data.slide?.type !== '2x2_grid') {
        setGridResults([]);
      }
      if (data.pinResults !== undefined) {
        setPinResults(Array.isArray(data.pinResults) ? data.pinResults : []);
      } else if (data.slide?.type !== 'pin_on_image') {
        setPinResults([]);
      }
      mergeOpenEndedState({
        payload: data,
        setResponses: setOpenEndedResponses,
        setSettings: setOpenEndedSettings,
        resetResponses: true,
        resetSettings: !isOpenEndedSlide(data.slide),
      });
    };

    const handleParticipantJoined = (data) => {
      setParticipantCount(data.participantCount);
      toast.success(t('toasts.present_mode.new_participant_joined'));
    };

    const handleParticipantLeft = (data) => {
      setParticipantCount(data.participantCount);
    };

    const handleParticipantListUpdated = (data) => {
      setParticipantCount(data.participantCount);
      setParticipants(data.participants || []);
    };

    const handleError = (data) => {
      toast.error(data.message);
    };

    const handleOpenEndedSettingsUpdated = (data) => {
      mergeOpenEndedState({
        payload: data,
        setSettings: setOpenEndedSettings,
      });
    };

    const handleQnaUpdated = (data) => {
      const slideId = getSlideId(slides[currentSlideIndex]);
      if (!slideId || slideId !== data.slideId?.toString()) return;
      updateQnaState(data);
    };

    const handleGuessUpdated = (data) => {
      const slideId = getSlideId(slides[currentSlideIndex]);
      if (!slideId || slideId !== data.slideId?.toString()) return;
      setGuessDistribution(data.distribution || {});
    };

    const handleQuizStarted = (data) => {
      const slideId = getSlideId(slides[currentSlideIndex]);
      if (!slideId || slideId !== data.slideId?.toString()) return;
      setQuizState({
        isActive: true,
        startTime: data.startTime,
        timeLimit: data.timeLimit,
        results: quizState.results || {}
      });
    };

    const handleQuizResultsUpdated = (data) => {
      const slideId = getSlideId(slides[currentSlideIndex]);
      if (!slideId || slideId !== data.slideId?.toString()) return;
      setQuizState(prev => ({
        ...prev,
        results: data.results
      }));
    };

    const handleQuizEnded = (data) => {
      const slideId = getSlideId(slides[currentSlideIndex]);
      if (!slideId || slideId !== data.slideId?.toString()) return;
      setQuizState(prev => ({
        ...prev,
        isActive: false,
        results: data.results
      }));
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    };

    const handleLeaderboardData = (data) => {
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    };

    const handleKickedByPresenter = (data) => {
      toast.error(data.message);
      // Navigate to dashboard or show a modal
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    };

    socket.on('presentation-started', handlePresentationStarted);
    socket.on('response-updated', handleResponseUpdated);
    socket.on('slide-changed', handleSlideChanged);
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('participant-list-updated', handleParticipantListUpdated);
    socket.on('error', handleError);
    socket.on('open-ended-settings-updated', handleOpenEndedSettingsUpdated);
    socket.on('qna-updated', handleQnaUpdated);
    socket.on('guess-updated', handleGuessUpdated);
    socket.on('quiz-started', handleQuizStarted);
    socket.on('quiz-results-updated', handleQuizResultsUpdated);
    socket.on('quiz-ended', handleQuizEnded);
    socket.on('leaderboard-data', handleLeaderboardData);
    socket.on('kicked-by-presenter', handleKickedByPresenter);

    return () => {
      socket.off('presentation-started', handlePresentationStarted);
      socket.off('response-updated', handleResponseUpdated);
      socket.off('slide-changed', handleSlideChanged);
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('participant-list-updated', handleParticipantListUpdated);
      socket.off('error', handleError);
      socket.off('open-ended-settings-updated', handleOpenEndedSettingsUpdated);
      socket.off('qna-updated', handleQnaUpdated);
      socket.off('guess-updated', handleGuessUpdated);
      socket.off('quiz-started', handleQuizStarted);
      socket.off('quiz-results-updated', handleQuizResultsUpdated);
      socket.off('quiz-ended', handleQuizEnded);
      socket.off('leaderboard-data', handleLeaderboardData);
      socket.off('kicked-by-presenter', handleKickedByPresenter);
    };
  }, [socket, hasStarted, slides, currentSlideIndex, quizState.results]);

  useEffect(() => {
    if (!socket) return;
    const slide = slides[currentSlideIndex];
    if (!slide || slide.type !== 'qna') return;
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('request-qna-state', {
      presentationId: id,
      slideId,
    });
  }, [socket, slides, currentSlideIndex, id]);

  useEffect(() => {
    if (!socket) return;
    const slide = slides[currentSlideIndex];
    if (!slide || (slide.type !== 'leaderboard' && slide.type !== 'quiz')) return;
    socket.emit('request-leaderboard', {
      presentationId: id,
      limit: 10
    });
  }, [socket, slides, currentSlideIndex, id]);

  const handleMarkQnaAnswered = (questionId, answered = true, answerText = null) => {
    const slide = slides[currentSlideIndex];
    if (!socket || !slide || slide.type !== 'qna') return;
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('mark-qna-answered', {
      presentationId: id,
      slideId,
      questionId,
      answered,
      answerText: answerText || null,
    });
  };

  const handleClearQnaQuestions = () => {
    const slide = slides[currentSlideIndex];
    if (!socket || !slide || slide.type !== 'qna') return;
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('clear-qna-questions', {
      presentationId: id,
      slideId,
    });
  };

  const handleSetActiveQuestion = (questionId) => {
    if (!socket) return;
    if (qnaActiveQuestionId === questionId) return;
    const slide = slides[currentSlideIndex];
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('set-qna-active-question', {
      presentationId: id,
      slideId,
      questionId,
    });
    setQnaActiveQuestionId(questionId ?? null);
  };

  const handleClearGuessResponses = () => {
    if (!socket) return;
    const slide = slides[currentSlideIndex];
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('clear-guess-responses', {
      presentationId: id,
      slideId,
    });
    toast.success(t('toasts.present_mode.responses_cleared'));
  };

  const handleStartQuiz = () => {
    if (!socket) return;
    const slide = slides[currentSlideIndex];
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('start-quiz', {
      presentationId: id,
      slideId,
    });
  };

  const handleEndQuiz = () => {
    if (!socket) return;
    const slide = slides[currentSlideIndex];
    const slideId = getSlideId(slide);
    if (!slideId) return;
    socket.emit('end-quiz', {
      presentationId: id,
      slideId,
    });
  };

  const handleKickParticipant = (participantName) => {
    if (!socket) return;
    
    // Set the participant to kick and show confirmation modal
    setParticipantToKick(participantName);
    setShowKickConfirmation(true);
  };

  const confirmKickParticipant = () => {
    if (!socket || !participantToKick) return;
    
    socket.emit('kick-participant', {
      presentationId: id,
      participantName: participantToKick,
    });
    
    toast.success(t('toasts.present_mode.participant_kicked', { participant: participantToKick }));
    
    // Close the modal and reset state
    setShowKickConfirmation(false);
    setParticipantToKick(null);
  };

  const cancelKickParticipant = () => {
    setShowKickConfirmation(false);
    setParticipantToKick(null);
  };

  const endQuizIfActive = () => {
    // Use orderedSlides to get current slide (handles virtual slides)
    const slide = orderedSlides[mappedCurrentSlideIndex] || slides[currentSlideIndex];
    if (!socket || !slide || slide.type !== 'quiz') return;
    const slideId = getSlideId(slide);
    if (!slideId) return;
    if (quizState?.isActive) {
      socket.emit('end-quiz', {
        presentationId: id,
        slideId,
      });
    }
  };

  const handleNextSlide = () => {
    // Use ordered slides for navigation to include leaderboards
    if (mappedCurrentSlideIndex >= orderedSlides.length - 1) return;

    endQuizIfActive();

    // Navigate to next slide in ordered slides (which includes leaderboards)
    const nextOrderedIndex = mappedCurrentSlideIndex + 1;
    const nextSlide = orderedSlides[nextOrderedIndex];
    
    if (!nextSlide) return; // No more slides
    
    // Check if next slide is a virtual slide
    const isVirtualSlide = nextSlide.id === 'virtual-final-leaderboard' || nextSlide._id === 'virtual-final-leaderboard';
    
    if (isVirtualSlide) {
      // For virtual slides, use slides.length as a marker
      // getOrderedIndex will map this to the virtual slide in orderedSlides
      setCurrentSlideIndex(slides.length);
      
      // Emit a special event to show final leaderboard to participants
      socket.emit('change-slide', {
        presentationId: id,
        slideIndex: slides.length > 0 ? slides.length - 1 : 0,
        showFinalLeaderboard: true // Flag to indicate final leaderboard
      });
    } else {
      // Convert back to original index for state management
      const nextOriginalIndex = getOriginalIndex(nextOrderedIndex);
      
      if (nextOriginalIndex >= 0 && nextOriginalIndex < slides.length) {
        setCurrentSlideIndex(nextOriginalIndex);
        socket.emit('change-slide', {
          presentationId: id,
          slideIndex: nextOriginalIndex,
        });
      }
    }
  };

  const handlePrevSlide = () => {
    // Use ordered slides for navigation to include leaderboards
    if (mappedCurrentSlideIndex <= 0) return;

    endQuizIfActive();

    // Check if we're currently on a virtual slide
    const currentSlide = orderedSlides[mappedCurrentSlideIndex];
    const isCurrentlyOnVirtual = currentSlide && (currentSlide.id === 'virtual-final-leaderboard' || currentSlide._id === 'virtual-final-leaderboard');

    // Navigate to previous slide in ordered slides (which includes leaderboards)
    const prevOrderedIndex = mappedCurrentSlideIndex - 1;
    const prevSlide = orderedSlides[prevOrderedIndex];
    
    // Check if previous slide is a virtual slide
    const isVirtualSlide = prevSlide && (prevSlide.id === 'virtual-final-leaderboard' || prevSlide._id === 'virtual-final-leaderboard');
    
    if (isVirtualSlide) {
      // For virtual slides, use slides.length as marker
      setCurrentSlideIndex(slides.length);
      
      // Emit event to show final leaderboard to participants
      const lastSlideIndex = slides.length > 0 ? slides.length - 1 : 0;
      socket.emit('change-slide', {
        presentationId: id,
        slideIndex: lastSlideIndex,
        showFinalLeaderboard: true
      });
    } else {
      // Convert back to original index for state management
      const prevOriginalIndex = getOriginalIndex(prevOrderedIndex);

      if (prevOriginalIndex >= 0 && prevOriginalIndex < slides.length) {
        setCurrentSlideIndex(prevOriginalIndex);
        socket.emit('change-slide', {
          presentationId: id,
          slideIndex: prevOriginalIndex,
        });
      }
    }
  };

  const handleConfirmEndPresentation = () => {
    if (!socket) return;
    socket.emit('end-presentation', { presentationId: id });
    toast.success(t('toasts.present_mode.presentation_ended'));
    setShowEndModal(false);
    navigate(`/presentation/${id}`);
  };

  const handleCancelEndPresentation = () => {
    setShowEndModal(false);
  };

  const navigateToSlidesList = ()=> {
    if(!socket) return;
    navigate(`/presentation/${id}`, {state: { currSlide: currentSlideIndex }});
  }

  const renderSlideContent = () => {
    // Use orderedSlides to include virtual final leaderboard
    // First try to get slide from orderedSlides using mapped index
    let slide = orderedSlides[mappedCurrentSlideIndex];
    
    // If not found and currentSlideIndex is slides.length (virtual slide marker), 
    // try to get the last slide from orderedSlides
    if (!slide && currentSlideIndex === slides.length && orderedSlides.length > 0) {
      const lastSlide = orderedSlides[orderedSlides.length - 1];
      if (lastSlide && (lastSlide.id === 'virtual-final-leaderboard' || lastSlide._id === 'virtual-final-leaderboard')) {
        slide = lastSlide;
      }
    }
    
    // Fallback to original slides array
    if (!slide) {
      slide = slides[currentSlideIndex];
    }
    
    if (!slide) return null;

    switch (slide.type) {
      case 'multiple_choice':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0] text-center leading-tight">
                {typeof slide.question === 'string' 
                  ? slide.question 
                  : (slide.question?.text || slide.question?.label || 'Ask your question here...')}
              </h2>
            </div>
            <MCQPresenterResults
              options={slide.options}
              voteCounts={voteCounts}
              totalResponses={totalResponses}
            />
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-[#B0B0B0]">
                Total Responses: <span className="font-bold text-[#4CAF50]">{totalResponses}</span>
              </p>
            </div>
          </div>
        );
      case 'scales':
        return (
          <ScalesPresenterView
            slide={slide}
            scaleDistribution={scaleDistribution}
            scaleAverage={scaleAverage}
            scaleStatementAverages={scaleStatementAverages}
            scaleStatements={scaleStatements}
            statementCounts={statementCounts}
            scaleOverallAverage={scaleOverallAverage}
            totalResponses={totalResponses}
          />
        );
      case 'word_cloud':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0] text-center leading-tight">
                {slide.question || 'Enter your prompt for the word cloud'}
              </h2>
            </div>
            <div className="mt-4 sm:mt-6">
              <WordCloudPresenterResults wordFrequencies={wordFrequencies} maxWords={80} width={700} height={400} />
            </div>
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-[#B0B0B0]">
                Total Submissions: <span className="font-bold text-[#4CAF50]">{totalResponses}</span>
              </p>
              {typeof slide.maxWordsPerParticipant === 'number' && (
                <p className="text-xs sm:text-sm text-[#6C6C6C] mt-1">Max words per participant: {slide.maxWordsPerParticipant}</p>
              )}
            </div>
          </div>
        );
      case 'open_ended':
        return (
          <OpenEndedPresenter
            slide={slide}
            responses={openEndedResponses}
            settings={openEndedSettings}
            onToggleVoting={(nextValue) => {
              const nextSettings = {
                ...openEndedSettings,
                isVotingEnabled: Boolean(nextValue),
              };
              setOpenEndedSettings(nextSettings);
              emitOpenEndedSettingsUpdate({
                socket,
                presentationId: id,
                slideId: slide.id,
                settings: nextSettings,
              });
            }}
          />
        );
      case 'ranking':
        return (
          <RankingPresenterView
            slide={slide}
            rankingResults={rankingResults || []}
            totalResponses={totalResponses}
          />
        );
      case 'qna':
        return (
          <PresenterQnaView
            slide={slide}
            questions={qnaQuestions}
            totalResponses={qnaQuestions.length}
            onMarkAnswered={handleMarkQnaAnswered}
            onClearAll={handleClearQnaQuestions}
            onSetActiveQuestion={handleSetActiveQuestion}
          />
        );
      case 'guess_number':
        return (
          <PresenterGuessView
            slide={slide}
            distribution={guessDistribution}
            correctAnswer={slide?.guessNumberSettings?.correctAnswer}
            onClearResponses={handleClearGuessResponses}
          />
        );
      case 'hundred_points':
        return (
          <HundredPointsPresenterView
            slide={slide}
            hundredPointsResults={hundredPointsResults || []}
            totalResponses={totalResponses}
          />
        );
      case '2x2_grid':
        return (
          <TwoByTwoGridPresenterView
            slide={slide}
            gridResults={gridResults}
            totalResponses={totalResponses}
          />
        );
      case 'pin_on_image':
        return (
          <PinOnImagePresenterView
            slide={slide}
            pinResults={pinResults}
            totalResponses={totalResponses}
          />
        );
      case 'quiz':
        return (
          <QuizPresenterResults
            slide={slide}
            quizState={quizState}
            leaderboard={leaderboard}
            onStartQuiz={handleStartQuiz}
            onEndQuiz={handleEndQuiz}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardPresenterResults
            slide={slide}
            leaderboard={leaderboard}
            slides={slides}
          />
        );
      case 'pick_answer':
        return (
          <PickAnswerPresenterView
            slide={slide}
            voteCounts={voteCounts}
            totalResponses={totalResponses}
            sendSocketMessage={(message) => socket.emit('presentation-message', message)}
          />
        );
      case 'type_answer':
        return (
          <TypeAnswerPresenterView
            slide={slide}
            responses={openEndedResponses}
            settings={openEndedSettings}
            onToggleVoting={(nextValue) => {
              const nextSettings = {
                ...openEndedSettings,
                isVotingEnabled: Boolean(nextValue),
              };
              setOpenEndedSettings(nextSettings);
              emitOpenEndedSettingsUpdate({
                socket,
                presentationId: id,
                slideId: slide.id,
                settings: nextSettings,
              });
            }}
          />
        );
      case 'miro':
        return (
          <MiroPresenterView
            slide={slide}
            responses={openEndedResponses}
          />
        );
      case 'powerpoint':
        return (
          <PowerPointPresenterView
            slide={slide}
            responses={openEndedResponses}
          />
        );
      case 'google_slides':
        return (
          <GoogleSlidesPresenterView
            slide={slide}
            responses={openEndedResponses}
          />
        );
      case 'pdf':
        // Debug: Log slide data for PDF
        console.log('PresentMode - PDF slide:', slide);
        console.log('PresentMode - PDF slide pdfPages:', slide?.pdfPages);
        
        // Safety check: Ensure PDF fields exist, fallback to empty if missing
        const pdfSlide = {
          ...slide,
          pdfUrl: slide.pdfUrl || '',
          pdfPublicId: slide.pdfPublicId || null,
          pdfPages: Array.isArray(slide.pdfPages) && slide.pdfPages.length > 0 
            ? slide.pdfPages 
            : []
        };
        
        return (
          <PdfPresenterView
            slide={pdfSlide}
            responses={openEndedResponses}
          />
        );
      case 'instruction':
        return (
          <InstructionPresenterView
            slide={slide}
            presentation={presentation}
          />
        );
      case 'video':
        return (
          <SlideCanvas
            slide={slide}
            presentation={presentation}
            isPresenter={true}
          />
        );
      case 'text':
        return (
          <SlideCanvas
            slide={slide}
            presentation={presentation}
            isPresenter={true}
          />
        );
      case 'image':
        return (
          <SlideCanvas
            slide={slide}
            presentation={presentation}
            isPresenter={true}
          />
        );
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0]">
              {typeof slide.question === 'string' 
                ? slide.question 
                : (slide.question?.text || slide.question?.label || '')}
            </h2>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
        <div className="text-2xl text-[#E0E0E0]">Loading presentation...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1A1A1A] text-[#E0E0E0] overflow-hidden">
      <header className="flex-shrink-0 bg-[#1F1F1F] border-b border-[#2A2A2A] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button 
              className='flex gap-1.5 justify-center items-center px-3 py-1.5 rounded-lg hover:bg-[#2A2A2A] hover:cursor-pointer bg-[#2A2A2A] text-[#E0E0E0] transition-all active:scale-95'
              onClick={navigateToSlidesList}
            >
              <ArrowLeft className='w-4 h-4'/>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-base sm:text-xl font-semibold text-[#E0E0E0] truncate">{presentation?.title}</h1>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#2A2A2A] border border-[#2F2F2F] text-[#4CAF50] font-mono text-xs sm:text-sm font-semibold">
              {presentation?.accessCode}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Icons Container */}
            <div id="user-icons-container" className="relative flex items-center">
              {/* User Icons - made clickable */}
              <div 
                className="flex -space-x-2 cursor-pointer"
                onClick={() => participants.length > 0 && setShowParticipantsDropdown(!showParticipantsDropdown)}
              >
                {participants.slice(0, 3).map((participant, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getUserColorClass(index)} border-2 border-[#1F1F1F] relative group`}
                    title={participant}
                  >
                    {getUserInitials(participant)}
                    {/* Tooltip for user icons */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full -mb-1 hidden group-hover:block bg-[#2A2A2A] text-[#E0E0E0] text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap max-w-xs border border-[#3A3A3A]">
                      <div className="relative">
                        {participant}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#2A2A2A] mt-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
                {participants.length > 3 && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-600 border-2 border-[#1F1F1F]" title={`${participants.length - 3} more participants`}>
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              
              {/* Participants Dropdown */}
              {showParticipantsDropdown && (
                <div id="participants-dropdown" className="absolute top-full right-0 mt-2 w-80 sm:w-[400px] bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#2A2A2A]">
                    <h3 className="text-lg font-semibold text-[#E0E0E0]">Participants ({participants.length})</h3>
                  </div>
                  
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginatedParticipants.map((participant, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getUserColorClass(index)}`}>
                          {getUserInitials(participant)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[#E0E0E0] block whitespace-normal break-words">{participant}</span>
                        </div>
                        <button
                          onClick={() => handleKickParticipant(participant)}
                          className="p-2 text-red-400 hover:text-red-300 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title={t('presentation.remove_participant_tooltip')}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-[#2A2A2A] bg-[#1A1A1A]">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-[#2A2A2A] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>
                      
                      <span className="text-[#B0B0B0] text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-[#2A2A2A] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={() => setShowParticipantsDropdown(false)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#2A2A2A] text-[#B0B0B0] hover:text-[#E0E0E0]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Original participant count */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#1D2A20] border border-[#2E7D32]/30 text-[#4CAF50]">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base">{participantCount}</span>
            </div>
            
            <button
              onClick={() => setShowEndModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base font-medium">End</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#1A1A1A] custom-scrollbar min-h-0">
        <div className="mx-auto w-full max-w-6xl min-h-full px-4 sm:px-6 py-6 sm:py-10 flex">
          <div className="w-full">
            {renderSlideContent()}
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 bg-[#1F1F1F] border-t border-[#2A2A2A] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333333] disabled:bg-[#1F1F1F] disabled:text-[#6C6C6C] flex items-center gap-2 transition-all active:scale-95 disabled:active:scale-100"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base font-medium">Previous</span>
          </button>

          <div className="text-base sm:text-lg font-semibold text-[#E0E0E0] px-4">
            <span className="text-[#4CAF50]">{mappedCurrentSlideIndex + 1}</span>
            <span className="text-[#6C6C6C]"> / </span>
            <span>{orderedSlides.length}</span>
          </div>

          <button
            onClick={handleNextSlide}
            disabled={mappedCurrentSlideIndex >= orderedSlides.length - 1}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[#388E3C] to-[#2E7D32] text-white hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] flex items-center gap-2 transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
          >
            <span className="text-sm sm:text-base font-medium">Next</span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </footer>

      {showKickConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={cancelKickParticipant}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#1F1F1F] border border-[#2A2A2A] p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0] mb-3">{t('presentation.kick_participant_title')}</h2>
            <p className="text-[#B0B0B0] mb-6 text-sm sm:text-base">
              {t('presentation.kick_participant_description', { participant: participantToKick })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelKickParticipant}
                className="px-4 py-2 rounded-lg border border-[#2A2A2A] bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333333] transition-all active:scale-95"
              >
                {t('presentation.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmKickParticipant}
                className="px-4 py-2 bg-[#EF5350] text-white hover:bg-[#E53935] transition-all rounded-lg active:scale-95 shadow-lg shadow-red-500/20"
              >
                {t('presentation.kick')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCancelEndPresentation}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#1F1F1F] border border-[#2A2A2A] p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0] mb-3">{t('presentation.end_presentation_title') || 'End presentation?'}</h2>
            <p className="text-[#B0B0B0] mb-6 text-sm sm:text-base">
              {t('presentation.end_presentation_description') || "Participants will be disconnected and won't be able to submit further responses."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEndPresentation}
                className="px-4 py-2 rounded-lg border border-[#2A2A2A] bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333333] transition-all active:scale-95"
              >
                {t('presentation.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmEndPresentation}
                className="px-4 py-2 bg-[#EF5350] text-white hover:bg-[#E53935] transition-all rounded-lg active:scale-95 shadow-lg shadow-red-500/20"
              >
                {t('presentation.end_presentation') || 'End Presentation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentMode;