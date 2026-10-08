import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import * as presentationService from '../services/presentationService';
import { translateError } from '../utils/errorTranslator';
import { getEffectivePlan } from '../utils/subscriptionUtils';

/**
 * All state, data-loading, and presentation CRUD handlers for the
 * dashboard - everything Dashboard.jsx needed except the render tree and
 * the top-nav user-menu's own open/close state (which stays local to the
 * component since it's pure UI state tied to a DOM ref, not data). Split
 * out of Dashboard.jsx; see CODE_STANDARDS.md.
 *
 * Returns every piece of state, setter and handler the render layer might
 * need (including navigate/t/currentUser, since the JSX uses them too) -
 * same shape as usePresentationEditor.js's extraction from Presentation.jsx.
 */
export function useDashboardData() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [presentations, setPresentations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showFreePlanLimitModal, setShowFreePlanLimitModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAiGenerateModal, setShowAiGenerateModal] = useState(false);

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Calculate effective plan (checks expiry)
  const effectivePlan = useMemo(() => {
    return getEffectivePlan(currentUser?.subscription);
  }, [currentUser?.subscription]);

  // Load presentations on mount
  useEffect(() => {
    loadPresentations();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showFreePlanLimitModal) {
      // Save current overflow style
      const originalOverflow = document.body.style.overflow;
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore scrolling when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showFreePlanLimitModal]);

  const loadPresentations = async () => {
    try {
      setIsLoading(true);
      const data = await presentationService.getUserPresentations(100, 0);
      setPresentations(data.presentations || []);
    } catch (error) {
      console.error('Load presentations error:', error);
      toast.error(t('dashboard.load_presentations_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      logout();
      toast.success(t('dashboard.logout_success'));
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('dashboard.logout_error'));
    }
  };

  const handleCreatePresentation = async () => {
    try {
      setIsLoading(true);
      const title = t('dashboard.untitled_presentation');
      const { presentation } = await presentationService.createPresentation(title);
      toast.success(t('toasts.presentation.created'));
      navigate(`/presentation/${presentation.id}`);
    } catch (error) {
      console.error('Create presentation error:', error);
      // Check if it's a free plan limit error
      const errorCode = error?.response?.data?.code || error?.response?.data?.error;
      if (errorCode === 'FREE_PLAN_PRESENTATION_LIMIT' ||
          error?.response?.data?.error?.includes('Free plan limit') ||
          error?.message?.includes('Free plan limit')) {
        setShowFreePlanLimitModal(true);
      } else {
        toast.error(
          translateError(
            error,
            t,
            'toasts.presentation.failed_to_create'
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiGenerated = async (title, slides) => {
    try {
      setIsLoading(true);
      const { presentation } = await presentationService.createPresentation(title || t('dashboard.untitled_presentation'));
      setShowAiGenerateModal(false);
      toast.success(t('toasts.presentation.created'));
      navigate(`/presentation/${presentation.id}`, {
        state: {
          initialSlides: slides,
          fromTemplate: true
        }
      });
    } catch (error) {
      console.error('Create AI presentation error:', error);
      const errorCode = error?.response?.data?.code || error?.response?.data?.error;
      if (errorCode === 'FREE_PLAN_PRESENTATION_LIMIT' ||
          error?.response?.data?.error?.includes('Free plan limit') ||
          error?.message?.includes('Free plan limit')) {
        setShowAiGenerateModal(false);
        setShowFreePlanLimitModal(true);
      } else {
        toast.error(
          translateError(
            error,
            t,
            'toasts.presentation.failed_to_create'
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateType) => {
    try {
      setIsLoading(true);
      let title = t('dashboard.untitled_presentation');
      let slidesToCreate = [];

      if (templateType === 'mcq') {
        title = t('dashboard.mcq_presentation');
        for (let i = 0; i < 3; i++) {
          slidesToCreate.push({
            id: `temp-${uuidv4()}`,
            type: 'multiple_choice',
            question: t('dashboard.untitled_mcq_question'),
            options: ['Option 1', 'Option 2', 'Option 3']
          });
        }
      } else if (templateType === 'quiz') {
        title = t('dashboard.quiz_competition');
        for (let i = 0; i < 3; i++) {
          const opt1Id = uuidv4();
          const opt2Id = uuidv4();
          slidesToCreate.push({
            id: `temp-${uuidv4()}`,
            type: 'quiz',
            question: t('dashboard.untitled_quiz_question'),
            quizSettings: {
              options: [
                { id: opt1Id, text: 'Option 1' },
                { id: opt2Id, text: 'Option 2' }
              ],
              correctOptionId: opt1Id,
              timeLimit: 30,
              points: 1000,
            }
          });
        }
      } else if (templateType === 'mixed') {
        title = t('dashboard.interactive_session');
        slidesToCreate.push({
          id: `temp-${uuidv4()}`,
          type: 'word_cloud',
          question: t('dashboard.word_cloud_question'),
          maxWordsPerParticipant: 3
        });
        slidesToCreate.push({
          id: `temp-${uuidv4()}`,
          type: 'open_ended',
          question: t('dashboard.open_ended_question'),
          openEndedSettings: { showResponses: true }
        });
        slidesToCreate.push({
          id: `temp-${uuidv4()}`,
          type: 'qna',
          question: t('dashboard.qna_question'),
          qnaSettings: { allowMultiple: true }
        });
      }

      const { presentation } = await presentationService.createPresentation(title);

      toast.success(t('toasts.presentation.created'));
      navigate(`/presentation/${presentation.id}`, {
        state: {
          initialSlides: slidesToCreate,
          fromTemplate: true
        }
      });

    } catch (error) {
      console.error('Create from template error:', error);
      // Check if it's a free plan limit error
      const errorCode = error?.response?.data?.code || error?.response?.data?.error;
      if (errorCode === 'FREE_PLAN_PRESENTATION_LIMIT' || 
          error?.response?.data?.error?.includes('Free plan limit') ||
          error?.message?.includes('Free plan limit')) {
        setShowFreePlanLimitModal(true);
      } else {
        toast.error(t('dashboard.template_creation_error'));
      }
      setIsLoading(false);
    }
  };

  const handleDeletePresentation = (presentation, e) => {
    e.stopPropagation();
    setPresentationToDelete(presentation);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!presentationToDelete) return;
    try {
      setIsDeleting(true);
      await presentationService.deletePresentation(presentationToDelete.id);
      setPresentations(prev => prev.filter(p => p.id !== presentationToDelete.id));
      toast.success(t('dashboard.presentation_deleted'));
    } catch (error) {
      console.error('Delete presentation error:', error);
      toast.error(t('dashboard.delete_presentation_error'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPresentationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPresentationToDelete(null);
  };

  const handleOpenPresentation = (presentation) => {
    navigate(`/presentation/${presentation.id}`);
  };

  const filteredPresentations = presentations.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPresentations.length / itemsPerPage);
  const paginatedPresentations = filteredPresentations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const recentPresentations = presentations.slice(0, 3);

  return {
    navigate,
    t,
    currentUser,
    effectivePlan,
    showDeleteConfirm,
    presentationToDelete,
    isDeleting,
    presentations,
    isLoading,
    showDialog,
    setShowDialog,
    showFreePlanLimitModal,
    setShowFreePlanLimitModal,
    showChangePasswordModal,
    setShowChangePasswordModal,
    showAiGenerateModal,
    setShowAiGenerateModal,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    handleLogout,
    handleCreatePresentation,
    handleAiGenerated,
    handleCreateFromTemplate,
    handleDeletePresentation,
    confirmDelete,
    cancelDelete,
    handleOpenPresentation,
    filteredPresentations,
    totalPages,
    paginatedPresentations,
    recentPresentations,
  };
}
