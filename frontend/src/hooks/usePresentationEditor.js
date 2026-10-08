import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import * as presentationService from '../services/presentationService';
import { deletePresentation } from '../services/presentationService';
import { defaultOpenEndedSettings } from '../components/interactions/openEnded/utils';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import { getEffectivePlan } from '../utils/subscriptionUtils';

/**
 * All state, load/save/draft logic, and slide-editing handlers for the
 * presentation editor - everything Presentation.jsx needed except the
 * render tree. Split out of that file, which held all of this plus ~475
 * lines of JSX in one 1,811-line component; see CODE_STANDARDS.md.
 *
 * Returns every piece of state and every handler the render layer might
 * need; Presentation.jsx destructures only what it actually uses.
 * (showChatbot/setShowChatbot and the Chatbot import are pre-existing dead
 * code in the original file - genuinely unreferenced anywhere, not
 * something this split introduced or removed.)
 */
export function usePresentationEditor() {
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
  const [hoveredSlideType, setHoveredSlideType] = useState(null);
  const [showSlideEditor, setShowSlideEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [draftDialog, setDraftDialog] = useState({ open: false, draft: null });
  const [exitDialog, setExitDialog] = useState({ open: false, isProcessing: false });
  const [skipDraftSave, setSkipDraftSave] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAiGenerateModal, setShowAiGenerateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, slideIndex: null });
  const [savedSlideCount, setSavedSlideCount] = useState(0);
  const [showChatbot, setShowChatbot] = useState(false);

  const handleApplyTemplate = (template) => {
    if (!template?.slides || template.slides.length === 0) return;
    const newSlides = template.slides.map((s, idx) => ({
      id: uuidv4(),
      type: s.type || 'multiple_choice',
      question: s.title || s.question || 'Slide Question',
      options: s.options || ['Option 1', 'Option 2', 'Option 3'],
      order: slides.length + idx,
    }));
    setSlides((prev) => [...prev, ...newSlides]);
    setIsDirty(true);
    toast.success(`Applied template "${template.title}" (${newSlides.length} slides)`);
  };

  const effectivePlan = getEffectivePlan(user?.subscription);
  const isFreePlan = !user || effectivePlan === 'free';

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

          // Preserve PowerPoint fields if it's a PowerPoint slide
          if (slide.type === 'powerpoint') {
            mappedSlide.powerpointUrl = slide.powerpointUrl || '';
            mappedSlide.powerpointPublicId = slide.powerpointPublicId || null;
            mappedSlide.powerpointPages = Array.isArray(slide.powerpointPages) ? slide.powerpointPages : [];
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
            compareSettings: slideType === 'compare_slides' ? slide.compareSettings : undefined,
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
              ...(slide.powerpointPublicId && { powerpointPublicId: slide.powerpointPublicId }),
              ...(slide.powerpointPages && { powerpointPages: slide.powerpointPages })
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
            compareSettings: slideType === 'compare_slides' ? slide.compareSettings : undefined,
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
              ...(slide.powerpointPublicId && { powerpointPublicId: slide.powerpointPublicId }),
              ...(slide.powerpointPages && { powerpointPages: slide.powerpointPages })
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

  // Handle theme selection - applies and persists immediately, independent of the Save button
  const handleThemeSelect = async (themeId) => {
    if (!presentation) return;
    const previousTheme = presentation.theme;

    setPresentation(prev => ({ ...prev, theme: themeId }));

    try {
      await presentationService.updatePresentation(presentation.id, { theme: themeId });
      toast.success(t('theme_picker.applied'));
    } catch (error) {
      console.error('Theme update error:', error);
      setPresentation(prev => ({ ...prev, theme: previousTheme }));
      toast.error(error?.response?.data?.error || t('theme_picker.failed_to_apply'));
    }
  };

  // Append AI-generated slides to the current presentation (unsaved - same as adding a slide manually)
  const handleAiSlidesGenerated = (title, generatedSlides) => {
    setSlides(prev => [...prev, ...generatedSlides]);
    setCurrentSlideIndex(slides.length);
    setIsDirty(true);
    setShowAiGenerateModal(false);
    toast.success(t('ai_generate.slides_added', { count: generatedSlides.length }));
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
      ...(slideType === 'compare_slides' && {
        compareSettings: {
          optionA: { contentType: 'text', text: '', label: 'Option A' },
          optionB: { contentType: 'text', text: '', label: 'Option B' }
        }
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
    const previouslySelectedSlide = slides[currentSlideIndex];
    let updatedSlides = slides;

    // If slide exists in backend, delete it
    if (slideToDelete._id) {
      try {
        const response = await presentationService.deleteSlide(presentation.id, slideToDelete._id);

        // If deleting a quiz slide, also remove the linked leaderboard from local state
        // (this can remove two slides at once, so the index math below can't assume just one)
        if (slideToDelete.type === 'quiz' && response.deletedLeaderboardId) {
          updatedSlides = slides.filter((s, i) => {
            if (i === index) return false; // Remove quiz slide
            if (s._id === response.deletedLeaderboardId) return false; // Remove linked leaderboard
            return true;
          });
        } else {
          updatedSlides = slides.filter((_, i) => i !== index);
        }
      } catch (error) {
        console.error('Delete slide error:', error);
        toast.error(translateError(error, t, 'toasts.presentation.slide_deleted'));
        setDeleteDialog({ open: false, slideIndex: null });
        return;
      }
    } else {
      updatedSlides = slides.filter((_, i) => i !== index);
    }

    setSlides(updatedSlides);

    // Stay on whatever slide was being viewed (found by identity, not position),
    // since a single delete can remove more than one slide (quiz + its leaderboard).
    // If the viewed slide was itself one of the removed ones, clamp into range instead.
    const stillSelectedIndex = previouslySelectedSlide
      ? updatedSlides.findIndex(s => s.id === previouslySelectedSlide.id)
      : -1;

    setCurrentSlideIndex(
      stillSelectedIndex !== -1
        ? stillSelectedIndex
        : Math.max(0, Math.min(currentSlideIndex, updatedSlides.length - 1))
    );

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

  // Replace the current "powerpoint" container slide with one real slide per
  // converted page, so every page can be reordered/edited independently
  // instead of being trapped inside a single slide's internal pager.
  const handleExplodePowerPointToSlides = useCallback((pages, question) => {
    if (!pages || pages.length === 0) return;

    setSlides(prev => {
      const targetSlide = prev[currentSlideIndex];
      if (!targetSlide) return prev;

      // Every slide requires a non-empty question to pass save validation -
      // default to the original page number, but let the first slide keep
      // whatever question the user had already typed for the PowerPoint slide.
      const newSlides = pages.map((page, i) => ({
        id: i === 0 ? targetSlide.id : `temp-${uuidv4()}`,
        type: 'image',
        question: (i === 0 && question) ? question : `Slide ${page.pageNumber ?? i + 1}`,
        imageUrl: page.imageUrl,
      }));

      return [
        ...prev.slice(0, currentSlideIndex),
        ...newSlides,
        ...prev.slice(currentSlideIndex + 1),
      ].map((s, i) => ({ ...s, order: i }));
    });

    setIsDirty(true);
    toast.success(t('toasts.presentation.powerpoint_exploded', { count: pages.length }));
  }, [currentSlideIndex, t]);

  // Toggle whether new participants must be admitted by the presenter before
  // they can join. Persisted immediately (not just on save) since it also
  // needs to take effect for a session that's already live.
  const handleToggleRequireApproval = async (nextValue) => {
    if (!presentation?.id) return;
    const previousValue = presentation.requireApproval;
    setPresentation((prev) => ({ ...prev, requireApproval: nextValue }));
    try {
      await presentationService.updatePresentation(presentation.id, { requireApproval: nextValue });
    } catch (error) {
      setPresentation((prev) => ({ ...prev, requireApproval: previousValue }));
      toast.error(t('toasts.presentation.failed_to_save'));
    }
  };

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

  return {
    navigate,
    user,
    id,
    state,
    t,
    fromInstitutionAdmin,
    navigateToDashboard,
    presentation,
    setPresentation,
    slides,
    setSlides,
    currentSlideIndex,
    setCurrentSlideIndex,
    isSaving,
    setIsSaving,
    isLoading,
    setIsLoading,
    showNewSlideDropdown,
    setShowNewSlideDropdown,
    hoveredSlideType,
    setHoveredSlideType,
    showSlideEditor,
    setShowSlideEditor,
    activeTab,
    setActiveTab,
    draftDialog,
    setDraftDialog,
    exitDialog,
    setExitDialog,
    skipDraftSave,
    setSkipDraftSave,
    isDirty,
    setIsDirty,
    showShareModal,
    setShowShareModal,
    showThemeModal,
    setShowThemeModal,
    showAiGenerateModal,
    setShowAiGenerateModal,
    showTemplatesModal,
    setShowTemplatesModal,
    aiPrompt,
    setAiPrompt,
    deleteDialog,
    setDeleteDialog,
    savedSlideCount,
    setSavedSlideCount,
    showChatbot,
    setShowChatbot,
    handleApplyTemplate,
    effectivePlan,
    isFreePlan,
    saveToLocalStorage,
    loadPresentation,
    createNewPresentation,
    handleRestoreDraft,
    handleDiscardDraft,
    saveToBackend,
    handleTitleChange,
    handleThemeSelect,
    handleAiSlidesGenerated,
    handleAddSlide,
    handleDeleteSlide,
    handleConfirmDeleteSlide,
    handleSlideUpdate,
    handleExplodePowerPointToSlides,
    handleToggleRequireApproval,
    handleSlideReorder,
    handleBackToDashboard,
    handleConfirmExit,
    handleCancelExit,
    handleExitWithoutSaving,
    handlePresent
  };
}
