import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Settings as SettingsIcon, Share2, X, Plus, MessageCircle } from 'lucide-react';
import SlideBar from '../presentation/SlideBar';
import NewSlideDropdown from '../presentation/NewSlideDropdown';
import SlideCanvas from '../presentation/SlideCanvas';
import SlideEditor from '../presentation/SlideEditor';
import EmptyState from '../presentation/EmptyState';
import ShareModal from '../presentation/ShareModal';
import * as presentationService from '../../services/presentationService';
import { deletePresentation } from '../../services/presentationService';
import { defaultOpenEndedSettings } from '../interactions/openEnded/utils';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from '../common/ConfirmDialog';
import PresentationResults from '../presentation/PresentationResults';
import Chatbot from '../common/Chatbot';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../utils/errorTranslator';

export default function Presentation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const { state } = useLocation();
  const { t } = useTranslation();
  
  // Check if we came from institution admin dashboard
  const fromInstitutionAdmin = state?.fromInstitutionAdmin || sessionStorage.getItem('institutionAdminToken');
  
  // Helper function to navigate back to the appropriate dashboard
  const navigateToDashboard = () => {
    if (fromInstitutionAdmin) {
      navigate('/institution-admin');
    } else {
      navigate('/dashboard');
    }
  };
  const [presentation, setPresentation] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(state?.currSlide || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSlideDropdown, setShowNewSlideDropdown] = useState(false);
  const [showSlideEditor, setShowSlideEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [draftDialog, setDraftDialog] = useState({ open: false, draft: null });
  const [exitDialog, setExitDialog] = useState({ open: false, isProcessing: false });
  const [skipDraftSave, setSkipDraftSave] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, slideIndex: null });
  const [savedSlideCount, setSavedSlideCount] = useState(0);
  const [showChatbot, setShowChatbot] = useState(false);

  // Initialize or load presentation
  useEffect(() => {
    const initPresentation = async () => {
      console.log('Initializing presentation, id:', id);

      if (id && id !== 'new') {
        // Load existing presentation
        console.log('Loading existing presentation:', id);
        await loadPresentation(id, state?.initialSlides);
      } else {
        // Create new presentation
        console.log('Creating new presentation');
        await createNewPresentation();
      }
    };

    initPresentation();
    // eslint-disable-next-line
  }, [id]);

  // Save to localStorage (draft)
  const saveToLocalStorage = useCallback(() => {
    if (!presentation) return;

    presentationService.saveDraftToLocalStorage(presentation.id, {
      presentation,
      slides,
      currentSlideIndex,
    });
  }, [presentation, slides, currentSlideIndex]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (!presentation) return;
    
    if (skipDraftSave) {
      setSkipDraftSave(false);
      return;
    }
    if (!isDirty) return;
    saveToLocalStorage();
  }, [presentation, slides, currentSlideIndex, saveToLocalStorage, skipDraftSave, isDirty]);

  useEffect(() => {
    if (!presentation) return;

    const handleBeforeUnload = () => {
      saveToLocalStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [presentation, slides, currentSlideIndex, saveToLocalStorage]);

  // Load presentation from backend
  const loadPresentation = async (presentationId, initialSlides = null) => {
    try {
      setIsLoading(true);
      const data = await presentationService.getPresentationById(presentationId);

      if (!data || !data.presentation) {
        throw new Error('Presentation not found');
      }

      setPresentation(data.presentation);

      if (initialSlides && initialSlides.length > 0) {
        // Use template slides if provided (unsaved state)
        console.log('Using template slides:', initialSlides);
        setSlides(initialSlides);
        setSavedSlideCount(0); // None are saved in DB yet
        setIsDirty(true); // Mark as dirty so user is prompted to save
        setSkipDraftSave(false); // Allow saving to draft
      } else {
        // Map backend slides to frontend format (id -> _id)
        const mappedSlides = (data.slides || []).map(slide => {
          // If slide has quizSettings but type is not 'quiz', treat it as a quiz slide
          const isQuizSlide = slide.type === 'quiz' || (slide.quizSettings && slide.type === 'multiple_choice');
          
          const mappedSlide = {
            ...slide,
            id: slide.id || `slide-${Date.now()}-${Math.random()}`,
            // Override type if it has quizSettings but wrong type
            type: isQuizSlide ? 'quiz' : slide.type,
            openEndedSettings: slide.type === 'open_ended'
              ? (slide.openEndedSettings || defaultOpenEndedSettings())
              : slide.openEndedSettings,
            qnaSettings: slide.type === 'qna'
              ? (slide.qnaSettings || { allowMultiple: false })
              : slide.qnaSettings,
            guessNumberSettings: slide.type === 'guess_number'
              ? (slide.guessNumberSettings || { minValue: 1, maxValue: 10, correctAnswer: 5 })
              : slide.guessNumberSettings,
            // Preserve quizSettings if they exist
            quizSettings: slide.quizSettings,
            _id: slide.id
          };
          
          // Preserve PDF fields if it's a PDF slide
          if (slide.type === 'pdf') {
            mappedSlide.pdfUrl = slide.pdfUrl || '';
            mappedSlide.pdfPublicId = slide.pdfPublicId || null;
            mappedSlide.pdfPages = Array.isArray(slide.pdfPages) ? slide.pdfPages : [];
          }
          
          return mappedSlide;
        });

        // Preserve the actual order from the backend - don't force instruction slides to the beginning
        // Just sort by the order property that comes from the backend
        const orderedSlides = mappedSlides.sort((a, b) => (a.order || 0) - (b.order || 0));

        setSkipDraftSave(true);
        setSlides(orderedSlides);
        setSavedSlideCount(orderedSlides.length);
        setIsDirty(false);

        // Check if there's a draft in localStorage
        // Only show draft dialog if there are actual unsaved changes
        const draft = presentationService.getDraftFromLocalStorage(presentationId);
        if (draft) {
          const draftSlides = draft.slides || [];
          const savedSlides = orderedSlides;
          
          // Check if draft has unsaved changes by comparing with saved state
          const hasUnsavedChanges = (() => {
            // If all slides are saved (all have _id), check if draft has any unsaved slides
            const allSlidesSaved = savedSlides.every(slide => slide._id);
            
            if (allSlidesSaved) {
              // All current slides are saved, check if draft has unsaved slides
              const draftHasUnsavedSlides = draftSlides.some(slide => !slide._id);
              
              // If draft has unsaved slides but all current slides are saved, there are unsaved changes
              if (draftHasUnsavedSlides) {
                return true;
              }
              
              // If slide counts differ, there might be unsaved changes
              if (draftSlides.length !== savedSlides.length) {
                return true;
              }
              
              // If title changed, there are unsaved changes
              if (draft.presentation?.title !== data.presentation?.title) {
                return true;
              }
              
              // All slides are saved and draft matches saved state, no unsaved changes
              return false;
            }
            
            // If not all slides are saved, there might be unsaved changes
            // Show dialog to let user decide
            return true;
          })();
          
          // Only show draft dialog if there are actual unsaved changes
          if (hasUnsavedChanges) {
            setDraftDialog({ open: true, draft });
          } else {
            // Draft matches saved state (all slides saved), clear it silently
            presentationService.clearDraftFromLocalStorage(presentationId);
          }
        }
      }
    } catch (error) {
      console.error('Load presentation error:', error);
      
      // Handle 404 specifically - presentation was deleted or doesn't exist
      if (error.response?.status === 404 || error.message?.includes('not found')) {
        toast.error(t('toasts.presentation.not_found') || 'Presentation not found');
        // Clear any local draft for this presentation
        if (presentationId) {
          presentationService.clearDraftFromLocalStorage(presentationId);
        }
      } else {
        toast.error(t('toasts.presentation.failed_to_load') || 'Failed to load presentation');
      }
      
      // Navigate back to appropriate dashboard
      navigateToDashboard();
    } finally {
      setIsLoading(false);
    }
  };

  // Create new presentation
  const createNewPresentation = async () => {
    try {
      setIsLoading(true);
      const response = await presentationService.createPresentation(t('presentation.untitled_presentation'));

      setPresentation(response.presentation);
      setSkipDraftSave(true);
      setSlides([]);
      setSavedSlideCount(0);
      setIsDirty(false);
      setIsLoading(false);

      // Update URL to include the new presentation ID without replace
      // Preserve the fromInstitutionAdmin state when navigating
      navigate(`/presentation/${response.presentation.id}`, { 
        state: { fromInstitutionAdmin: fromInstitutionAdmin } 
      });

      toast.success(t('toasts.presentation.created'));
    } catch (error) {
      console.error('Create presentation error:', error);
      toast.error(t('toasts.presentation.failed_to_create'));
      setIsLoading(false);
      navigateToDashboard();
    }
  };

  const handleRestoreDraft = useCallback(() => {
    const draftData = draftDialog.draft;
    if (!draftData) return;

    if (draftData.presentation) {
      setPresentation(draftData.presentation);
    }

    // Ensure each slide has a unique ID
    // Ensure each slide has a unique ID
    const restoredSlides = Array.isArray(draftData.slides) 
      ? draftData.slides.map(slide => ({
          ...slide,
          id: slide.id || `slide-${Date.now()}-${Math.random()}`
        }))
      : [];

    // Preserve the actual order from the draft - don't force instruction slides to the beginning
    // Just sort by the order property that comes from the draft
    const orderedSlides = restoredSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    setSkipDraftSave(true);
    setSlides(orderedSlides);

    const maxIndex = orderedSlides.length > 0 ? orderedSlides.length - 1 : 0;
    const restoredIndex =
      typeof draftData.currentSlideIndex === 'number'
        ? Math.min(Math.max(draftData.currentSlideIndex, 0), maxIndex)
        : 0;
    setCurrentSlideIndex(restoredIndex);

    presentationService.clearDraftFromLocalStorage();
    setIsDirty(false);
    setDraftDialog({ open: false, draft: null });
    toast.success(t('toasts.presentation.draft_restored'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftDialog]);

  const handleDiscardDraft = useCallback(() => {
    presentationService.clearDraftFromLocalStorage();
    setDraftDialog({ open: false, draft: null });
    toast.success(t('toasts.presentation.draft_discarded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to backend
  const saveToBackend = async () => {
    if (!presentation) return false;

    const currentSlideRef = slides[currentSlideIndex] ?? null;
    const previousSlideId = currentSlideRef?._id || currentSlideRef?.id;

    // Add order property to each slide based on its position in the array
    const normalizedSlides = slides.map((slide, index) => {
      const trimmedQuestion = typeof slide.question === 'string' ? slide.question.trim() : slide.question;

      // Add order property to slide
      const slideWithOrder = {
        ...slide,
        order: index,
        question: trimmedQuestion,
      };

      if (slide.type === 'quiz') {
        const existingSettings = slide.quizSettings || {
          options: Array.isArray(slide.options)
            ? slide.options.map(opt => {
              if (!opt) {
                return { id: uuidv4(), text: '' };
              }
              if (typeof opt === 'string') {
                return { id: uuidv4(), text: opt };
              }
              return {
                id: opt.id || uuidv4(),
                text: typeof opt.text === 'string' ? opt.text : '',
              };
            })
            : [
              { id: uuidv4(), text: '' },
              { id: uuidv4(), text: '' },
            ],
          correctOptionId: '',
          timeLimit: 30,
          points: 1000,
        };
        const rawOptions = Array.isArray(existingSettings.options)
          ? existingSettings.options
          : Array.isArray(slide.options)
            ? slide.options
            : [];
        // eslint-disable-next-line
        const normalizedOptions = rawOptions.map((option, index) => {
          if (!option) {
            return { id: uuidv4(), text: '' };
          }

          if (typeof option === 'string') {
            return { id: uuidv4(), text: option };
          }

          return {
            id: option.id || uuidv4(),
            text: typeof option.text === 'string' ? option.text : '',
          };
        });

        // Guarantee at least two options for validation
        while (normalizedOptions.length < 2) {
          normalizedOptions.push({ id: uuidv4(), text: '' });
        }

        const requestedCorrectId = existingSettings.correctOptionId;
        const hasValidCorrect = normalizedOptions.some(opt => opt.id === requestedCorrectId);
        const correctOptionId = hasValidCorrect ? requestedCorrectId : '';

        const timeLimitValue = Number(existingSettings.timeLimit) || 30;
        const clampedTimeLimit = Math.max(5, Math.min(300, timeLimitValue));

        return {
          ...slideWithOrder,
          quizSettings: {
            options: normalizedOptions,
            correctOptionId,
            timeLimit: clampedTimeLimit,
            points: Number(existingSettings.points) || 1000,
          },
          options: undefined,
        };
      }

      // Normalize scales statements - filter out empty statements
      if (slideWithOrder.type === 'scales' && Array.isArray(slideWithOrder.statements)) {
        slideWithOrder.statements = slideWithOrder.statements
          .map(stmt => {
            // Handle both string and object formats
            if (typeof stmt === 'string') return stmt.trim();
            if (stmt && typeof stmt === 'object' && stmt.text) return stmt.text.trim();
            return '';
          })
          .filter(stmt => stmt.length > 0); // Filter out empty statements
      }

      // Normalize ranking items - filter out empty items (preserve object structure)
      if (slideWithOrder.type === 'ranking' && Array.isArray(slideWithOrder.rankingItems)) {
        slideWithOrder.rankingItems = slideWithOrder.rankingItems
          .filter(item => {
            if (!item) return false;
            const text = item.text || item.label || '';
            return text.trim().length > 0;
          })
          .map(item => ({
            id: item.id,
            label: (item.text || item.label || '').trim()
          }));
      }

      // Normalize hundred points items - filter out empty items (preserve object structure)
      if (slideWithOrder.type === 'hundred_points' && Array.isArray(slideWithOrder.hundredPointsItems)) {
        slideWithOrder.hundredPointsItems = slideWithOrder.hundredPointsItems
          .filter(item => {
            if (!item) return false;
            const text = item.text || item.label || '';
            return text.trim().length > 0;
          })
          .map(item => ({
            id: item.id,
            label: (item.text || item.label || '').trim()
          }));
      }

      // Normalize grid items - filter out empty items (preserve object structure)
      if (slideWithOrder.type === '2x2_grid' && Array.isArray(slideWithOrder.gridItems)) {
        slideWithOrder.gridItems = slideWithOrder.gridItems
          .filter(item => {
            if (!item) return false;
            const text = item.text || item.label || '';
            return text.trim().length > 0;
          })
          .map(item => ({
            id: item.id,
            label: (item.text || item.label || '').trim() // Backend expects 'label' field
          }));
      }

      // Normalize pin_on_image settings - ensure imageUrl is preserved
      if (slideWithOrder.type === 'pin_on_image') {
        // If pinOnImageSettings exists but imageUrl is missing, try to get it from top-level imageUrl
        if (slideWithOrder.pinOnImageSettings) {
          if (!slideWithOrder.pinOnImageSettings.imageUrl && slideWithOrder.imageUrl) {
            slideWithOrder.pinOnImageSettings.imageUrl = slideWithOrder.imageUrl;
          }
        } else if (slideWithOrder.imageUrl) {
          // If pinOnImageSettings doesn't exist but imageUrl does, create pinOnImageSettings
          slideWithOrder.pinOnImageSettings = {
            imageUrl: slideWithOrder.imageUrl,
            imagePublicId: slideWithOrder.imagePublicId || null,
            correctArea: null
          };
        }
      }

      return slideWithOrder;
    });

    // Validate all slides before saving
    for (let i = 0; i < normalizedSlides.length; i++) {
      const slide = normalizedSlides[i];
      const slideNumber = i + 1;

      // Basic validation
      if (!slide?.type) {
        toast.error(t('toasts.presentation.slide_missing_type', { number: slideNumber }));
        return false;
      }

      // Skip question validation for instruction slides since they are auto-generated
      if (slide.type !== 'instruction' && (typeof slide.question !== 'string' || slide.question.trim().length === 0)) {
        toast.error(t('toasts.presentation.slide_missing_question', { number: slideNumber }));
        return false;
      }

      // Quiz-specific validation
      if (slide.type === 'quiz') {
        const settings = slide.quizSettings;

        if (!settings || !Array.isArray(settings.options) || settings.options.length < 2) {
          toast.error(t('toasts.presentation.quiz_min_options', { number: slideNumber }));
          return false;
        }

        // Check if all options have text
        const emptyOption = settings.options.findIndex(opt => !opt.text || opt.text.trim() === '');
        if (emptyOption !== -1) {
          toast.error(t('toasts.presentation.quiz_empty_option', { number: slideNumber, optionNumber: emptyOption + 1 }));
          return false;
        }

        // Check if correct answer is selected
        if (!settings.correctOptionId) {
          toast.error(t('toasts.presentation.quiz_select_correct', { number: slideNumber }));
          return false;
        }
      }

      // MCQ validation
      if (slide.type === 'multiple_choice') {
        if (!Array.isArray(slide.options) || slide.options.length < 2) {
          toast.error(t('toasts.presentation.mcq_min_options', { number: slideNumber }));
          return false;
        }

        // Check if all options have text
        const emptyOption = slide.options.findIndex(opt => !opt || opt.trim() === '');
        if (emptyOption !== -1) {
          toast.error(t('toasts.presentation.mcq_empty_option', { number: slideNumber, optionNumber: emptyOption + 1 }));
          return false;
        }
      }

      // Scales validation
      if (slide.type === 'scales') {
        if (typeof slide.minValue !== 'number' || typeof slide.maxValue !== 'number') {
          toast.error(t('toasts.presentation.scales_min_max_required', { number: slideNumber }));
          return false;
        }

        if (slide.minValue >= slide.maxValue) {
          toast.error(t('toasts.presentation.scales_min_less_than_max', { number: slideNumber }));
          return false;
        }

        // Normalize statements - handle both string and object formats
        const normalizedStatements = Array.isArray(slide.statements) 
          ? slide.statements.map(stmt => {
              if (typeof stmt === 'string') return stmt.trim();
              if (stmt && typeof stmt === 'object' && stmt.text) return stmt.text.trim();
              return '';
            }).filter(stmt => stmt.length > 0) // Filter out empty statements
          : [];

        if (normalizedStatements.length === 0) {
          toast.error(t('toasts.presentation.scales_statement_required', { number: slideNumber }));
          return false;
        }
      }

      // Ranking validation
      if (slide.type === 'ranking') {
        // Normalize ranking items - filter out empty items
        const normalizedRankingItems = Array.isArray(slide.rankingItems)
          ? slide.rankingItems
              .map(item => {
                if (!item) return null;
                const text = item.text || item.label || '';
                return text.trim();
              })
              .filter((text) => {
                // Keep items with text
                if (text && text.length > 0) return true;
                return false;
              })
          : [];

        if (normalizedRankingItems.length < 2) {
          toast.error(t('toasts.presentation.ranking_min_items', { number: slideNumber }));
          return false;
        }
      }

      // 100 Points validation
      if (slide.type === 'hundred_points') {
        // Normalize hundred points items - filter out empty items
        const normalizedHundredPointsItems = Array.isArray(slide.hundredPointsItems)
          ? slide.hundredPointsItems
              .map(item => {
                if (!item) return null;
                const text = item.text || item.label || '';
                return text.trim();
              })
              .filter((text) => {
                // Keep items with text
                if (text && text.length > 0) return true;
                return false;
              })
          : [];

        if (normalizedHundredPointsItems.length < 2) {
          toast.error(t('toasts.presentation.hundred_points_min_items', { number: slideNumber }));
          return false;
        }
      }

      // 2x2 Grid validation
      if (slide.type === '2x2_grid') {
        // Normalize grid items - filter out empty items
        const normalizedGridItems = Array.isArray(slide.gridItems)
          ? slide.gridItems
              .map(item => {
                if (!item) return null;
                const text = item.text || item.label || '';
                return text.trim();
              })
              .filter((text) => {
                // Keep items with text
                if (text && text.length > 0) return true;
                return false;
              })
          : [];

        if (normalizedGridItems.length < 1) {
          toast.error(t('toasts.presentation.grid_min_items', { number: slideNumber }));
          return false;
        }
      }

      // Pin on Image validation
      if (slide.type === 'pin_on_image') {
        const imageUrl = slide.pinOnImageSettings?.imageUrl || slide.imageUrl || '';
        if (!imageUrl || imageUrl.trim() === '') {
          toast.error(t('toasts.presentation.pin_image_url_required', { number: slideNumber }));
          return false;
        }
      }

      // Text slide validation
      if (slide.type === 'text' && (!slide.textContent || slide.textContent.trim() === '')) {
        toast.error(t('toasts.presentation.text_content_required', { number: slideNumber }));
        return false;
      }

      // Image slide validation
      if (slide.type === 'image' && (!slide.imageUrl || slide.imageUrl.trim() === '')) {
        toast.error(t('toasts.presentation.image_url_required', { number: slideNumber }));
        return false;
      }

      // Video slide validation
      if (slide.type === 'video' && (!slide.videoUrl || slide.videoUrl.trim() === '')) {
        toast.error(t('toasts.presentation.video_url_required', { number: slideNumber }));
        return false;
      }
    }

    try {
      setIsSaving(true);

      // Update presentation title
      await presentationService.updatePresentation(presentation.id, {
        title: presentation.title
      });

      // Save all slides and collect updated slides with backend IDs
      const updatedSlides = [];
      for (const slide of normalizedSlides) {
        if (slide._id) {
          // Calculate correct type - if slide has quizSettings, ensure type is 'quiz'
          const slideType = (slide.quizSettings && slide.type !== 'quiz') ? 'quiz' : slide.type;
          
          // Update existing slide
          const response = await presentationService.updateSlide(presentation.id, slide._id, {
            type: slideType,
            question: slide.question,
            options: slide.options,
            minValue: slide.minValue,
            maxValue: slide.maxValue,
            minLabel: slide.minLabel,
            maxLabel: slide.maxLabel,
            statements: slide.statements,
            rankingItems: slide.rankingItems,
            hundredPointsItems: slide.hundredPointsItems,
            gridItems: slideType === '2x2_grid' ? slide.gridItems : undefined,
            gridAxisXLabel: slideType === '2x2_grid' ? slide.gridAxisXLabel : undefined,
            gridAxisYLabel: slideType === '2x2_grid' ? slide.gridAxisYLabel : undefined,
            gridAxisRange: slideType === '2x2_grid' ? slide.gridAxisRange : undefined,
            maxWordsPerParticipant: slide.maxWordsPerParticipant,
            openEndedSettings: slideType === 'open_ended' ? slide.openEndedSettings : undefined,
            qnaSettings: slideType === 'qna' ? slide.qnaSettings : undefined,
            guessNumberSettings: slideType === 'guess_number' ? slide.guessNumberSettings : undefined,
            pinOnImageSettings: slideType === 'pin_on_image' ? slide.pinOnImageSettings : undefined,
            quizSettings: (slideType === 'quiz' || slide.quizSettings) ? slide.quizSettings : undefined,
            // Fields for text slide type
            textContent: slideType === 'text' ? slide.textContent : undefined,
            // Fields for image slide type
            imageUrl: slideType === 'image' ? slide.imageUrl : undefined,
            imagePublicId: slideType === 'image' ? slide.imagePublicId : undefined,
            // Fields for video slide type
            videoUrl: slideType === 'video' ? slide.videoUrl : undefined,
            // Fields for instruction slide type
            instructionContent: slideType === 'instruction' ? slide.instructionContent : undefined,
            // Fields for "Bring Your Slides In" slide types
            ...(slideType === 'miro' && { miroUrl: slide.miroUrl || '' }),
            ...(slideType === 'powerpoint' && { 
              // Don't save blob URLs - they're temporary and won't work after page reload
              powerpointUrl: (slide.powerpointUrl && !slide.powerpointUrl.trim().startsWith('blob:')) ? slide.powerpointUrl : '',
              ...(slide.powerpointPublicId && { powerpointPublicId: slide.powerpointPublicId })
            }),
            ...(slideType === 'google_slides' && { googleSlidesUrl: slide.googleSlidesUrl || '' }),
            ...(slideType === 'pdf' && { 
              pdfUrl: slide.pdfUrl || '',
              ...(slide.pdfPublicId && { pdfPublicId: slide.pdfPublicId }),
              ...(slide.pdfPages && { pdfPages: slide.pdfPages })
            }),
            // Add order property
            order: slide.order
          });
          
          // Use response.slide to get the latest data from backend (including PDF fields)
          updatedSlides.push({
            ...slide,
            ...response.slide, // Merge response data to ensure we have latest PDF fields
            _id: response.slide.id,
            id: response.slide.id
          });
        } else {
          // Calculate correct type - if slide has quizSettings, ensure type is 'quiz'
          const slideType = (slide.quizSettings && slide.type !== 'quiz') ? 'quiz' : slide.type;
          
          // Create new slide
          const response = await presentationService.createSlide(presentation.id, {
            type: slideType,
            question: slide.question,
            options: slide.options,
            minValue: slide.minValue,
            maxValue: slide.maxValue,
            minLabel: slide.minLabel,
            maxLabel: slide.maxLabel,
            statements: slide.statements,
            rankingItems: slide.rankingItems,
            hundredPointsItems: slide.hundredPointsItems,
            gridItems: slideType === '2x2_grid' ? slide.gridItems : undefined,
            gridAxisXLabel: slideType === '2x2_grid' ? slide.gridAxisXLabel : undefined,
            gridAxisYLabel: slideType === '2x2_grid' ? slide.gridAxisYLabel : undefined,
            gridAxisRange: slideType === '2x2_grid' ? slide.gridAxisRange : undefined,
            maxWordsPerParticipant: slide.maxWordsPerParticipant,
            openEndedSettings: slideType === 'open_ended' ? slide.openEndedSettings : undefined,
            qnaSettings: slideType === 'qna' ? slide.qnaSettings : undefined,
            guessNumberSettings: slideType === 'guess_number' ? slide.guessNumberSettings : undefined,
            pinOnImageSettings: slideType === 'pin_on_image' ? slide.pinOnImageSettings : undefined,
            quizSettings: (slideType === 'quiz' || slide.quizSettings) ? slide.quizSettings : undefined,
            // Fields for text slide type
            textContent: slideType === 'text' ? slide.textContent : undefined,
            // Fields for image slide type
            imageUrl: slideType === 'image' ? slide.imageUrl : undefined,
            imagePublicId: slideType === 'image' ? slide.imagePublicId : undefined,
            // Fields for video slide type
            videoUrl: slideType === 'video' ? slide.videoUrl : undefined,
            // Fields for instruction slide type
            instructionContent: slideType === 'instruction' ? slide.instructionContent : undefined,
            // Fields for "Bring Your Slides In" slide types
            ...(slideType === 'miro' && { miroUrl: slide.miroUrl || '' }),
            ...(slideType === 'powerpoint' && { 
              // Don't save blob URLs - they're temporary and won't work after page reload
              powerpointUrl: (slide.powerpointUrl && !slide.powerpointUrl.trim().startsWith('blob:')) ? slide.powerpointUrl : '',
              ...(slide.powerpointPublicId && { powerpointPublicId: slide.powerpointPublicId })
            }),
            ...(slideType === 'google_slides' && { googleSlidesUrl: slide.googleSlidesUrl || '' }),
            ...(slideType === 'pdf' && { 
              pdfUrl: slide.pdfUrl || '',
              ...(slide.pdfPublicId && { pdfPublicId: slide.pdfPublicId }),
              ...(slide.pdfPages && { pdfPages: slide.pdfPages })
            }),
            // Add order property
            order: slide.order
          });

          // Add slide with backend ID to updated slides
          // Use response.slide data to ensure we have the latest data from backend (including PDF fields)
          updatedSlides.push({
            ...slide,
            ...response.slide, // Merge response data to get latest PDF fields
            _id: response.slide.id
          });

          // If quiz slide, also add auto-generated leaderboard slide
          if (response.leaderboardSlide) {
            updatedSlides.push({
              _id: response.leaderboardSlide.id,
              type: response.leaderboardSlide.type,
              question: response.leaderboardSlide.question,
              leaderboardSettings: response.leaderboardSlide.leaderboardSettings,
              order: response.leaderboardSlide.order
            });
          }
        }
      }

      // Update slides state with backend IDs
      setSkipDraftSave(true);
      setSlides(updatedSlides);
      setSavedSlideCount(updatedSlides.length);
      setIsDirty(false);

      // Restore current slide index based on previous slide ID
      if (previousSlideId) {
        const newIndex = updatedSlides.findIndex(s => s._id === previousSlideId);
        if (newIndex !== -1 && newIndex !== currentSlideIndex) {
          setCurrentSlideIndex(newIndex);
        }
      }

      // Clear localStorage after successful save
      presentationService.clearDraftFromLocalStorage();

      toast.success(t('toasts.presentation.saved'));
      return true;
    } catch (error) {
      console.error('Save error:', error);
      if (error?.response) {
        console.error('Save error response data:', error.response.data);
        console.error('Save error status:', error.response.status);
      }
      toast.error(t('toasts.presentation.failed_to_save'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle title change
  const handleTitleChange = (e) => {
    setPresentation(prev => ({
      ...prev,
      title: e.target.value
    }));
    setIsDirty(true);
  };

  // Handle add slide
  const handleAddSlide = (slideType) => {
    if (!presentation) return;

    const isFirstSlide = slides.length === 0;
    
    // Check if trying to add a second instruction slide
    if (slideType === 'instruction') {
      const existingInstructionSlide = slides.find(slide => slide.type === 'instruction');
      if (existingInstructionSlide) {
        toast.error(t('toasts.presentation.only_one_instruction_slide'));
        setShowNewSlideDropdown(false);
        return;
      }
    }

    // Generate a temporary ID for new slides
    const tempId = `temp-${uuidv4()}`;

    // Create new slide object with appropriate defaults
    const newSlide = {
      id: tempId,
      type: slideType,
      question: slideType === 'instruction' ? t('slide_editors.instruction.instructions_title') : '',
      order: slides.length,
      // Initialize fields based on slide type
      ...(slideType === 'multiple_choice' && {
        options: ['', '']
      }),
      ...(slideType === 'word_cloud' && {
        maxWordsPerParticipant: 3
      }),
      ...(slideType === 'open_ended' && {
        openEndedSettings: defaultOpenEndedSettings()
      }),
      ...(slideType === 'scales' && {
        minValue: 1,
        maxValue: 5,
        minLabel: t('slide_editors.scales.default_min_label'),
        maxLabel: t('slide_editors.scales.default_max_label'),
        statements: [{ id: uuidv4(), text: '' }]
      }),
      ...(slideType === 'ranking' && {
        rankingItems: [
          { id: uuidv4(), text: '' },
          { id: uuidv4(), text: '' }
        ]
      }),
      ...(slideType === 'qna' && {
        qnaSettings: { allowMultiple: false }
      }),
      ...(slideType === 'guess_number' && {
        guessNumberSettings: { minValue: 1, maxValue: 10, correctAnswer: 5 }
      }),
      ...(slideType === 'hundred_points' && {
        hundredPointsItems: [
          { id: uuidv4(), label: '' },
          { id: uuidv4(), label: '' }
        ]
      }),
      ...(slideType === '2x2_grid' && {
        gridItems: [
          { id: uuidv4(), text: '' },
          { id: uuidv4(), text: '' }
        ],
        gridAxisXLabel: '',
        gridAxisYLabel: '',
        gridAxisRange: { min: 0, max: 10 }
      }),
      ...(slideType === 'pin_on_image' && {
        pinOnImageSettings: null
      }),
      ...(slideType === 'quiz' && {
        quizSettings: {
          options: [
            { id: uuidv4(), text: t('slide_editors.quiz.option_placeholder', { number: 1 }) },
            { id: uuidv4(), text: t('slide_editors.quiz.option_placeholder', { number: 2 }) }
          ],
          correctOptionId: '',
          timeLimit: 30,
          points: 1000,
        }
      }),
      ...(slideType === 'pick_answer' && {
        options: ['', '']
      }),
      ...(slideType === 'type_answer' && {
        openEndedSettings: {}
      }),
      ...(slideType === 'text' && {
        textContent: ''
      }),
      ...(slideType === 'image' && {
        imageUrl: ''
      }),
      ...(slideType === 'video' && {
        videoUrl: ''
      }),
      // "Bring Your Slides In" slide types
      ...(slideType === 'miro' && {
        miroUrl: ''
      }),
      ...(slideType === 'powerpoint' && {
        powerpointUrl: ''
      }),
      ...(slideType === 'google_slides' && {
        googleSlidesUrl: ''
      }),
      ...(slideType === 'pdf' && {
        pdfUrl: '',
        pdfPublicId: null,
        pdfPages: []
      }),
      // Instruction slide specific content
      ...(slideType === 'instruction' && {
        question: t('slide_editors.instruction.instructions_title'),
        content: {
          website: 'www.inavora.com',
          description: t('slide_editors.instruction.join_description')
        }
      })
    };

    // Initialize correctOptionId for quiz
    if (slideType === 'quiz' && newSlide.quizSettings?.options?.length > 0) {
      newSlide.quizSettings.correctOptionId = newSlide.quizSettings.options[0].id;
    }

    // Add locally - instruction slides should always be at the top initially
    if (slideType === 'instruction') {
      // Place instruction slide at the beginning with order 0
      newSlide.order = 0;
      // Update order of all existing slides (shift them by +1)
      setSlides(prev => {
        const updatedSlides = prev.map(slide => ({
          ...slide,
          order: (slide.order || 0) + 1
        }));
        return [newSlide, ...updatedSlides];
      });
      setCurrentSlideIndex(0);
    } else if (slideType === 'text') {
      // Place text slide at second position (after instruction slide if it exists)
      const instructionSlideIndex = slides.findIndex(slide => slide.type === 'instruction');
      
      if (instructionSlideIndex >= 0) {
        // Instruction slide exists - place text slide right after it (position 1)
        newSlide.order = 1;
        // Update order of slides after instruction slide (shift them by +1)
        setSlides(prev => {
          const updatedSlides = prev.map(slide => {
            const currentOrder = slide.order || 0;
            // Only shift slides that come after instruction slide (order >= 1)
            if (currentOrder >= 1) {
              return { ...slide, order: currentOrder + 1 };
            }
            return slide;
          });
          // Insert text slide at position 1 (right after instruction)
          const newSlidesArray = [...updatedSlides];
          newSlidesArray.splice(1, 0, newSlide);
          // Recalculate order for all slides to ensure consistency
          return newSlidesArray.map((slide, index) => ({
            ...slide,
            order: index
          }));
        });
        setCurrentSlideIndex(1);
      } else {
        // No instruction slide - place text slide at first position
        newSlide.order = 0;
        setSlides(prev => {
          const updatedSlides = prev.map(slide => ({
            ...slide,
            order: (slide.order || 0) + 1
          }));
          return [newSlide, ...updatedSlides];
        });
        setCurrentSlideIndex(0);
      }
    } else {
      // Add other slides normally at the end
      setSlides(prev => [...prev, newSlide]);
      setCurrentSlideIndex(slides.length);
    }
  
    setShowNewSlideDropdown(false);
    setShowSlideEditor(true);
    setIsDirty(true);

    if (isFirstSlide && presentation.accessCode) {
      toast.success(
        t('toasts.presentation.ready_to_share', { code: presentation.accessCode }),
        { duration: 5000 }
      );
    } else {
      toast.success(t('toasts.presentation.new_slide_added'));
    }
  };

  // Handle delete slide
  // Handle delete slide click
  const handleDeleteSlide = (index) => {
    if (slides.length === 1) {
      toast.error(t('toasts.presentation.cannot_delete_last_slide'));
      return;
    }

    const slideToDelete = slides[index];

    // Prevent deletion of auto-generated leaderboard slides
    if (slideToDelete.type === 'leaderboard' && slideToDelete.leaderboardSettings?.isAutoGenerated) {
      toast.error(t('toasts.presentation.leaderboard_cannot_delete'));
      return;
    }

    setDeleteDialog({ open: true, slideIndex: index });
  };

  // Confirm delete slide
  const handleConfirmDeleteSlide = async () => {
    const index = deleteDialog.slideIndex;
    if (index === null) return;

    const slideToDelete = slides[index];

    // If slide exists in backend, delete it
    if (slideToDelete._id) {
      try {
        const response = await presentationService.deleteSlide(presentation.id, slideToDelete._id);

        // If deleting a quiz slide, also remove the linked leaderboard from local state
        if (slideToDelete.type === 'quiz' && response.deletedLeaderboardId) {
          setSlides(prev => prev.filter((s, i) => {
            if (i === index) return false; // Remove quiz slide
            if (s._id === response.deletedLeaderboardId) return false; // Remove linked leaderboard
            return true;
          }));
        } else {
          setSlides(prev => prev.filter((_, i) => i !== index));
        }
      } catch (error) {
        console.error('Delete slide error:', error);
        toast.error(translateError(error, t, 'toasts.presentation.slide_deleted'));
        setDeleteDialog({ open: false, slideIndex: null });
        return;
      }
    } else {
      setSlides(prev => prev.filter((_, i) => i !== index));
    }

    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }

    toast.success(t('toasts.presentation.slide_deleted'));
    setIsDirty(true);
    setDeleteDialog({ open: false, slideIndex: null });
  };

  // Handle slide update
  const handleSlideUpdate = useCallback((updatedSlide) => {
    setSlides(prev => prev.map((s, i) =>
      i === currentSlideIndex ? { ...s, ...updatedSlide } : s
    ));
    setIsDirty(true);
  }, [currentSlideIndex]);

  // Handle slide reorder - allow moving instruction slide
  const handleSlideReorder = (dragIndex, dropIndex) => {
    const newSlides = [...slides];
    const draggedSlide = newSlides[dragIndex];
    
    // Remove the dragged slide
    newSlides.splice(dragIndex, 1);
    
    // Insert it at the new position
    newSlides.splice(dropIndex, 0, draggedSlide);
    
    // Update order field for all slides to match their new positions
    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      order: index
    }));
    
    // Update slides and current index
    setSlides(updatedSlides);
    
    // Update current slide index if needed
    if (currentSlideIndex === dragIndex) {
      setCurrentSlideIndex(dropIndex);
    } else if (currentSlideIndex === dropIndex) {
      setCurrentSlideIndex(dragIndex);
    } else if (dragIndex < currentSlideIndex && dropIndex >= currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (dragIndex > currentSlideIndex && dropIndex <= currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
    
    setIsDirty(true);
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    if (!presentation) {
      navigateToDashboard();
      return;
    }

    // Only show exit dialog if there are unsaved changes
    if (isDirty) {
      setExitDialog({ open: true, isProcessing: false });
    } else {
      // No unsaved changes, navigate directly
      navigateToDashboard();
    }
  };

  const handleConfirmExit = async () => {
    setExitDialog(prev => ({ ...prev, isProcessing: true }));
    const saved = await saveToBackend();
    if (saved) {
      setExitDialog({ open: false, isProcessing: false });
      navigateToDashboard();
    } else {
      setExitDialog(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleCancelExit = () => {
    setExitDialog({ open: false, isProcessing: false });
  };

  const handleExitWithoutSaving = async () => {
    if (savedSlideCount === 0 && presentation?.id) {
      try {
        await deletePresentation(presentation.id);
        toast.success(t('toasts.presentation.empty_discarded'));
      } catch (error) {
        console.error('Failed to delete empty presentation:', error);
      }
    }
    presentationService.clearDraftFromLocalStorage();
    setExitDialog({ open: false, isProcessing: false });
    navigateToDashboard();
  };

  // Handle present button
  const handlePresent = async () => {
    if (slides.length === 0) {
      toast.error(t('toasts.presentation.add_slide_before_presenting'));
      return;
    }

    // Save before presenting
    const saved = await saveToBackend();

    if (saved) {
      // Navigate to present mode with selected slide index
      navigate(`/present/${presentation.id}?slide=${currentSlideIndex}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-[#E0E0E0]">
        <div className="text-xl text-[#E0E0E0]">{t('presentation.loading')}</div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-[#E0E0E0]">
        <div className="text-xl text-[#E0E0E0]">{t('presentation.not_found')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0] flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-[#1F1F1F] border-b border-[#2A2A2A] sticky top-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 min-h-[56px] sm:min-h-[64px]">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={handleBackToDashboard}
              className="hidden sm:flex p-2.5 rounded-lg transition-all active:scale-95 bg-[#2A2A2A] hover:bg-[#333333] flex-shrink-0 touch-manipulation"
              title={t('presentation.back_to_dashboard')}
              aria-label={t('presentation.back_to_dashboard')}
            >
              <ArrowLeft className="h-5 w-5 text-[#E0E0E0]" />
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                type="text"
                value={presentation.title}
                onChange={handleTitleChange}
                className="text-xs sm:text-sm md:text-base font-medium text-[#E0E0E0] bg-transparent border border-transparent focus:border-[#388E3C] focus:bg-[#252525] outline-none hover:border-[#2F2F2F] px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-md transition-all flex-1 min-w-0 max-w-[120px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-none"
                placeholder={t('presentation.untitled')}
              />

              {/* Slide count and saving status - Hidden on very small screens */}
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs sm:text-sm font-medium text-[#B0B0B0] whitespace-nowrap">
                  {slides.length} {slides.length === 1 ? t('presentation.slide_singular') : t('presentation.slide_plural')}
                </span>
                {isSaving && (
                  <span className="text-xs sm:text-sm text-[#76C68F] whitespace-nowrap flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#76C68F] rounded-full animate-pulse"></div>
                    {t('presentation.saving')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Section - Tabs (Hidden on mobile, shown on tablet+) */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'create'
                ? 'text-[#4CAF50] bg-[#2A2A2A]'
                : 'text-[#8A8A8A] hover:text-[#B0B0B0] hover:bg-[#252525]'
                }`}
            >
              {t('presentation.create_tab')}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'results'
                ? 'text-[#4CAF50] bg-[#2A2A2A]'
                : 'text-[#8A8A8A] hover:text-[#B0B0B0] hover:bg-[#252525]'
                }`}
              >
              {t('presentation.results_tab')}
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={saveToBackend}
              className="p-2.5 sm:p-2.5 rounded-lg transition-all active:scale-95 bg-[#2A2A2A] hover:bg-[#333333] touch-manipulation"
              title={t('presentation.save')}
              aria-label={t('presentation.save')}
            >
              <Save className="h-5 w-5 text-[#E0E0E0]" />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all active:scale-95 bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333333] text-sm font-medium touch-manipulation"
            >
              <Share2 className="h-4 w-4 text-[#E0E0E0]" />
              <span className="hidden md:inline">{t('presentation.share')}</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="sm:hidden p-2.5 rounded-lg transition-all active:scale-95 bg-[#2A2A2A] hover:bg-[#333333] touch-manipulation"
              title={t('presentation.share')}
              aria-label={t('presentation.share')}
            >
              <Share2 className="h-5 w-5 text-[#E0E0E0]" />
            </button>
            <button
              onClick={handlePresent}
              className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20] text-white rounded-lg transition-all active:scale-95 text-xs sm:text-sm font-semibold shadow-[0_4px_12px_rgba(56,142,60,0.3)] hover:shadow-[0_6px_16px_rgba(56,142,60,0.4)] whitespace-nowrap touch-manipulation"
            >
              <span className="hidden sm:inline">{t('presentation.present')}</span>
              <span className="sm:hidden">{t('presentation.go')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs Row - Only on mobile/tablet */}
        <div className="md:hidden border-t border-[#2A2A2A] px-3 sm:px-4 bg-[#1F1F1F]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-3 sm:px-4 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-[0.98] ${activeTab === 'create'
                ? 'text-[#4CAF50] border-b-2 border-[#4CAF50] bg-[#252525]'
                : 'text-[#8A8A8A] active:text-[#B0B0B0]'
                }`}
            >
              {t('presentation.create_tab')}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 px-3 sm:px-4 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-[0.98] ${activeTab === 'results'
                ? 'text-[#4CAF50] border-b-2 border-[#4CAF50] bg-[#252525]'
                : 'text-[#8A8A8A] active:text-[#B0B0B0]'
                }`}
            >
              {t('presentation.results_tab')}
            </button>
          </div>
        </div>
      </nav>

      {/* Session Code Display - Shows when slides exist - Full width on mobile, absolute centered on desktop */}
      {slides.length > 0 && presentation.accessCode && activeTab !== 'results' && (
        <>
          {/* Mobile/Tablet - Sticky positioning */}
          <div className='md:hidden sticky top-[73px] sm:top-[81px] left-0 right-0 z-40 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 bg-[#1A1A1A]'>
            <div className="space-y-2">
              <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1F1F1F] rounded-lg border border-[#2F2F2F] shadow-[0_0_20px_rgba(0,0,0,0.35)] w-full mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-[#9ACFA7]">{t('presentation.ready_to_share')}</span>
                </div>
                <div className="h-6 w-px bg-[#2F2F2F]"></div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-[#E0E0E0] flex flex-row justify-center items-center gap-1 sm:gap-2 whitespace-nowrap">
                    <span className="text-[#B0B0B0]">{t('presentation.join_at')}</span>
                    <span className="font-semibold text-[#E0E0E0]">inavora.com</span>
                    <span>|</span>
                    <span className='text-base sm:text-lg font-semibold text-[#4CAF50]'>{presentation.accessCode}</span>
                  </p>
                </div>
              </div>
              
              {/* Edit Button - Only for mobile/tablet */}
              {slides.length > 0 && slides[currentSlideIndex]?.type !== 'instruction' && (
                <button
                  onClick={() => setShowSlideEditor(!showSlideEditor)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                    showSlideEditor 
                      ? 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-[0_4px_12px_rgba(76,175,80,0.3)]' 
                      : 'bg-[#1F1F1F] border-[#2F2F2F] text-[#E0E0E0] hover:bg-[#252525] hover:border-[#388E3C]'
                  }`}
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{showSlideEditor ? t('presentation.close_editor') : t('presentation.edit_slide')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop - Absolute positioning, centered */}
          <div className='hidden md:block absolute top-20 left-1/2 -translate-x-1/2 z-40'>
            <div className="flex flex-row items-center justify-center gap-3 px-4 py-2.5 bg-[#1F1F1F] rounded-lg border border-[#2F2F2F] shadow-[0_0_20px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-[#9ACFA7]">{t('presentation.ready_to_share')}</span>
              </div>
              <div className="h-6 w-px bg-[#2F2F2F]"></div>
              <div className="text-center">
                <p className="text-sm text-[#E0E0E0] flex flex-row justify-center items-center gap-2 whitespace-nowrap">
                  <span className="text-[#B0B0B0]">{t('presentation.join_at')}</span>
                  <span className="font-semibold text-[#E0E0E0]">inavora.com</span>
                  <span>|</span>
                  <span className='text-xl font-semibold text-[#4CAF50]'>{presentation.accessCode}</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0 overflow-hidden bg-[#1A1A1A] h-full">

        {/* Slide Sidebar - Only show in create mode */}
        {activeTab === 'create' && (
          <>
            {/* Desktop Sidebar - Always visible */}
            <div className="hidden lg:block absolute inset-y-0 left-0 z-30">
              <div className="relative h-full">
                <SlideBar
                  slides={slides}
                  currentSlideIndex={currentSlideIndex}
                  onSlideSelect={(index) => {
                    setCurrentSlideIndex(index);
                  }}
                  onDeleteSlide={handleDeleteSlide}
                  onNewSlideClick={() => setShowNewSlideDropdown(!showNewSlideDropdown)}
                  showNewSlideDropdown={showNewSlideDropdown}
                  onSlideReorder={handleSlideReorder}
                  isHorizontal={false}
                />

                {showNewSlideDropdown && (
                  <NewSlideDropdown
                    onSelectType={(type) => {
                      handleAddSlide(type);
                      setShowNewSlideDropdown(false);
                    }}
                    onClose={() => setShowNewSlideDropdown(false)}
                    user={user}
                  />
                )}
              </div>
            </div>

            {/* Mobile/Tablet Horizontal Slide Bar - Fixed at bottom */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
              <SlideBar
                slides={slides}
                currentSlideIndex={currentSlideIndex}
                onSlideSelect={(index) => {
                  setCurrentSlideIndex(index);
                }}
                onDeleteSlide={handleDeleteSlide}
                onNewSlideClick={() => setShowNewSlideDropdown(!showNewSlideDropdown)}
                showNewSlideDropdown={showNewSlideDropdown}
                onSlideReorder={handleSlideReorder}
                isHorizontal={true}
                onEditSlide={(index) => {
                  setCurrentSlideIndex(index);
                  setShowSlideEditor(true);
                }}
              />

              {showNewSlideDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 px-4">
                  <NewSlideDropdown
                    onSelectType={(type) => {
                      handleAddSlide(type);
                      setShowNewSlideDropdown(false);
                    }}
                    onClose={() => setShowNewSlideDropdown(false)}
                    isHorizontal={true}
                    user={user}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <div className={`flex-1 flex ${activeTab === 'create' ? 'lg:ml-44' : ''} bg-[#1A1A1A] ${activeTab === 'create' ? 'pb-24 sm:pb-24 lg:pb-0' : ''}`}>
          {activeTab === 'create' ? (
            <>
              {/* Canvas Area */}
              <div className="flex-1 bg-transparent flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 min-w-0 overflow-auto w-full">
                {slides.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="w-full max-w-full h-full flex items-center justify-center min-h-0">
                    <SlideCanvas
                      slide={slides[currentSlideIndex]}
                      presentation={presentation}
                    />
                  </div>
                )}
              </div>

              {/* Slide Editor Panel */}
              {slides.length > 0 && slides[currentSlideIndex]?.type !== 'instruction' && (
                <SlideEditor
                  slide={slides[currentSlideIndex]}
                  onUpdate={handleSlideUpdate}
                  onClose={() => setShowSlideEditor(false)}
                  isOpen={showSlideEditor}
                />
              )}

              {/* Right Sidebar - Edit/Comments/etc - Hidden on mobile */}
              {slides.length > 0 && slides[currentSlideIndex]?.type !== 'instruction' && (
                <>
                  {/* Desktop Sidebar */}
                  <aside className="hidden lg:flex w-16 bg-[#1F1F1F] border-l border-[#2A2A2A] flex-col items-center py-4 gap-6">
                    <button
                      onClick={() => setShowSlideEditor(!showSlideEditor)}
                      className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${showSlideEditor ? 'text-[#4CAF50]' : 'text-[#B0B0B0] hover:text-[#FFFFFF]'
                        }`}
                    >
                      <SettingsIcon className="h-5 w-5" />
                      <span className="text-xs">{t('presentation.edit_slide')}</span>
                    </button>
                  </aside>
                </>
              )}
            </>
          ) : (
            <PresentationResults
              slides={slides}
              presentationId={presentation?.id}
            />
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={draftDialog.open}
        title={t('presentation.restore_draft_title')}
        description={t('presentation.restore_draft_description')}
        confirmLabel={t('presentation.restore')}
        cancelLabel={t('presentation.discard')}
        onConfirm={handleRestoreDraft}
        onCancel={handleDiscardDraft}
      />
      <ConfirmDialog
        isOpen={exitDialog.open}
        title={t('presentation.save_before_exit_title')}
        description={t('presentation.save_before_exit_description')}
        confirmLabel={t('presentation.save_and_exit')}
        cancelLabel={t('presentation.cancel')}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        isLoading={exitDialog.isProcessing}
        secondaryAction={{
          label: t('presentation.exit_without_saving'),
          onClick: handleExitWithoutSaving
        }}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        accessCode={presentation?.accessCode}
        presentationId={presentation?.id}
      />
      <ConfirmDialog
        isOpen={deleteDialog.open}
        title={t('presentation.delete_slide_title')}
        description={t('presentation.delete_slide_description')}
        confirmLabel={t('presentation.delete')}
        cancelLabel={t('presentation.cancel')}
        onConfirm={handleConfirmDeleteSlide}
        onCancel={() => setDeleteDialog({ open: false, slideIndex: null })}
      />

      {/* Chatbot */}
      <Chatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />

      {/* Chatbot Icon Button - Floating */}
      {!showChatbot && (
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 p-3 lg:p-4 bg-gradient-to-r from-[#4CAF50] to-[#388E3C] hover:from-[#388E3C] hover:to-[#2E7D32] text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
          title={t('chatbot.open_chatbot')}
          aria-label={t('chatbot.open_chatbot')}
        >
          <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" />
        </button>
      )}

    </div>
  );
}

