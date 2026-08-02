import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Settings as SettingsIcon, Share2, X, Plus, MessageCircle, Palette, Sparkles, HelpCircle, LayoutGrid } from 'lucide-react';
import SlideBar from '../presentation/SlideBar';
import NewSlideDropdown from '../presentation/NewSlideDropdown';
import SlideTypePreview from '../presentation/SlideTypePreview';
import SlideCanvas from '../presentation/SlideCanvas';
import SlideEditor from '../presentation/SlideEditor';
import EmptyState from '../presentation/EmptyState';
import ShareModal from '../presentation/ShareModal';
import ThemePicker from '../presentation/ThemePicker';
import AiGenerateModal from '../presentation/AiGenerateModal';
import TemplatesModal from '../presentation/TemplatesModal';
import { getThemeStyleVars } from '../../constants/themes';
import * as presentationService from '../../services/presentationService';
import { deletePresentation } from '../../services/presentationService';
import { defaultOpenEndedSettings } from '../interactions/openEnded/utils';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from '../common/ConfirmDialog';
import PresentationResults from '../presentation/PresentationResults';
import Chatbot from '../common/Chatbot';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../utils/errorTranslator';
import { PresentationEditorSkeleton } from '../common/PageSkeleton';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

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
      type: s.type || 'mcq',
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
    return <PresentationEditorSkeleton />;
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft text-ink">
        <div className="text-xl text-ink">{t('presentation.not_found')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft text-ink flex flex-col">
      {/* Mentimeter Top Black Upgrade Banner Bar for Free Users */}
      {isFreePlan && (
        <div className="bg-black text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm z-50">
          <div className="flex items-center gap-3">
            <span className="font-semibold hidden sm:inline">
              Unlock unlimited participants to reach more people.
            </span>
            <span className="font-semibold sm:hidden">
              Reach more participants
            </span>
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold transition-all active:scale-95 text-xs shadow-sm"
            >
              <span>★</span>
              <span>Upgrade</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span>1/50 Participants this month</span>
            <div className="w-12 sm:w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden hidden sm:block">
              <div className="h-full bg-emerald-500 w-1/5"></div>
            </div>
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 min-h-[56px]">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={handleBackToDashboard}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              title={t('presentation.back_to_dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={presentation.title}
                onChange={handleTitleChange}
                className="text-xs sm:text-sm font-semibold text-gray-900 bg-transparent hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none px-2 py-1 rounded-lg transition-all truncate w-28 sm:w-44 md:w-60"
                placeholder={t('presentation.untitled')}
              />

              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-400 border-l border-gray-200 pl-2">
                <span>{slides.length} {slides.length === 1 ? 'slide' : 'slides'}</span>
                {isSaving && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    {t('presentation.saving')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Tabs Section - Only on Large Desktop */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-1.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'create'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              {t('presentation.create_tab') || 'Create'}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-1.5 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-indigo-600 font-bold'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              <span>{t('presentation.results_tab') || 'Results'}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">0</span>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowThemeModal(true)}
              className="hidden sm:flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all"
            >
              <Palette className="h-4 w-4 text-gray-600" />
              <span>Theme</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-1"
              title={t('presentation.share')}
            >
              <Share2 className="h-4 w-4 text-gray-600" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handlePresent}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95 shrink-0 whitespace-nowrap leading-none cursor-pointer"
            >
              <span className="hidden lg:inline">Start presentation</span>
              <span className="lg:hidden">Present</span>
              <span className="text-[10px]">▾</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Sub-Navbar Row - Shown on screens below lg (<1024px) */}
        <div className="lg:hidden border-t border-gray-200 px-3 sm:px-4 bg-white flex items-center justify-between min-h-[40px]">
          <div className="flex items-center gap-4 sm:gap-6 py-1.5">
            <button
              onClick={() => setActiveTab('create')}
              className={`text-xs sm:text-sm font-bold pb-1 border-b-2 transition-all ${
                activeTab === 'create'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {t('presentation.create_tab') || 'Create'}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`text-xs sm:text-sm font-semibold pb-1 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-indigo-600 font-bold'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              <span>{t('presentation.results_tab') || 'Results'}</span>
              <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">0</span>
            </button>
          </div>

          {/* Quick Toolbar Action Buttons for Mobile/Tablet */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAiGenerateModal(true)}
              className="px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold transition-all flex items-center gap-1"
              title={t('presentation.generate_with_ai')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">AI</span>
            </button>

            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-1"
              title="Templates"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold hidden xs:inline">Templates</span>
            </button>

            <button
              onClick={() => setShowThemeModal(true)}
              className="sm:hidden p-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center"
              title="Theme"
            >
              <Palette className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Session Code Display - Clean Flow without overlapping headers or clipping canvas */}
      {slides.length > 0 && presentation.accessCode && activeTab !== 'results' && (
        <div className="w-full bg-[#F1F5F9] border-b border-gray-200 py-2 px-4 flex justify-center items-center z-30 shrink-0">
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-1.5 bg-white rounded-full border border-gray-200 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-gray-600">{t('presentation.ready_to_share')}</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-xs text-gray-800 flex flex-row justify-center items-center gap-1.5 whitespace-nowrap">
                <span className="text-gray-500">{t('presentation.join_at')}</span>
                <span className="font-bold text-gray-900">inavora.com</span>
                <span>|</span>
                <span className="text-sm font-bold text-indigo-600">{presentation.accessCode}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0 overflow-hidden bg-canvas-soft h-full">

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
                  theme={presentation?.theme}
                  onAiGenerateClick={() => setShowAiGenerateModal(true)}
                />

                {showNewSlideDropdown && (
                  <NewSlideDropdown
                    onSelectType={(type) => {
                      handleAddSlide(type);
                      setShowNewSlideDropdown(false);
                      setHoveredSlideType(null);
                    }}
                    onClose={() => {
                      setShowNewSlideDropdown(false);
                      setHoveredSlideType(null);
                    }}
                    onHoverType={setHoveredSlideType}
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
                theme={presentation?.theme}
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

        <div className={`flex-1 flex ${activeTab === 'create' ? 'lg:ml-44' : ''} bg-canvas-soft ${activeTab === 'create' ? 'pb-24 sm:pb-24 lg:pb-0' : ''}`}>
          {activeTab === 'create' ? (
            <>
              {/* Canvas Area */}
              <div className="flex-1 bg-[#F1F5F9] flex items-center justify-center p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto w-full h-full my-auto">
                {/* Fixed-size 16:9 Slide Canvas Frame - Never changes size on hover */}
                {(() => {
                  const themeStyleVars = getThemeStyleVars(presentation?.theme);
                  return (
                    <div
                      className="w-full max-w-3xl lg:max-w-4xl aspect-[16/9] border border-[#E2E8F0] rounded-[24px] shadow-md flex items-center justify-center relative overflow-hidden shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: themeStyleVars['--color-canvas'] || '#ffffff',
                        color: themeStyleVars['--color-ink'] || '#0f172a',
                        ...themeStyleVars,
                      }}
                    >
                      {showNewSlideDropdown && hoveredSlideType ? (
                        <SlideTypePreview
                          type={hoveredSlideType.type}
                          label={hoveredSlideType.label}
                          icon={hoveredSlideType.icon}
                          theme={presentation?.theme}
                        />
                      ) : slides.length === 0 ? (
                        <EmptyState
                          onAiGenerate={(prompt) => {
                            setAiPrompt(prompt || '');
                            setShowAiGenerateModal(true);
                          }}
                          onStartFromScratch={() => setShowNewSlideDropdown(true)}
                        />
                      ) : (
                        <SlideCanvas
                          slide={slides[currentSlideIndex]}
                          presentation={presentation}
                          theme={presentation?.theme}
                        />
                      )}
                    </div>
                  );
                })()}
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

              {/* Mentimeter-style Right Vertical Toolbar */}
              <div className="hidden lg:flex flex-col items-center gap-3 fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-md">
                <button
                  onClick={() => setShowAiGenerateModal(true)}
                  className="p-2.5 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all hover:scale-105 group relative"
                  title={t('presentation.generate_with_ai')}
                >
                  <Sparkles className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all hover:scale-105 group relative"
                  title="Templates"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all hover:scale-105 group relative"
                  title={t('presentation.theme')}
                >
                  <Palette className="h-5 w-5" />
                </button>
                {slides.length > 0 && (
                  <button
                    onClick={() => setShowSlideEditor(!showSlideEditor)}
                    className={`p-2.5 rounded-xl transition-all hover:scale-105 group relative ${
                      showSlideEditor ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                    title={t('presentation.edit_slide')}
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all hover:scale-105 group relative"
                  title={t('presentation.share')}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Bottom Right Floating Help Circle */}
              <div className="fixed right-4 bottom-4 z-40">
                <button
                  className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  title="Help & Support"
                >
                  ?
                </button>
              </div>
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
      <ThemePicker
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentThemeId={presentation?.theme}
        user={user}
        onSelectTheme={handleThemeSelect}
      />
      <AiGenerateModal
        isOpen={showAiGenerateModal}
        onClose={() => setShowAiGenerateModal(false)}
        user={user}
        onGenerated={handleAiSlidesGenerated}
        initialPrompt={aiPrompt}
      />
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onApplyTemplate={handleApplyTemplate}
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

      {/* Mentimeter-style Bottom Right Help Button */}
      <button
        className="fixed bottom-4 right-4 z-40 w-9 h-9 rounded-full bg-ink text-canvas flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all text-sm font-semibold"
        title="Help"
      >
        ?
      </button>

    </div>
  );
}

