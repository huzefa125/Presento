import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, LogOut, ChevronDown, Presentation, LoaderCircle, Trash2, Search, ChevronLeft, ChevronRight, LayoutGrid, Crown, LayoutTemplate, BarChart3, Trophy, PieChart, MessageSquare, Mail, HelpCircle, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import * as presentationService from '../services/presentationService';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { JoinPresentationBtn, JoinPresentationDialog } from './common/JoinPresentationDialog';
import LanguageSelector from './common/LanguageSelector/LanguageSelector';
import SupportWidget from './common/SupportWidget';
import { translateError } from '../utils/errorTranslator';
import ChangePasswordModal from './common/ChangePasswordModal';
import { getEffectivePlan } from '../utils/subscriptionUtils';
import Button from './ui/Button';
import Input from './ui/Input';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [presentations, setPresentations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showFreePlanLimitModal, setShowFreePlanLimitModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        const logoutButton = document.querySelector('[data-logout-button]');
        const feedbackButton = document.querySelector('[data-feedback-button]');
        const contactButton = document.querySelector('[data-contact-button]');
        
        if (logoutButton && (logoutButton === event.target || logoutButton.contains(event.target))) {
          return;
        }
        
        if (feedbackButton && (feedbackButton === event.target || feedbackButton.contains(event.target))) {
          return;
        }
        
        if (contactButton && (contactButton === event.target || contactButton.contains(event.target))) {
          return;
        }
        
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <LoaderCircle className='animate-spin text-primary' size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft text-ink font-sans">
      {/* Top Navigation Bar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, animation: 'fade-in' }}
        className="fixed top-0 left-0 right-0 z-40 bg-canvas border-b border-hairline"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-[var(--shadow-level-1)]">
              <span className="text-xl font-bold text-on-primary">𝑖</span>
            </div>
            <span className="text-xl font-bold text-ink">{t('navbar.brand_name')}</span>
          </div>

          {/* User Menu */}
          <div className='flex gap-3 justify-center items-center'>
            {effectivePlan === 'free' &&
              <button
                onClick={() => navigate('/pricing')}
                className="group max-sm:hidden w-full sm:w-auto px-4 py-2.5 rounded-md bg-surface border border-hairline hover:bg-canvas-soft transition-colors flex items-center justify-center gap-1 text-ink"
              >
                <Crown className='w-5 h-5 fill-accent-orange text-accent-orange group-hover:fill-accent-orange-deep group-hover:text-accent-orange-deep' />
                <span>{t('navbar.upgrade_to_pro')}</span>
              </button>}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-canvas-soft transition-colors border border-transparent hover:border-hairline"
              >
                <div className={effectivePlan !== 'free' ? 'border-2 border-accent-orange rounded-full' : ''} style={{ padding: '3px' }}>
                  {currentUser?.photoURL ? (
                    <img src={currentUser?.photoURL} alt="User" className='w-8 h-8 rounded-full border border-hairline ' />
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold text-sm">
                      {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-ink-secondary">{currentUser?.displayName}</span>
                <ChevronDown className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Language Selector */}
            <LanguageSelector />
          </div>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-35 top-16 max-sm:right-5 mt-2 w-64 bg-surface rounded-lg shadow-[var(--shadow-level-2)] border border-hairline z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-hairline bg-canvas-soft">
                  <p className="text-sm font-semibold text-ink">{currentUser?.displayName}</p>
                  <p className="text-xs text-ink-muted truncate">{currentUser?.email}</p>
                </div>
                <p className='px-4 py-3 border-b border-hairline text-sm text-ink-secondary'>{t(`pricing.${effectivePlan}_plan_name`)} {t('dashboard.plan')}</p>
                {effectivePlan === 'free' && (
                  <Link to="/pricing" className='px-4 py-3 border-b border-hairline text-sm text-primary hover:text-primary-active hover:bg-canvas-soft transition-colors flex items-center gap-2 max-sm:flex sm:hidden'>
                    <Crown className='w-4 h-4 fill-current' />
                    {t('navbar.upgrade_to_pro')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setTimeout(() => navigate('/testimonials'), 100);
                  }}
                  className='px-4 py-3 border-b border-hairline text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2 w-full text-left'
                  data-feedback-button="true"
                >
                  <MessageSquare className='w-4 h-4' />
                  {t('dashboard.share_feedback')}
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setTimeout(() => navigate('/contact'), 100);
                  }}
                  className='px-4 py-3 border-b border-hairline text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2 w-full text-left'
                  data-contact-button="true"
                >
                  <Mail className='w-4 h-4' />
                  {t('dashboard.contact_support')}
                </button>
                {currentUser?.hasPasswordProvider && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowChangePasswordModal(true);
                    }}
                    className='px-4 py-3 border-b border-hairline text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2 w-full text-left'
                  >
                    <Lock className='w-4 h-4' />
                    {t('dashboard.change_password') || 'Change Password'}
                  </button>
                )}
                <button
                  onClick={(e) => handleLogout(e)}
                  data-logout-button="true"
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t('dashboard.sign_out')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-ink mb-2 tracking-tight"
            >
              {t('dashboard.dashboard')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-ink-muted"
            >
              {t('dashboard.manage_presentations')}
            </motion.p>
          </div>

          <motion.div
            className='flex flex-col md:flex-row gap-3 justify-center items-center w-full md:w-auto'
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <JoinPresentationBtn onClick={setShowDialog} variant={'dashboard'} />
            <Button
              onClick={handleCreatePresentation}
              variant="primary"
              className="w-full md:w-auto"
            >
              <Plus className="h-5 w-5" />
              {t('dashboard.new_presentation')}
            </Button>
          </motion.div>
        </div>

        {/* Templates Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-accent-purple-deep" />
            {t('dashboard.start_with_template')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MCQ Template */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCreateFromTemplate('mcq')}
              className="bg-surface border border-hairline rounded-lg p-6 cursor-pointer hover:shadow-[var(--shadow-level-1)] transition-shadow group"
            >
              <div className="w-12 h-12 rounded-md bg-accent-sky/15 flex items-center justify-center mb-4 group-hover:bg-accent-sky/25 transition-colors">
                <BarChart3 className="w-6 h-6 text-accent-sky" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{t('dashboard.mcq_template_title')}</h3>
              <p className="text-sm text-ink-muted">{t('dashboard.mcq_template_description')}</p>
            </motion.div>

            {/* Quiz Template */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCreateFromTemplate('quiz')}
              className="bg-surface border border-hairline rounded-lg p-6 cursor-pointer hover:shadow-[var(--shadow-level-1)] transition-shadow group"
            >
              <div className="w-12 h-12 rounded-md bg-accent-purple/25 flex items-center justify-center mb-4 group-hover:bg-accent-purple/40 transition-colors">
                <Trophy className="w-6 h-6 text-accent-purple-deep" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{t('dashboard.quiz_competition_title')}</h3>
              <p className="text-sm text-ink-muted">{t('dashboard.quiz_competition_description')}</p>
            </motion.div>

            {/* Mixed Template */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCreateFromTemplate('mixed')}
              className="bg-surface border border-hairline rounded-lg p-6 cursor-pointer hover:shadow-[var(--shadow-level-1)] transition-shadow group"
            >
              <div className="w-12 h-12 rounded-md bg-accent-orange/15 flex items-center justify-center mb-4 group-hover:bg-accent-orange/25 transition-colors">
                <PieChart className="w-6 h-6 text-accent-orange" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{t('dashboard.mixed_session_title')}</h3>
              <p className="text-sm text-ink-muted">{t('dashboard.mixed_session_description')}</p>
            </motion.div>
          </div>
        </section>

        {/* Recent Presentations (Top 3) */}
        {presentations.length > 0 && !searchTerm && (
          <section className="mb-15">
            <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
              <Presentation className="w-5 h-5 text-accent-teal" />
              {t('dashboard.recent_activity')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPresentations.map((presentation, index) => (
                <motion.div
                  key={presentation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.1, animation: 'fade-in' }}
                  onClick={() => handleOpenPresentation(presentation)}
                  className="group relative bg-surface border border-hairline rounded-lg p-6 hover:shadow-[var(--shadow-level-1)] transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-md bg-accent-sky/15 flex items-center justify-center text-accent-sky group-hover:bg-accent-sky/25 transition-colors">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => handleDeletePresentation(presentation, e)}
                      className="p-2 text-ink-faint hover:text-red-600 max-sm:text-red-600 hover:bg-red-50 max-sm:bg-red-50 rounded-md transition-colors sm:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-2 truncate group-hover:text-primary transition-colors">{presentation.title}</h3>
                  <p className="text-sm text-ink-muted">{t('dashboard.edited_recently')}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Presentations / Search Results */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-accent-sky" />
              {searchTerm ? t('dashboard.search_presentations') : t('dashboard.all_presentations')}
            </h2>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint z-10" />
              <Input
                type="text"
                placeholder={t('dashboard.search_presentations')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {filteredPresentations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedPresentations.map((presentation) => (
                  <motion.div
                    key={presentation.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleOpenPresentation(presentation)}
                    className="bg-surface border border-hairline rounded-lg p-5 hover:shadow-[var(--shadow-level-1)] transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-accent-sky/15 flex items-center justify-center text-accent-sky group-hover:bg-accent-sky/25 transition-colors">
                        <Presentation className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink truncate group-hover:text-primary transition-colors">{presentation.title}</h3>
                        <p className="text-xs text-ink-faint hidden group-hover:block">{t('dashboard.click_to_open')}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeletePresentation(presentation, e)}
                        className="p-2 text-ink-faint hover:text-red-600 max-sm:text-red-600 hover:bg-red-50 bg-red-50 rounded-md transition-colors sm:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md bg-surface border border-hairline text-ink-muted hover:text-ink hover:bg-canvas-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-ink-muted">
                    {t('dashboard.pagination_page')} <span className="text-ink font-bold">{currentPage}</span> {t('dashboard.pagination_of')} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md bg-surface border border-hairline text-ink-muted hover:text-ink hover:bg-canvas-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-canvas-soft rounded-xl border border-hairline border-dashed">
              <div className="w-16 h-16 bg-surface border border-hairline rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-ink-faint" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">{t('dashboard.no_presentations_found')}</h3>
              <p className="text-ink-muted">{t('dashboard.try_adjusting_search')}</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-primary hover:text-primary-active text-sm font-medium"
                >
                  {t('dashboard.clear_search')}
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface border border-hairline rounded-xl p-8 max-w-md w-full shadow-[var(--shadow-level-2)]"
            >
              <h3 className="text-xl font-bold text-ink mb-4">{t('dashboard.delete_presentation')}</h3>
              <p
                className="text-ink-secondary mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: t('dashboard.delete_confirmation', { title: presentationToDelete?.title || 'Untitled Presentation' })
                    .replace(/<highlight>/g, '<span class="text-ink font-semibold">')
                    .replace(/<\/highlight>/g, '</span>')
                }}
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-ink-secondary hover:text-ink hover:bg-canvas-soft rounded-md transition-colors font-medium"
                >
                  {t('dashboard.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md transition-colors flex items-center gap-2 font-bold"
                >
                  {isDeleting ? (
                    <>
                      <LoaderCircle className="animate-spin h-4 w-4" />
                      {t('dashboard.delete')}...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t('dashboard.delete')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDialog &&
        <JoinPresentationDialog onCancel={setShowDialog} />
      }

      {/* Free Plan Limit Modal */}
      <AnimatePresence>
        {showFreePlanLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFreePlanLimitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface border border-red-200 rounded-xl p-8 max-w-md w-full shadow-[var(--shadow-level-2)]"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-200">
                  <Crown className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-ink mb-4 text-center">
                {t('dashboard.free_plan_limit_title')}
              </h3>

              {/* Message */}
              <p className="text-ink-secondary mb-8 text-center leading-relaxed">
                {t('toasts.presentation.free_plan_limit_reached')}
              </p>

              {/* Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowFreePlanLimitModal(false)}
                  className="px-6 py-3 text-ink-secondary hover:text-ink hover:bg-canvas-soft rounded-md transition-colors font-medium border border-hairline"
                >
                  {t('dashboard.free_plan_limit_ok')}
                </button>
                <Button
                  onClick={() => {
                    setShowFreePlanLimitModal(false);
                    navigate('/pricing');
                  }}
                  variant="primary"
                >
                  <Crown className="w-4 h-4" />
                  {t('dashboard.free_plan_limit_upgrade')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Support Widget */}
      <SupportWidget />

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
    </div>
  );
};

export default Dashboard;