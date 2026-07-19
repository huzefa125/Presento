// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Users, Zap, Heart, Code, Briefcase, MapPin, Clock, Check, Mail, Send, X, Upload, FileText, Link as LinkIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { translateError } from '../../utils/errorTranslator';
import api from '../../config/api';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../../utils/config';

const Careers = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [openPositions, setOpenPositions] = useState([]);
    const [loadingPositions, setLoadingPositions] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        linkedinUrl: '',
        portfolioUrl: '',
        githubUrl: '',
        position: '',
        department: '',
        expectedSalary: '',
        availability: '1 month',
        experience: [],
        education: [],
        skills: {
            technical: [],
            soft: []
        },
        coverLetter: '',
        whyInavora: '',
        additionalInfo: ''
    });

    // Fetch job postings from backend
    useEffect(() => {
        const fetchJobPostings = async () => {
            try {
                setLoadingPositions(true);
                const response = await api.get('/job-postings/active');
                if (response.data.success) {
                    setOpenPositions(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching job postings:', error);
                // Fallback to empty array if API fails
                setOpenPositions([]);
            } finally {
                setLoadingPositions(false);
            }
        };

        fetchJobPostings();

        // Set up Socket.IO for real-time updates
        const socket = io(getSocketUrl());
        
        socket.on('job-posting-created', () => {
            fetchJobPostings();
        });

        socket.on('job-posting-updated', () => {
            fetchJobPostings();
        });

        socket.on('job-posting-deleted', () => {
            fetchJobPostings();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const toggleJobExpansion = (jobId) => {
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    const handleOpenModal = (positionTitle, department) => {
        setSelectedPosition(positionTitle);
        setFormData(prev => ({ ...prev, position: positionTitle, department: department }));
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPosition('');
        setResumeFile(null);
        setResumePreview(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            location: '',
            linkedinUrl: '',
            portfolioUrl: '',
            githubUrl: '',
            position: '',
            department: '',
            expectedSalary: '',
            availability: '1 month',
            experience: [],
            education: [],
            skills: {
                technical: [],
                soft: []
            },
            coverLetter: '',
            whyInavora: '',
            additionalInfo: ''
        });
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('toasts.careers.resume_size_error'));
                return;
            }
            if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                toast.error(t('toasts.careers.resume_format_error'));
                return;
            }
            setResumeFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setResumePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!resumeFile) {
            toast.error(t('toasts.careers.resume_required'));
            return;
        }

        setIsSubmitting(true);

        try {
            const applicationData = {
                ...formData,
                resume: {
                    base64: resumePreview,
                    fileName: resumeFile.name,
                    fileSize: resumeFile.size
                }
            };

            const response = await api.post('/careers/apply', applicationData);

            if (response.data.success) {
                toast.success(response.data.message || t('careers.application_submitted'));
                handleCloseModal();
            }
        } catch (error) {
            console.error('Application submission error:', error);
            toast.error(translateError(error, t, 'careers.application_submit_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const whyJoinUs = [
        {
            icon: <Rocket className="w-6 h-6" />,
            title: t('careers.why_join_innovation_title'),
            description: t('careers.why_join_innovation_desc'),
            color: "text-accent-sky bg-accent-sky/10 border-hairline"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: t('careers.why_join_team_title'),
            description: t('careers.why_join_team_desc'),
            color: "text-accent-teal bg-accent-teal/10 border-hairline"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: t('careers.why_join_growth_title'),
            description: t('careers.why_join_growth_desc'),
            color: "text-accent-orange bg-accent-orange/10 border-hairline"
        },
        {
            icon: <Heart className="w-6 h-6" />,
            title: t('careers.why_join_impact_title'),
            description: t('careers.why_join_impact_desc'),
            color: "text-accent-pink bg-accent-pink/10 border-hairline"
        }
    ];

    const benefits = [
        { text: t('careers.benefit_remote') },
        { text: t('careers.benefit_health') },
        { text: t('careers.benefit_learning') },
        { text: t('careers.benefit_flexible') },
        { text: t('careers.benefit_equity') },
        { text: t('careers.benefit_equipment') }
    ];


    return (
        <div className="min-h-screen bg-canvas-soft text-ink overflow-x-hidden selection:bg-primary selection:text-on-primary font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-canvas/80 border-b border-hairline">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-xl font-bold text-on-primary">𝑖</span>
                        </div>
                        <span className="text-xl font-bold text-ink">{t('navbar.brand_name')}</span>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center bg-surface border border-hairline px-3 py-1 rounded-md gap-2 text-sm font-medium text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('careers.back')}
                    </button>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20 container mx-auto px-6">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-hairline shadow-[var(--shadow-level-1)] mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-accent-teal"></span>
                        <span className="text-sm font-medium text-primary">{t('careers.hero_badge')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight text-ink">
                        {t('careers.hero_title')} <br />
                        <span className="text-primary">
                            {t('careers.hero_title_highlight')}
                        </span>
                    </h1>
                    <p className="text-xl text-ink-muted leading-relaxed max-w-2xl mx-auto mb-12">
                        {t('careers.hero_description')}
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-active shadow-[var(--shadow-level-1)] transition-all text-lg"
                    >
                        {t('careers.view_openings')}
                    </motion.button>
                </motion.div>

                {/* Why Join Us Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-32"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-ink">{t('careers.why_join_title')}</h2>
                        <p className="text-xl text-ink-muted max-w-2xl mx-auto">{t('careers.why_join_description')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {whyJoinUs.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-8 rounded-lg bg-surface border border-hairline shadow-[var(--shadow-level-1)] transition-all"
                            >
                                <div className={`mb-4 inline-flex items-center justify-center w-12 h-12 rounded-md ${item.color}`}>{item.icon}</div>
                                <h3 className="text-xl font-bold mb-3 text-ink">{item.title}</h3>
                                <p className="text-ink-muted text-sm leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Open Positions Section */}
                <motion.section
                    id="open-positions"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-32"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-ink">{t('careers.open_positions_title')}</h2>
                        <p className="text-xl text-ink-muted max-w-2xl mx-auto">{t('careers.open_positions_description')}</p>
                    </div>
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {loadingPositions ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-ink-muted">{t('careers.loading_jobs')}</p>
                            </div>
                        ) : openPositions.length === 0 ? (
                            <div className="text-center py-12 text-ink-muted">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>{t('careers.no_positions')}</p>
                            </div>
                        ) : (
                            openPositions.map((position, index) => {
                                const jobId = position._id || index;
                                const isExpanded = expandedJobs[jobId];
                                const description = position.description || '';
                                const truncatedDescription = description.length > 200 ? description.substring(0, 200) + '...' : description;
                                const shouldTruncate = description.length > 200;
                                const hasResponsibilities = position.responsibilities && position.responsibilities.length > 0;
                                const hasRequirements = position.requirements && position.requirements.length > 0;
                                const hasAdditionalInfo = hasResponsibilities || hasRequirements;
                                const showExpandButton = shouldTruncate || hasAdditionalInfo;

                                return (
                                    <motion.div
                                        key={jobId}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-surface border border-hairline p-8 rounded-lg shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-all"
                                    >
                                        {/* Title and Apply Now button on same line */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                            <h3 className="text-2xl font-bold text-ink">{position.title}</h3>
                                            <button
                                                onClick={() => handleOpenModal(position.title, position.department)}
                                                className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-active transition-all whitespace-nowrap"
                                            >
                                                {t('careers.apply_now')}
                                            </button>
                                        </div>

                                        {/* Department, Location, Type */}
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted mb-6">
                                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-sky/10 text-accent-sky font-medium">
                                                <Briefcase className="w-4 h-4" />
                                                {position.department}
                                            </span>
                                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal font-medium">
                                                <MapPin className="w-4 h-4" />
                                                {position.location}
                                            </span>
                                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange font-medium">
                                                <Clock className="w-4 h-4" />
                                                {position.type}
                                            </span>
                                        </div>

                                        {/* Description */}

                                        <div className="mb-6">
                                            <p className="text-ink-secondary leading-relaxed">
                                                {isExpanded || !shouldTruncate ? description : truncatedDescription}
                                            </p>
                                        </div>

                                        {/* Show More/Less button */}
                                        {showExpandButton && (
                                            <div className="mb-6">
                                                <button
                                                    onClick={() => toggleJobExpansion(jobId)}
                                                    className="flex items-center gap-2 text-primary hover:text-primary-active transition-colors text-sm font-medium group"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            {t('careers.show_less')}
                                                            <ChevronRight className="w-4 h-4 transform rotate-90 transition-transform duration-200" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {t('careers.show_more')}
                                                            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Responsibilities and Requirements - Only shown when expanded */}
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-6"
                                            >
                                                {/* Responsibilities */}
                                                {position.responsibilities && position.responsibilities.length > 0 && (
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-ink mb-3">
                                                            {t('careers.responsibilities')}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {position.responsibilities.map((responsibility, idx) => (
                                                                <li key={idx} className="text-ink-secondary flex items-start gap-2">
                                                                    <span className="text-primary mt-1.5">•</span>
                                                                    <span className="leading-relaxed">{responsibility}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Requirements */}
                                                {position.requirements && position.requirements.length > 0 && (
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-ink mb-3">
                                                            {t('careers.requirements')}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {position.requirements.map((requirement, idx) => (
                                                                <li key={idx} className="text-ink-secondary flex items-start gap-2">
                                                                    <span className="text-primary mt-1.5">•</span>
                                                                    <span className="leading-relaxed">{requirement}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.section>

                {/* Benefits Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-32"
                >
                    <div className="bg-surface border border-hairline rounded-xl p-12 md:p-16 relative overflow-hidden shadow-[var(--shadow-level-1)]">
                        <div className="relative z-10 max-w-4xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight text-ink">{t('careers.benefits_title')}</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 p-4 bg-canvas-soft rounded-md"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-on-primary" />
                                        </div>
                                        <span className="text-ink-secondary">{benefit.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-32"
                >
                    <div className="bg-canvas-soft border border-hairline rounded-xl p-12 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-ink">{t('careers.cta_title')}</h2>
                            <p className="text-xl text-ink-muted mb-8 max-w-2xl mx-auto">
                                {t('careers.cta_description')}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleOpenModal('')}
                                    className="px-8 py-4 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-active transition-all text-lg shadow-[var(--shadow-level-1)]"
                                >
                                    {t('careers.apply_now')}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/contact')}
                                    className="px-8 py-4 bg-surface text-ink font-bold rounded-full hover:bg-canvas-soft transition-all text-lg border border-hairline shadow-[var(--shadow-level-1)]"
                                >
                                    {t('careers.contact_us')}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </main>

            <footer className="border-t border-hairline bg-canvas-soft pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-ink-faint">{t('careers.footer_rights')}</p>
                </div>
            </footer>

            {/* Application Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Backdrop with blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md"
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-surface border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-[var(--shadow-level-2)]"
                            >
                                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                                    {/* Modal Header - Fixed */}
                                    <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-hairline flex-shrink-0 gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl sm:text-2xl font-bold text-ink break-words">{t('careers.apply_for', { position: selectedPosition || t('careers.position') })}</h2>
                                            <p className="text-ink-muted text-xs sm:text-sm mt-1 hidden sm:block">{t('careers.apply_description')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="p-2 hover:bg-canvas-soft rounded-md transition-colors flex-shrink-0"
                                            aria-label="Close modal"
                                        >
                                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-ink-muted hover:text-ink" />
                                        </button>
                                    </div>
                                    <p className="text-ink-muted text-xs mb-4 sm:hidden">{t('careers.apply_description')}</p>
                                    
                                    {/* Scrollable Form Content */}
                                    <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 sm:space-y-6 custom-scrollbar min-h-0">
                                    {/* Personal Information */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.personal_information')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.first_name')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.first_name_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.last_name')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.last_name_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.email_address')} *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.email_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.phone_number')} *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.phone_placeholder')}
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.location')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.location_placeholder')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Links */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.professional_links')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" /> {t('careers.linkedin')}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.linkedinUrl}
                                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.linkedin_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" /> {t('careers.portfolio')}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.portfolioUrl}
                                                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.portfolio_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" /> {t('careers.github')}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.githubUrl}
                                                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.github_placeholder')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position Details */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.position_details')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.position')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.position}
                                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.position_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.department')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.department_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.expected_salary')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.expectedSalary}
                                                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.expected_salary_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('careers.availability')} *</label>
                                                <select
                                                    required
                                                    value={formData.availability}
                                                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink transition-all"
                                                >
                                                    <option value="immediate">{t('careers.availability_immediate')}</option>
                                                    <option value="2 weeks">{t('careers.availability_2_weeks')}</option>
                                                    <option value="1 month">{t('careers.availability_1_month')}</option>
                                                    <option value="2 months">{t('careers.availability_2_months')}</option>
                                                    <option value="3+ months">{t('careers.availability_3_months')}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resume Upload */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.resume_cv')} *</h3>
                                        <div className="border-2 border-dashed border-hairline rounded-md p-4 sm:p-6 text-center hover:border-primary transition-colors">
                                            <input
                                                type="file"
                                                id="resume-upload"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleResumeChange}
                                                className="hidden"
                                            />
                                            <label htmlFor="resume-upload" className="cursor-pointer">
                                                {resumeFile ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <FileText className="w-8 h-8 text-primary" />
                                                        <div className="text-left">
                                                            <p className="text-ink font-medium">{resumeFile.name}</p>
                                                            <p className="text-ink-muted text-sm">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-ink-faint" />
                                                        <p className="text-ink-secondary mb-1 text-sm sm:text-base">{t('careers.upload_instructions')}</p>
                                                        <p className="text-ink-faint text-xs sm:text-sm">{t('careers.upload_formats')}</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Cover Letter */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.cover_letter')} *</h3>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formData.coverLetter}
                                            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all resize-none custom-scrollbar text-sm sm:text-base"
                                            placeholder={t('careers.cover_letter_placeholder')}
                                        />
                                    </div>

                                    {/* Why Presento */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.why_inavora')}</h3>
                                        <textarea
                                            rows={4}
                                            value={formData.whyInavora}
                                            onChange={(e) => setFormData({ ...formData, whyInavora: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all resize-none custom-scrollbar text-sm sm:text-base"
                                            placeholder={t('careers.why_inavora_placeholder')}
                                        />
                                    </div>

                                    {/* Additional Info */}
                                    <div className="bg-canvas-soft border border-hairline rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4 pb-2 border-b border-hairline">{t('careers.additional_information')}</h3>
                                        <textarea
                                            rows={3}
                                            value={formData.additionalInfo}
                                            onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface border border-hairline rounded-xs focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none text-ink placeholder-ink-faint transition-all resize-none custom-scrollbar text-sm sm:text-base"
                                            placeholder={t('careers.additional_information_placeholder')}
                                        />
                                    </div>
                                    </div>

                                    {/* Footer - Fixed */}
                                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-hairline flex-shrink-0">
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                disabled={isSubmitting}
                                                className="w-full sm:flex-1 py-2.5 sm:py-3 bg-surface text-ink font-semibold rounded-full border border-hairline hover:bg-canvas-soft transition-all disabled:opacity-50 text-sm sm:text-base"
                                            >
                                                {t('careers.back')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full sm:flex-1 py-2.5 sm:py-3 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-active transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="hidden sm:inline">{t('careers.submitting')}</span>
                                                        <span className="sm:hidden">{t('careers.submitting_short')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        <span className="hidden sm:inline">{t('careers.submit_application')}</span>
                                                        <span className="sm:hidden">{t('careers.submit')}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Careers;