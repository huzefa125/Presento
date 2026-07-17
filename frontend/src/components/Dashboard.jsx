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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <LoaderCircle className='animate-spin text-teal-400' size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]/98 text-white font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-orange-500/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      {/* Top Navigation Bar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, animation: 'fade-in' }}
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#0f172a]/40 border-b border-white/10 shadow-lg shadow-black/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-bold text-white">𝑖</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">{t('navbar.brand_name')}</span>
          </div>

          {/* User Menu */}
          <div className='flex gap-3 justify-center items-center'>
            {effectivePlan === 'free' &&
              <button
                onClick={() => navigate('/pricing')}
                className="group max-sm:hidden w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1"
              >
                <Crown className='w-5 h-5 fill-white group-hover:fill-yellow-300 group-hover:text-yellow-300' />
                <span>{t('navbar.upgrade_to_pro')}</span>
              </button>}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              >
                <div className={effectivePlan !== 'free' ? 'border-2 border-red-400 rounded-full' : ''} style={{ padding: '3px' }}>
                  {currentUser?.photoURL ? (
                    <img src={currentUser?.photoURL} alt="User" className='w-8 h-8 rounded-full border border-white/10 ' />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                      {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-300">{currentUser?.displayName}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
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
                className="absolute right-35 top-16 max-sm:right-5 mt-2 w-64 bg-[#1e293b] rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                  <p className="text-sm font-semibold text-white">{currentUser?.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                </div>
                <p className='px-4 py-3 border-b border-white/5'>{t(`pricing.${effectivePlan}_plan_name`)} {t('dashboard.plan')}</p>
                {effectivePlan === 'free' && (
                  <Link to="/pricing" className='px-4 py-3 border-b border-white/5 text-sm text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors flex items-center gap-2 max-sm:flex sm:hidden'>
                    <Crown className='w-4 h-4 fill-current' />
                    {t('navbar.upgrade_to_pro')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setTimeout(() => navigate('/testimonials'), 100);
                  }}
                  className='px-4 py-3 border-b border-white/5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 w-full text-left'
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
                  className='px-4 py-3 border-b border-white/5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 w-full text-left'
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
                    className='px-4 py-3 border-b border-white/5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 w-full text-left'
                  >
                    <Lock className='w-4 h-4' />
                    {t('dashboard.change_password') || 'Change Password'}
                  </button>
                )}
                <button
                  onClick={(e) => handleLogout(e)}
                  data-logout-button="true"
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
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
              className="text-4xl font-bold text-white mb-2"
            >
              {t('dashboard.dashboard')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
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
            <button
              onClick={handleCreatePresentation}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t('dashboard.new_presentation')}
            </button>
          </motion.div>
        </div>

        {/* Templates Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-purple-400" />
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
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 cursor-pointer hover:border-blue-500/50 transition-all group shadow-lg hover:shadow-blue-500/10"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('dashboard.mcq_template_title')}</h3>
              <p className="text-sm text-gray-400">{t('dashboard.mcq_template_description')}</p>
            </motion.div>

            {/* Quiz Template */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCreateFromTemplate('quiz')}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 cursor-pointer hover:border-purple-500/50 transition-all group shadow-lg hover:shadow-purple-500/10"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('dashboard.quiz_competition_title')}</h3>
              <p className="text-sm text-gray-400">{t('dashboard.quiz_competition_description')}</p>
            </motion.div>

            {/* Mixed Template */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCreateFromTemplate('mixed')}
              className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6 cursor-pointer hover:border-orange-500/50 transition-all group shadow-lg hover:shadow-orange-500/10"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                <PieChart className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('dashboard.mixed_session_title')}</h3>
              <p className="text-sm text-gray-400">{t('dashboard.mixed_session_description')}</p>
            </motion.div>
          </div>
        </section>

        {/* Recent Presentations (Top 3) */}
        {presentations.length > 0 && !searchTerm && (
          <section className="mb-15">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Presentation className="w-5 h-5 text-teal-400" />
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
                  className="group relative bg-[#1e293b] border border-white/10 rounded-2xl p-6 hover:bg-[#263345] hover:border-teal-500/50 transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-xl hover:shadow-teal-500/10"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => handleDeletePresentation(presentation, e)}
                      className="p-2 text-gray-500 hover:text-red-400 max-sm:text-red-400 hover:bg-red-500/10 max-sm:bg-red-500/10 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-teal-400 transition-colors">{presentation.title}</h3>
                  <p className="text-sm text-gray-400">{t('dashboard.edited_recently')}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Presentations / Search Results */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-400" />
              {searchTerm ? t('dashboard.search_presentations') : t('dashboard.all_presentations')}
            </h2>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={t('dashboard.search_presentations')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
                className="w-full bg-[#1e293b]/ border border-white/30 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
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
                    className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-[#263345] hover:border-teal-500/40 transition-all cursor-pointer group shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                        <Presentation className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-200 truncate group-hover:text-white transition-colors">{presentation.title}</h3>
                        <p className="text-xs text-gray-500 hidden group-hover:block">{t('dashboard.click_to_open')}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeletePresentation(presentation, e)}
                        className="p-2 text-gray-600 hover:text-red-400 max-sm:text-red-400 hover:bg-red-500/10 bg-red-500/10 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100"
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
                    className="p-2 rounded-lg bg-[#1e293b] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    {t('dashboard.pagination_page')} <span className="text-white font-bold">{currentPage}</span> {t('dashboard.pagination_of')} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-[#1e293b] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-[#1e293b]/20 rounded-2xl border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">{t('dashboard.no_presentations_found')}</h3>
              <p className="text-gray-500">{t('dashboard.try_adjusting_search')}</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-teal-400 hover:text-teal-300 text-sm font-medium"
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
              className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">{t('dashboard.delete_presentation')}</h3>
              <p 
                className="text-gray-400 mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: t('dashboard.delete_confirmation', { title: presentationToDelete?.title || 'Untitled Presentation' })
                    .replace(/<highlight>/g, '<span class="text-white font-semibold">')
                    .replace(/<\/highlight>/g, '</span>')
                }}
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
                >
                  {t('dashboard.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-all flex items-center gap-2 font-bold"
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
              className="bg-[#1e293b] border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/20"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50">
                  <Crown className="w-8 h-8 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                {t('dashboard.free_plan_limit_title')}
              </h3>

              {/* Message */}
              <p className="text-gray-300 mb-8 text-center leading-relaxed">
                {t('toasts.presentation.free_plan_limit_reached')}
              </p>

              {/* Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowFreePlanLimitModal(false)}
                  className="px-6 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium border border-white/10"
                >
                  {t('dashboard.free_plan_limit_ok')}
                </button>
                <button
                  onClick={() => {
                    setShowFreePlanLimitModal(false);
                    navigate('/pricing');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl transition-all font-bold hover:shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {t('dashboard.free_plan_limit_upgrade')}
                </button>
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