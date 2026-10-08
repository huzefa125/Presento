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
import { motion, AnimatePresence } from 'framer-motion';
import { JoinPresentationBtn, JoinPresentationDialog } from '../common/JoinPresentationDialog';
import LanguageSelector from '../common/LanguageSelector/LanguageSelector';
import TestimonialsSection from '../Testimonials/TestimonialsSection';
import PresentoShowcase from '../common/PresentoShowcase';
import AboutSection from '../landing/AboutSection';
import FeaturesSection from '../landing/FeaturesSection';
import UseCasesSection from '../landing/UseCasesSection';
import HeroSection from '../landing/HeroSection';
import PricingSection from '../landing/PricingSection';
import Footer from '../landing/Footer';
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
  const [platformUserCount, setPlatformUserCount] = useState(124); // Default to 124 as in the original
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

  return (
    <div className="min-h-screen bg-canvas-soft text-ink font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-sky/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-teal/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-accent-orange/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-canvas/80 border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-on-primary">𝑖</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-ink whitespace-nowrap">{t('navbar.brand_name')}</span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-wrap">
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/about')}
              className="text-sm font-medium text-ink-muted hover:text-ink transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              {t('navbar.about')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </motion.button>
            {['Features', 'Use Cases', 'Benefits'].map((item, i) => (
              <motion.button
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-medium text-ink-muted hover:text-ink transition-colors relative group cursor-pointer whitespace-nowrap"
              >
                {item === 'Features' ? t('navbar.features') : item === 'Use Cases' ? t('navbar.use_cases') : 'Benefits'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/pricing')}
              className="text-sm font-medium text-ink-muted hover:text-ink transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              {t('navbar.pricing')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
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
                  className="px-4 xl:px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-active transition-all whitespace-nowrap"
                >
                  {t('navbar.dashboard')}
                </motion.button>
                <div className="relative" ref={menuRef}>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-canvas-soft transition-colors border border-transparent hover:border-hairline"
                  >
                    <div className={effectivePlan !== 'free' ? 'border-2 border-red-400 rounded-full' : ''} style={{ padding: '3px' }}>
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="User"
                          className="w-8 h-8 rounded-full border border-hairline object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold text-sm">
                          {currentUser?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-lg shadow-[var(--shadow-level-2)] border border-hairline z-50 overflow-hidden"
                      >
                        {currentUser ? (
                          <>
                            <div className="px-4 py-3 border-b border-hairline bg-canvas-soft">
                              <p className="text-sm font-semibold text-ink">{currentUser?.displayName}</p>
                              <p className="text-xs text-ink-muted truncate">{currentUser?.email}</p>
                            </div>
                            <p className="px-4 py-3 border-b border-hairline text-sm text-ink-secondary">
                              {t(`pricing.${effectivePlan}_plan_name`)} {t('dashboard.plan')}
                            </p>
                          </>
                        ) : (
                          <div className="px-4 py-3 border-b border-hairline bg-canvas-soft">
                            <p className="text-sm font-semibold text-ink">{institutionData?.name || t('institution_admin.institution_admin')}</p>
                            <p className="text-xs text-ink-muted truncate">{t('institution_admin.admin_access')}</p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setTimeout(() => navigate('/testimonials'), 100);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2 border-b border-hairline"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {t('dashboard.share_feedback')}
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setTimeout(() => navigate('/contact'), 100);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2 border-b border-hairline"
                        >
                          <Mail className="h-4 w-4" />
                          {t('dashboard.contact_support')}
                        </button>
                        <button
                          onClick={(e) => handleLogout(e)}
                          data-logout-button="true"
                          className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
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
                  className="text-sm font-medium text-ink-muted hover:text-ink transition-colors whitespace-nowrap"
                >
                  {t('navbar.sign_in')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="px-4 xl:px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-bold hover:bg-primary-active transition-colors whitespace-nowrap"
                >
                  {t('navbar.get_started')}
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile/Tablet Menu Button and Language Selector */}
          <div className="lg:hidden flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSelector />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-ink-muted hover:text-ink shrink-0 p-1">
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
                className="fixed top-[73px] left-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
                style={{ height: 'calc(100vh - 73px)' }}
              />

              {/* Mobile Menu */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden bg-canvas border-b border-hairline relative z-40"
              >
              <div className="px-4 sm:px-6 py-4 space-y-4 flex flex-col">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/about');
                  }}
                  className="text-ink-muted hover:text-ink font-medium text-left break-words"
                >
                  {t('navbar.about')}
                </button>
                {['Features', 'Use Cases', 'Benefits'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => {
                        document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="text-ink-muted hover:text-ink font-medium text-left break-words"
                  >
                    {item === 'Features' ? t('navbar.features') : item === 'Use Cases' ? t('navbar.use_cases') : 'Benefits'}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/pricing');
                  }}
                  className="text-ink-muted hover:text-ink font-medium text-left break-words"
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
                    className="px-4 xl:px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-active transition-all whitespace-nowrap"
                  >
                    {t('navbar.dashboard')}
                  </button>
                  <div className="pt-2 border-t border-hairline">
                    {currentUser ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="User"
                              className="w-8 h-8 rounded-full border border-hairline object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold text-sm">
                              {currentUser?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-ink">{currentUser?.displayName}</p>
                            <p className="text-xs text-ink-muted truncate">{currentUser?.email}</p>
                          </div>
                        </div>
                        <p className="px-3 py-2 text-sm text-ink-secondary border-b border-hairline">
                          {t(`pricing.${effectivePlan}_plan_name`)} {t('dashboard.plan')}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 mb-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold text-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink">{institutionData?.name || t('institution_admin.institution_admin')}</p>
                          <p className="text-xs text-ink-muted truncate">{t('institution_admin.admin_access')}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => navigate('/testimonials'), 100);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t('dashboard.share_feedback')}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => navigate('/contact'), 100);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {t('dashboard.contact_support')}
                    </button>
                    <button
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleLogout(e);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('dashboard.sign_out')}
                    </button>
                  </div>
                </div>):
                  (<div className="pt-4 border-t border-hairline flex flex-col gap-3">
                    <button onClick={() => navigate('/login')} className="text-ink-muted hover:text-ink font-medium text-left break-words">{t('navbar.sign_in')}</button>
                    <button onClick={() => navigate('/register')} className="bg-primary text-on-primary px-4 py-2 rounded-full font-bold break-words">{t('navbar.get_started')}</button>
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
        <HeroSection typewriterText={typewriterText} platformUserCount={platformUserCount} setShowJoinDialog={setShowJoinDialog} />

        {/* About Section */}
        <AboutSection />

        {/* Features Grid Section */}
        <FeaturesSection />

        {/* Use Cases Section */}
        <UseCasesSection />

        {/* Presento Benefits & Workflow Showcase Section */}
        <section id="benefits">
          <PresentoShowcase />
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Why Presento */}
        <section className="container mx-auto px-6 py-24">
          <div className="bg-surface border border-hairline rounded-xl px-4 py-12 md:py-20 md:px-20 text-center relative overflow-hidden shadow-[var(--shadow-level-1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-sky via-accent-teal to-accent-orange" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">{t('landing.more_than_tools')}</h2>
              <p className="text-xl text-ink-secondary mb-8 leading-relaxed">
                {t('landing.movement_description')}
              </p>
              <p className="text-2xl font-bold text-primary">
                {t('landing.platform_journey')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">{t('landing.ready_start_journey', { brandName: t('navbar.brand_name') })}</h2>
            <p className="text-xl text-ink-muted mb-12">
              {t('landing.join_movement')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-10 py-5 rounded-full bg-primary text-on-primary font-bold text-xl shadow-[var(--shadow-level-1)] hover:bg-primary-active transition-all"
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
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-on-primary shadow-[var(--shadow-level-1)] hover:bg-primary-active transition-all duration-200 hover:scale-105 "
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
<Footer />

      {/* Join Presentation Dialog */}
      {showJoinDialog &&
        <JoinPresentationDialog onCancel={setShowJoinDialog} />
      }
    </div>
  );
};
