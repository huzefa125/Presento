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
            color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: t('careers.why_join_team_title'),
            description: t('careers.why_join_team_desc'),
            color: "text-teal-400 bg-teal-500/10 border-teal-500/20"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: t('careers.why_join_growth_title'),
            description: t('careers.why_join_growth_desc'),
            color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
        },
        {
            icon: <Heart className="w-6 h-6" />,
            title: t('careers.why_join_impact_title'),
            description: t('careers.why_join_impact_desc'),
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
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
        <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden selection:bg-teal-500 selection:text-white font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-orange-500/10 blur-[100px] animate-pulse delay-2000" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/5">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-xl font-bold text-white">𝑖</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">{t('navbar.brand_name')}</span>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center border border-white/30 px-3 py-1 rounded-lg gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                        <span className="text-sm font-medium text-blue-200">{t('careers.hero_badge')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                        {t('careers.hero_title')} <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400">
                            {t('careers.hero_title_highlight')}
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-12">
                        {t('careers.hero_description')}
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all text-lg"
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
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('careers.why_join_title')}</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t('careers.why_join_description')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {whyJoinUs.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-8 rounded-2xl border ${item.color} backdrop-blur-sm hover:bg-opacity-20 transition-all`}
                            >
                                <div className="mb-4">{item.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
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
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('careers.open_positions_title')}</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t('careers.open_positions_description')}</p>
                    </div>
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {loadingPositions ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">{t('careers.loading_jobs')}</p>
                            </div>
                        ) : openPositions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
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
                                        className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all"
                                    >
                                        {/* Title and Apply Now button on same line */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                            <h3 className="text-2xl font-bold">{position.title}</h3>
                                            <button
                                                onClick={() => handleOpenModal(position.title, position.department)}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all whitespace-nowrap"
                                            >
                                                {t('careers.apply_now')}
                                            </button>
                                        </div>

                                        {/* Department, Location, Type */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                                            <span className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                {position.department}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {position.location}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {position.type}
                                            </span>
                                        </div>

                                        {/* Description */}

                                        <div className="mb-6">
                                            <p className="text-gray-300 leading-relaxed">
                                                {isExpanded || !shouldTruncate ? description : truncatedDescription}
                                            </p>
                                        </div>

                                        {/* Show More/Less button */}
                                        {showExpandButton && (
                                            <div className="mb-6">
                                                <button
                                                    onClick={() => toggleJobExpansion(jobId)}
                                                    className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium group"
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
                                                        <h4 className="text-lg font-semibold text-white mb-3">
                                                            {t('careers.responsibilities')}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {position.responsibilities.map((responsibility, idx) => (
                                                                <li key={idx} className="text-gray-300 flex items-start gap-2">
                                                                    <span className="text-teal-400 mt-1.5">•</span>
                                                                    <span className="leading-relaxed">{responsibility}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Requirements */}
                                                {position.requirements && position.requirements.length > 0 && (
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-white mb-3">
                                                            {t('careers.requirements')}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {position.requirements.map((requirement, idx) => (
                                                                <li key={idx} className="text-gray-300 flex items-start gap-2">
                                                                    <span className="text-teal-400 mt-1.5">•</span>
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
                    <div className="bg-gradient-to-br from-blue-900/20 via-teal-900/20 to-slate-900 border border-white/10 rounded-3xl p-12 md:p-16 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500" />
                        <div className="relative z-10 max-w-4xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t('careers.benefits_title')}</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-300">{benefit.text}</span>
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
                    <div className="bg-gradient-to-r from-blue-900/40 to-teal-900/40 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500" />
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('careers.cta_title')}</h2>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                                {t('careers.cta_description')}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleOpenModal('')}
                                    className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-gray-100 transition-all text-lg shadow-xl"
                                >
                                    {t('careers.apply_now')}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/contact')}
                                    className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-lg border border-white/20"
                                >
                                    {t('careers.contact_us')}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </main>

            <footer className="border-t border-white/10 bg-[#0f172a] pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-gray-500">{t('careers.footer_rights')}</p>
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
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
                        />
                        
                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#1e293b] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
                            >
                                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                                    {/* Modal Header - Fixed */}
                                    <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10 flex-shrink-0 gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl sm:text-2xl font-bold text-white break-words">{t('careers.apply_for', { position: selectedPosition || t('careers.position') })}</h2>
                                            <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">{t('careers.apply_description')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                            aria-label="Close modal"
                                        >
                                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-white" />
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-4 sm:hidden">{t('careers.apply_description')}</p>
                                    
                                    {/* Scrollable Form Content */}
                                    <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 sm:space-y-6 custom-scrollbar min-h-0">
                                    {/* Personal Information */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.personal_information')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.first_name')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.first_name_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.last_name')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.last_name_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.email_address')} *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.email_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.phone_number')} *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.phone_placeholder')}
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.location')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.location_placeholder')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Links */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.professional_links')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" /> {t('careers.linkedin')}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.linkedinUrl}
                                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.linkedin_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" /> {t('careers.portfolio')}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.portfolioUrl}
                                                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.portfolio_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" /> {t('careers.github')}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.githubUrl}
                                                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.github_placeholder')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position Details */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.position_details')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.position')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.position}
                                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.position_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.department')} *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.department_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.expected_salary')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.expectedSalary}
                                                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all text-sm sm:text-base"
                                                    placeholder={t('careers.expected_salary_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('careers.availability')} *</label>
                                                <select
                                                    required
                                                    value={formData.availability}
                                                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white transition-all"
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
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.resume_cv')} *</h3>
                                        <div className="border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-6 text-center hover:border-teal-500/50 transition-colors">
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
                                                        <FileText className="w-8 h-8 text-teal-400" />
                                                        <div className="text-left">
                                                            <p className="text-white font-medium">{resumeFile.name}</p>
                                                            <p className="text-gray-400 text-sm">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                                                        <p className="text-gray-300 mb-1 text-sm sm:text-base">{t('careers.upload_instructions')}</p>
                                                        <p className="text-gray-500 text-xs sm:text-sm">{t('careers.upload_formats')}</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Cover Letter */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.cover_letter')} *</h3>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formData.coverLetter}
                                            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all resize-none custom-scrollbar text-sm sm:text-base"
                                            placeholder={t('careers.cover_letter_placeholder')}
                                        />
                                    </div>

                                    {/* Why Inavora */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.why_inavora')}</h3>
                                        <textarea
                                            rows={4}
                                            value={formData.whyInavora}
                                            onChange={(e) => setFormData({ ...formData, whyInavora: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all resize-none custom-scrollbar text-sm sm:text-base"
                                            placeholder={t('careers.why_inavora_placeholder')}
                                        />
                                    </div>

                                    {/* Additional Info */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 pb-2 border-b border-white/10">{t('careers.additional_information')}</h3>
                                        <textarea
                                            rows={3}
                                            value={formData.additionalInfo}
                                            onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all resize-none custom-scrollbar text-sm sm:text-base"
                                            placeholder={t('careers.additional_information_placeholder')}
                                        />
                                    </div>
                                    </div>

                                    {/* Footer - Fixed */}
                                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 flex-shrink-0">
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                disabled={isSubmitting}
                                                className="w-full sm:flex-1 py-2.5 sm:py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 text-sm sm:text-base"
                                            >
                                                {t('careers.back')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full sm:flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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