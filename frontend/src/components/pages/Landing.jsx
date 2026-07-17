import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../config/api';
import {
  BarChart2,
  Bot,
  ChevronUp,
  Globe,
  TrendingUp,
  GraduationCap,
  Building2,
  Heart,
  Mic,
  Menu,
  MessageSquare,  X,
  Check,
  Mail,
  MapPin,
  User,
  ChevronDown,
  LogOut,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
// eslint-disable-next-line
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { JoinPresentationBtn, JoinPresentationDialog } from '../common/JoinPresentationDialog';
import LanguageSelector from '../common/LanguageSelector/LanguageSelector';
import TestimonialsSection from '../Testimonials/TestimonialsSection';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { scrollY } = useScroll();
  const [platformUserCount, setPlatformUserCount] = useState(124); // Default to 124 as in the original
  const [billingCycle, setBillingCycle] = useState('monthly'); // Add billing cycle state
  const typewriterWordsRef = useRef([
    t('landing.engage'),
    t('landing.connect'),
    t('landing.evolve')
  ]);

  // Check if user is institution admin
  const [isInstitutionAdmin, setIsInstitutionAdmin] = useState(!!sessionStorage.getItem('institutionAdminToken'));
  const [institutionData, setInstitutionData] = useState(null);

  // Calculate effective plan (checks expiry)
  const effectivePlan = useMemo(() => {
    return getEffectivePlan(currentUser?.subscription);
  }, [currentUser?.subscription]);

  // Fetch institution data if user is institution admin
  useEffect(() => {
    const fetchInstitutionData = async () => {
      if (isInstitutionAdmin) {
        try {
          const response = await api.get('/institution-admin/verify');
          if (response.data.success && response.data.institution) {
            setInstitutionData(response.data.institution);
          }
        } catch (error) {
          console.error('Error fetching institution data:', error);
        }
      } else {
        setInstitutionData(null);
      }
    };

    fetchInstitutionData();
  }, [isInstitutionAdmin]);

  // Update isInstitutionAdmin when sessionStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'institutionAdminToken') {
        // Update state instead of reloading the page
        setIsInstitutionAdmin(!!sessionStorage.getItem('institutionAdminToken'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update typewriter words when language changes
  useEffect(() => {
    typewriterWordsRef.current = [
      t('landing.engage'),
      t('landing.connect'),
      t('landing.evolve')
    ];
  }, [t]);

  // Setup socket connection for real-time platform user count - defer until after initial render
  useEffect(() => {
    // Delay socket connection to not block initial render
    let socket = null;
    const timer = setTimeout(() => {
      import('socket.io-client').then(({ default: io }) => {
        import('../../utils/config').then(({ getSocketUrl }) => {
          socket = io(getSocketUrl());

          // Join the landing page room and request initial count
          socket.emit('get-platform-users');

          // Listen for updates to platform users
          socket.on('platform-users-updated', (data) => {
            setPlatformUserCount(data.count);
          });
        });
      });
    }, 1500); // Wait 1.5 seconds after page load to not block initial render

    return () => {
      clearTimeout(timer);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showJoinDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showJoinDialog]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Typewriter effect
  useEffect(() => {
    let currentWordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 200; // Typing speed in ms
    let timeoutId;

    const type = () => {
      const currentWord = typewriterWordsRef.current[currentWordIndex];

      if (isDeleting) {
        // Delete character
        setTypewriterText(currentWord.substring(0, charIndex - 1));
        charIndex--;
        typeSpeed = 100; // Faster when deleting
      } else {
        // Type character
        setTypewriterText(currentWord.substring(0, charIndex + 1));
        charIndex++;
        typeSpeed = 200; // Normal typing speed
      }

      if (!isDeleting && charIndex === currentWord.length) {
        // Pause at end of word
        typeSpeed = 1500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        // Move to next word
        isDeleting = false;
        currentWordIndex = (currentWordIndex + 1) % typewriterWordsRef.current.length;
        typeSpeed = 500; // Pause before typing next word
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    const timer = setTimeout(type, 1000); // Initial delay

    return () => {
      clearTimeout(timer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Check if the click target is the logout button or its children
        const logoutButton = document.querySelector('[data-logout-button]');
        if (logoutButton && (logoutButton === event.target || logoutButton.contains(event.target))) {
          // Don't close the menu if clicking on the logout button
          return;
        }
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    // Prevent any potential event propagation issues
    e.preventDefault();
    e.stopPropagation();

    try {
      // Check if this is an institution admin logout
      if (isInstitutionAdmin) {
        // Remove institution admin token
        sessionStorage.removeItem('institutionAdminToken');
        // Update state immediately for real-time UI update
        setIsInstitutionAdmin(false);
      }
      
      // Logout regular user (if applicable)
      logout();
      
      toast.success(t('toasts.landing.logout_success'));
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('toasts.landing.logout_error'));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);


  const features = [
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "interactive_engagement",
      description: "interactive_engagement_desc",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "community_connection",
      description: "community_connection_desc",
      color: "from-orange-400 to-amber-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "growth_insights",
      description: "growth_insights_desc",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "ai_assistance",
      description: "ai_assistance_desc",
      color: "from-teal-400 to-emerald-500"
    },
  ];

  const useCases = [
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "education",
      description: "education_desc",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "corporate",
      description: "corporate_desc",
      color: "bg-teal-500/10 text-teal-400 border-teal-500/20"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "communities",
      description: "communities_desc",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20"
    },
    {
      icon: <Mic className="w-8 h-8" />,
      title: "events",
      description: "events_desc",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-orange-500/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <span className="text-xl font-bold text-white">𝑖</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 whitespace-nowrap">{t('navbar.brand_name')}</span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-wrap">
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/about')}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              {t('navbar.about')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-400 transition-all group-hover:w-full" />
            </motion.button>
            {['Features', 'Use Cases'].map((item, i) => (
              <motion.button
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group cursor-pointer whitespace-nowrap"
              >
                {item === 'Features' ? t('navbar.features') : t('navbar.use_cases')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-400 transition-all group-hover:w-full" />
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/pricing')}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              {t('navbar.pricing')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-400 transition-all group-hover:w-full" />
            </motion.button>
            
            {/* Language Selector */}
            <LanguageSelector />
          </div>

          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
            {currentUser || isInstitutionAdmin ? (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(currentUser ? '/dashboard' : '/institution-admin')}
                  className="px-4 xl:px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all whitespace-nowrap"
                >
                  {t('navbar.dashboard')}
                </motion.button>
                <div className="relative" ref={menuRef}>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className={effectivePlan !== 'free' ? 'border-2 border-red-400 rounded-full' : ''} style={{ padding: '3px' }}>
                      {currentUser?.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt="User" 
                          className="w-8 h-8 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                          {currentUser?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-[#1e293b] rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                      >
                        {currentUser ? (
                          <>
                            <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                              <p className="text-sm font-semibold text-white">{currentUser?.displayName}</p>
                              <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                            </div>
                            <p className="px-4 py-3 border-b border-white/5 text-sm text-gray-300">
                              {t(`pricing.${effectivePlan}_plan_name`)} {t('dashboard.plan')}
                            </p>
                          </>
                        ) : (
                          <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                            <p className="text-sm font-semibold text-white">{institutionData?.name || t('institution_admin.institution_admin')}</p>
                            <p className="text-xs text-gray-400 truncate">{t('institution_admin.admin_access')}</p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setTimeout(() => navigate('/testimonials'), 100);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {t('dashboard.share_feedback')}
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setTimeout(() => navigate('/contact'), 100);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
                        >
                          <Mail className="h-4 w-4" />
                          {t('dashboard.contact_support')}
                        </button>
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
                  </AnimatePresence>                </div>
              </>
            ) : (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  {t('navbar.sign_in')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="px-4 xl:px-5 py-2 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  {t('navbar.get_started')}
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile/Tablet Menu Button and Language Selector */}
          <div className="lg:hidden flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSelector />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300 hover:text-white shrink-0 p-1">
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Menu Backdrop */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Blur Backdrop - Only covers main content, not navbar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed top-[73px] left-0 right-0 bottom-0 bg-black/60 backdrop-blur-lg z-30 lg:hidden"
                style={{ height: 'calc(100vh - 73px)' }}
              />
              
              {/* Mobile Menu */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden bg-[#0f172a] border-b border-white/10 relative z-40"
              >
              <div className="px-4 sm:px-6 py-4 space-y-4 flex flex-col">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/about');
                  }}
                  className="text-gray-300 hover:text-white font-medium text-left break-words"
                >
                  {t('navbar.about')}
                </button>
                {['Features', 'Use Cases'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => {
                        document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="text-gray-300 hover:text-white font-medium text-left break-words"
                  >
                    {item === 'Features' ? t('navbar.features') : t('navbar.use_cases')}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/pricing');
                  }}
                  className="text-gray-300 hover:text-white font-medium text-left break-words"
                >
                  {t('navbar.pricing')}
                </button>

                {currentUser || isInstitutionAdmin ? 
                (<div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(currentUser ? '/dashboard' : '/institution-admin');
                    }}
                    className="px-4 xl:px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all whitespace-nowrap"
                  >
                    {t('navbar.dashboard')}
                  </button>
                  <div className="pt-2 border-t border-white/10">
                    {currentUser ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                          {currentUser.photoURL ? (
                            <img 
                              src={currentUser.photoURL} 
                              alt="User" 
                              className="w-8 h-8 rounded-full border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                              {currentUser?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{currentUser?.displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                          </div>
                        </div>
                        <p className="px-3 py-2 text-sm text-gray-300 border-b border-white/5">
                          {t(`pricing.${effectivePlan}_plan_name`)} {t('dashboard.plan')}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{institutionData?.name || t('institution_admin.institution_admin')}</p>
                          <p className="text-xs text-gray-400 truncate">{t('institution_admin.admin_access')}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => navigate('/testimonials'), 100);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t('dashboard.share_feedback')}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => navigate('/contact'), 100);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {t('dashboard.contact_support')}
                    </button>
                    <button
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleLogout(e);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('dashboard.sign_out')}
                    </button>
                  </div>
                </div>):
                  (<div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                    <button onClick={() => navigate('/login')} className="text-gray-300 hover:text-white font-medium text-left break-words">{t('navbar.sign_in')}</button>
                    <button onClick={() => navigate('/register')} className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold break-words">{t('navbar.get_started')}</button>
                  </div>)
                }
                 
               </div>
              </motion.div>
            </>
          )}
         </AnimatePresence>
       </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 mb-32">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              className="lg:w-[60%] text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span className="text-sm font-medium text-blue-200">{t('landing.interactive_engagement_platform')}</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
<div className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400 md:leading-24 leading-16">
                  <div className="min-h-[1.2em]">
                    {typewriterText}
                    <span className="animate-pulse">|</span>
                  </div>
                </div>
                <div className="md:mt-4 mt-0 text-4xl lg:text-6xl">
                  {t('landing.with_inavora', { brandName: t('navbar.brand_name') })}
                </div>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('landing.hero_subtitle')}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <JoinPresentationBtn onClick={setShowJoinDialog} />
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="w-full sm:w-auto sm:max-w-none px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  {t('landing.see_how_it_works')}
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:w-[40%] relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div style={{ y: y1 }} className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
              <motion.div style={{ y: y2 }} className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />

              {/* Abstract UI Mockup */}
              <div className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400 border border-white/5">{t('landing.live_session')}</div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {t('landing.how_do_you_prefer_to_engage')}
                  </h3>

                  {[
                    { label: t('landing.live_polls'), percent: "58%", width: "58%", color: "bg-blue-500" },
                    { label: t('landing.qa_sessions'), percent: "24%", width: "24%", color: "bg-teal-500" },
                    { label: t('landing.word_clouds'), percent: "18%", width: "18%", color: "bg-orange-500" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1 + (i * 0.2), duration: 1 }}
                      className="relative h-auto min-h-14 bg-slate-800/50 rounded-xl overflow-hidden group cursor-pointer border border-white/5"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.width }}
                        transition={{ delay: 1.5 + (i * 0.2), duration: 1.5, type: "spring" }}
                        className={`absolute top-0 left-0 h-full ${item.color} opacity-20 group-hover:opacity-30 transition-opacity`}
                      />
                      <div className="absolute inset-0 flex flex-row items-center justify-between p-4 gap-2">
                        <span className="font-medium text-gray-200 text-sm md:text-base">{item.label}</span>
                        <span className="font-bold text-white text-sm md:text-base">{item.percent}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs sm:text-sm">
                      {platformUserCount < 10 ? t('landing.join_our_community') : 
                       `${platformUserCount} ${t('landing.active_participants')}`}
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i === 1 ? 'text-blue-400' : i === 2 ? 'text-teal-400' : 'text-orange-400'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="container mx-auto px-6 py-24 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-blue-900/5 to-transparent -z-10" />
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-8"
              dangerouslySetInnerHTML={{ __html: t('landing.the_nexus_of_people_technology_progress') }}
            >
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 leading-relaxed mb-12"
            >
              {t('landing.about_description')}
            </motion.p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { title: t('landing.engage'), desc: t('landing.engage_desc'), color: "text-blue-400" },
                { title: t('landing.connect'), desc: t('landing.connect_desc'), color: "text-teal-400" },
                { title: t('landing.evolve'), desc: t('landing.evolve_desc'), color: "text-orange-400" }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm"
                >
                  <h3 className={`text-2xl font-bold mb-2 ${item.color}`}>{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 py-24">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, animation: 'linear' }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6"
              dangerouslySetInnerHTML={{ __html: t('landing.what_makes_unique', { brandName: t('navbar.brand_name') }) }}
            >
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-[#1e293b]/50 border border-white/10 hover:bg-[#1e293b] hover:border-teal-500/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-teal-400 transition-colors">{t(`landing.${feature.title.toLowerCase().replace(/\s+/g, '_')}`)}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {t(`landing.${feature.title.toLowerCase().replace(/\s+/g, '_')}_desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="container mx-auto px-6 py-24">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6"
              dangerouslySetInnerHTML={{ __html: t('landing.built_for_every_space') }}
            >
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-3xl border ${useCase.color} bg-opacity-5 hover:bg-opacity-10 transition-all flex items-start gap-6`}
              >
                <div className="shrink-0 p-3 rounded-xl bg-white/5">
                  {useCase.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">{t(`landing.${useCase.title.toLowerCase()}`)}</h3>
                  <p className="text-gray-400 text-lg">{t(`landing.${useCase.title.toLowerCase()}_desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6"
              dangerouslySetInnerHTML={{ __html: t('landing.simple_transparent_pricing') }}
            >
            </motion.h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              {t('landing.start_free_upgrade')}
            </p>
            <Link
              to="/pricing"
              className="w-fit sm:w-fit mx-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              {t('landing.see_plans_details')}
            </Link>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              {t('pricing.billing_toggle_monthly')}
            </span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-8 rounded-full bg-slate-700 border border-white/10 transition-colors focus:outline-none"
            >
              <motion.div
                animate={{ x: billingCycle === 'monthly' ? 2 : 26 }}
                className="w-6 h-6 rounded-full bg-teal-400 shadow-lg"
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              {t('pricing.billing_toggle_yearly')} <span className="text-teal-400 text-xs ml-1">({t('pricing.billing_toggle_save')})</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: t('landing.pricing_free'),
                price: t('landing.pricing_free_price'),
                features: [
                  t('pricing.free_plan_feature1'),
                  t('pricing.free_plan_feature2'),
                  t('pricing.free_plan_feature3'),
                  t('pricing.free_plan_feature4')
                ],
                color: 'from-blue-500 to-cyan-500',
                borderColor: 'border-blue-500/20',
                bgGlow: 'bg-blue-500/10'
              },
              {
                name: t('landing.pricing_pro'),
                price: billingCycle === 'monthly' ? t('landing.pricing_pro_price') : t('landing.pricing_pro_yearly_price'),
                period: billingCycle === 'monthly' ? t('pricing.pro_plan_period_monthly') : t('pricing.pro_plan_period_yearly'),
                originalPrice: billingCycle === 'yearly' ? t('landing.pricing_pro_original_price') : null,
                saveLabel: billingCycle === 'yearly' ? t('pricing.pro_plan_save_label') : null,
                features: [
                  t('pricing.pro_plan_feature1'),
                  t('pricing.pro_plan_feature2'),
                  t('pricing.pro_plan_feature3'),
                  t('pricing.pro_plan_feature4'),
                  t('pricing.pro_plan_feature5'),
                  t('pricing.pro_plan_feature6')
                ],
                color: 'from-teal-400 to-emerald-500',
                borderColor: 'border-teal-500/30',
                bgGlow: 'bg-teal-500/10'
              },
              {
                name: t('landing.pricing_lifetime'),
                price: t('landing.pricing_lifetime_price'),
                period: t('pricing.lifetime_plan_period'),
                features: [
                  t('pricing.lifetime_plan_feature1'),
                  t('pricing.lifetime_plan_feature2'),
                  t('pricing.lifetime_plan_feature3'),
                  t('pricing.lifetime_plan_feature4'),
                  t('pricing.lifetime_plan_feature5')
                ],
                highlight: true,
                saveLabel: t('landing.pricing_popular'),
                color: 'from-orange-400 to-amber-500',
                borderColor: 'border-orange-500/30',
                bgGlow: 'bg-orange-500/10'
              },
              {
                name: t('landing.pricing_institution'),
                price: t('pricing.institution_plan_price'),
                period: t('pricing.institution_plan_period'),
                features: [
                  t('pricing.institution_plan_feature2'),
                  t('pricing.institution_plan_feature3'),
                  t('pricing.institution_plan_feature4'),
                  t('pricing.institution_plan_feature6'),
                  t('pricing.institution_plan_feature5'),
                  t('pricing.lifetime_plan_feature5')
                ],
                color: 'from-indigo-500 to-purple-500',
                borderColor: 'border-purple-500/30',
                bgGlow: 'bg-purple-500/10'
              }
            ].map((plan, index) => (              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col rounded-2xl border ${plan.borderColor} ${plan.bgGlow} backdrop-blur-sm overflow-hidden group hover:border-opacity-50 transition-all duration-300 p-6`}
              >
                {(plan.highlight || plan.saveLabel) && (
                  <div className="absolute top-0 right-0">
                    <div className={`bg-gradient-to-r ${plan.saveLabel ? 'from-orange-500 to-red-500' : plan.name === t('landing.pricing_lifetime') ? 'from-orange-400 to-amber-500' : 'from-teal-500 to-emerald-500'} text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-lg`}>
                      {plan.saveLabel || t('landing.pricing_popular')}
                    </div>
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${plan.color}`}>
                  {plan.name}
                </h3>

                <div className="mb-4">
                  {plan.originalPrice && (
                    <div className="text-gray-400 text-sm line-through mb-1">
                      {plan.originalPrice}
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                      <div className={`mt-1 w-4 h-4 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                        <Check className="w-2 h-2 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.name === t('landing.pricing_institution') ? '/institution/register' : '/register')}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:shadow-teal-500/25`
                    : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  {t('landing.pricing_get_started')}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Inavora */}
        <section className="container mx-auto px-6 py-24">
          <div className="bg-gradient-to-br from-blue-900/20 via-teal-900/20 to-slate-900 border border-white/10 rounded-3xl px-4 py-12 md:py-20 md:px-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-8">{t('landing.more_than_tools')}</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {t('landing.movement_description')}
              </p>
              <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                {t('landing.platform_journey')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">{t('landing.ready_start_journey', { brandName: t('navbar.brand_name') })}</h2>
            <p className="text-xl text-gray-400 mb-12">
              {t('landing.join_movement')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold text-xl shadow-xl hover:shadow-teal-500/25 transition-all"
              >
                {t('landing.sign_up_today')}
              </motion.button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection featured={true} limit={6} />
      </main>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg hover:shadow-teal-500/25 transition-all duration-200 hover:scale-105 "
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0f172a] pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 mb-16 sm:px-28 px-2">
            {/* Column 1: Brand */}
            <div className="space-y-6 col-start-1 lg:col-start-1">
              <div className="flex md:grid grid-cols-1 items-center justify-start gap-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-2xl font-bold text-white">𝑖</span>
                </div>
                <span className="text-3xl font-bold text-white">{t('navbar.brand_name')}</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                {t('footer.empowering_education')}
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="lg:pl-10">
              <h3 className="text-lg font-bold text-white mb-6">{t('footer.quick_links')}</h3>
              <ul className="space-y-4">
                {[
                  { name: t('footer.about_us'), path: "/about" },
                  { name: t('footer.pricing'), path: "/pricing" },
                  { name: t('footer.careers'), path: "/careers" },
                  { name: t('footer.contact'), path: "/contact" }
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-teal-400 transition-colors inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Us */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6">{t('footer.contact_us')}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{t('footer.email')}</p>
                    <a href="mailto:support@inavora.com" className="text-white font-medium hover:text-teal-400 transition-colors">
                      support@inavora.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 text-orange-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{t('footer.location')}</p>
                    <p className="text-white font-medium">
                      {t('footer.location_address')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Big Interactive Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2,
                  animation: 'easeIn'
                }
              }
            }}
            className="w-full flex overflow-hidden justify-center mt-16 select-none pointer-events-none"
          >
            {["I", "N", "A", "V", "O", "R", "A"].map((letter, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="text-[17vw] font-black leading-none"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          {/* Bottom Bar */}
          <div className="mt-5 flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-gray-500 text-sm">
              {t('footer.rights_reserved', { brandName: t('navbar.brand_name') })}
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('footer.privacy_policy')}
              </Link>
              <Link to="/terms-of-service" className="text-gray-500 hover:text-white text-sm transition-colors">
                {t('footer.terms_of_service')}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Join Presentation Dialog */}
      {showJoinDialog &&
        <JoinPresentationDialog onCancel={setShowJoinDialog} />
      }
    </div>
  );
};
