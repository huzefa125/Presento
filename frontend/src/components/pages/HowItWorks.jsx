// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Users,
    UserPlus,
    Globe,
    LayoutDashboard,
    FileText,
    Play,
    BarChart3,
    Upload,
    CheckCircle2,
    QrCode,
    Hash,
    Image as ImageIcon,
    Video,
    Type,
    MessageSquare,
    HelpCircle,
    Star,
    Trophy,
    Target,
    Zap,
    Brain,
    MousePointerClick,
    FileQuestion,
    FileCheck,
    ChevronRight,
    Sparkles,
    Lightbulb,
    Presentation,
    Settings,
    Eye,
    LogIn,
    Plus,
    Edit,
    Share2,
    BookOpen,
    GraduationCap,
    Building2,
    Users2,
    HeartHandshake,
    Rocket,
    Briefcase,
    Landmark,
    Scale,
    Stethoscope,
    Calendar,
    Search,
    ShoppingBag,
    Laptop,
    Gavel,
    Gamepad2,
    Network,
    TrendingUp,
    DollarSign,
    Shield,
    Megaphone,
    CreditCard,
    Infinity as InfinityIcon,
    ArrowUp,
    ArrowDown,
    X,
    Crown,
    ChevronDown,
    Database,
    Lock,
    Mail,
    Trash2,
    Download,
    Cookie,
    AlertTriangle,
    UserCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HowItWorks = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [openPricingFAQ, setOpenPricingFAQ] = useState(null);
    const [openDataPrivacyFAQ, setOpenDataPrivacyFAQ] = useState(null);

    // Ensure component re-renders when language changes
    useEffect(() => {
        // This effect ensures the component re-renders when language changes
        // The useTranslation hook should handle this automatically, but this ensures it
    }, [i18n.language]);

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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    const togglePricingFAQ = (index) => {
        setOpenPricingFAQ(prev => {
            // If clicking the same item, close it. Otherwise, open the new one (closing the previous)
            return prev === index ? null : index;
        });
    };

    const toggleDataPrivacyFAQ = (index) => {
        setOpenDataPrivacyFAQ(prev => {
            // If clicking the same item, close it. Otherwise, open the new one (closing the previous)
            return prev === index ? null : index;
        });
    };

    const PricingFAQItem = ({ index, question, children }) => {
        const isOpen = openPricingFAQ === index;

        return (
            <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-[var(--shadow-level-1)] transition-shadow duration-300"
            >
                <button
                    onClick={() => togglePricingFAQ(index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-canvas-soft transition-colors"
                >
                    <h3 className="text-lg font-bold flex items-center gap-2 flex-1 text-ink">
                        <span className="text-accent-teal">{index}.</span>
                        <span>{question}</span>
                    </h3>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-ink-faint flex-shrink-0" />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 pt-0">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    const DataPrivacyFAQItem = ({ index, question, children, icon: Icon }) => {
        const isOpen = openDataPrivacyFAQ === index;

        return (
            <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-[var(--shadow-level-1)] transition-shadow duration-300"
            >
                <button
                    onClick={() => toggleDataPrivacyFAQ(index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-canvas-soft transition-colors"
                >
                    <h3 className="text-lg font-bold flex items-center gap-2 flex-1 text-ink">
                        {Icon && <Icon className="w-5 h-5 text-accent-sky flex-shrink-0" />}
                        <span className="text-accent-sky">{index}.</span>
                        <span>{question}</span>
                    </h3>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-ink-faint flex-shrink-0" />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 pt-0">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    const NestedDataPrivacyFAQItem = ({ index, question, children, icon: Icon }) => {
        const [isOpen, setIsOpen] = useState(false);
        
        const toggleFAQ = (e) => {
            e.stopPropagation(); // Prevent event from bubbling up to parent FAQ
            setIsOpen(!isOpen);
        };

        return (
            <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-canvas-soft border border-hairline rounded-lg overflow-hidden hover:bg-canvas transition-colors duration-300 ml-4"
            >
                <button
                    onClick={toggleFAQ}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 transition-colors"
                >
                    <h4 className="font-bold flex items-center gap-2 flex-1 text-ink">
                        {Icon && <Icon className="w-4 h-4 text-accent-sky flex-shrink-0" />}
                        <span className="text-accent-sky">{index}.</span>
                        <span className="text-sm">{question}</span>
                    </h4>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-4 h-4 text-ink-faint flex-shrink-0" />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 pt-0 text-sm">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    const StepCard = ({ number, icon: Icon, title, description, steps, color = "blue" }) => {
        const colorClasses = {
            blue: "bg-accent-sky",
            teal: "bg-accent-teal",
            purple: "bg-accent-purple-deep",
            orange: "bg-accent-orange-deep",
            green: "bg-accent-green"
        };

        if (!Icon) {
            return null;
        }

        return (
            <motion.div
                variants={itemVariants}
                className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] transition-shadow duration-300"
            >
                <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-md ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-ink-faint">#{number}</span>
                            <h3 className="text-xl font-bold text-ink">{title}</h3>
                        </div>
                        <p className="text-ink-secondary mb-4 leading-relaxed">{description}</p>
                        {steps && (
                            <div className="space-y-3 mt-4">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-on-primary">{idx + 1}</span>
                                        </div>
                                        <p className="text-ink-secondary text-sm flex-1">{step}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const FeatureCard = ({ icon: Icon, title, description, color = "blue" }) => {
        const colorClasses = {
            blue: "text-accent-sky",
            teal: "text-accent-teal",
            purple: "text-accent-purple-deep",
            orange: "text-accent-orange-deep",
            green: "text-accent-green"
        };

        return (
            <motion.div
                variants={itemVariants}
                className="bg-surface border border-hairline rounded-lg p-5 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow duration-300"
            >
                <div className="flex items-center gap-3 mb-3">
                    {Icon && <Icon className={`w-6 h-6 ${colorClasses[color]}`} />}
                    <h4 className="font-semibold text-ink">{title}</h4>
                </div>
                <p className="text-ink-secondary text-sm leading-relaxed">{description}</p>
            </motion.div>
        );
    };

    const FlowDiagram = ({ steps }) => {
        return (
            <div className="flex items-center justify-center gap-4 flex-wrap py-8">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2, type: "spring" }}
                            className="bg-accent-sky rounded-md p-4 shadow-[var(--shadow-level-1)]"
                        >
                            <step.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        {idx < steps.length - 1 && (
                            <ChevronRight className="w-6 h-6 text-ink-faint" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div key={i18n.language} className="min-h-screen bg-canvas-soft text-ink overflow-x-hidden selection:bg-primary selection:text-on-primary font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-sky/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-teal/10 blur-[120px]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-accent-orange/10 blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-canvas/80 border-b border-hairline">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-xl font-bold text-on-primary">𝑖</span>
                        </div>
                        <span className="text-xl font-bold text-ink leading-tight">{t('navbar.brand_name')}</span>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center bg-surface border border-hairline px-3 py-1 rounded-md gap-2 text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('contact.back')}
                    </button>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="container mx-auto px-6 text-center mb-20"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <BookOpen className="w-8 h-8 text-accent-teal" />
                        <h1 className="text-5xl md:text-6xl font-bold text-ink tracking-tight leading-tight">
                            {t('how_it_works.hero.title')}
                        </h1>
                    </div>
                    <p className="text-xl text-ink-secondary max-w-3xl mx-auto mt-4">
                        {t('how_it_works.hero.subtitle')}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-ink-muted">
                        <Sparkles className="w-4 h-4" />
                        <span>{t('how_it_works.hero.tagline')}</span>
                    </div>
                </motion.section>

                {/* Quick Start - Two Paths */}
                <section className="container mx-auto px-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-ink tracking-tight">
                            <Zap className="w-8 h-8 text-accent-orange" />
                            {t('how_it_works.quick_start.title')}
                        </h2>
                        <p className="text-ink-secondary">{t('how_it_works.quick_start.subtitle')}</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {/* Participant Path */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-surface border border-hairline rounded-lg p-8 shadow-[var(--shadow-level-1)]"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-8 h-8 text-accent-sky" />
                                <h3 className="text-2xl font-bold text-ink">{t('how_it_works.quick_start.participant.title')}</h3>
                            </div>
                            <p className="text-ink-secondary mb-6">{t('how_it_works.quick_start.participant.description')}</p>

                            <FlowDiagram steps={[
                                { icon: QrCode },
                                { icon: Hash },
                                { icon: UserPlus },
                                { icon: Eye }
                            ]} />

                            <div className="space-y-3 mt-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.quick_start.participant.option1_title')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.quick_start.participant.option1_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.quick_start.participant.option2_title')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.quick_start.participant.option2_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Presenter Path */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-surface border border-hairline rounded-lg p-8 shadow-[var(--shadow-level-1)]"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Presentation className="w-8 h-8 text-accent-purple-deep" />
                                <h3 className="text-2xl font-bold text-ink">{t('how_it_works.quick_start.presenter.title')}</h3>
                            </div>
                            <p className="text-ink-secondary mb-6">{t('how_it_works.quick_start.presenter.description')}</p>

                            <FlowDiagram steps={[
                                { icon: LogIn },
                                { icon: LayoutDashboard },
                                { icon: Plus },
                                { icon: Play }
                            ]} />

                            <div className="space-y-3 mt-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.quick_start.presenter.option1_title')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.quick_start.presenter.option1_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.quick_start.presenter.option2_title')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.quick_start.presenter.option2_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Detailed Steps */}
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="container mx-auto px-6 mb-20"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-ink tracking-tight">
                            <Lightbulb className="w-8 h-8 text-accent-orange" />
                            {t('how_it_works.steps.title')}
                        </h2>
                        <p className="text-ink-secondary">{t('how_it_works.steps.subtitle')}</p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Step 1: Join Presentation */}
                        <StepCard
                            number={1}
                            icon={Users}
                            title={t('how_it_works.steps.step1.title')}
                            description={t('how_it_works.steps.step1.description')}
                            color="blue"
                            steps={[
                                t('how_it_works.steps.step1.step1'),
                                t('how_it_works.steps.step1.step2'),
                                t('how_it_works.steps.step1.step3'),
                                t('how_it_works.steps.step1.step4'),
                                t('how_it_works.steps.step1.step5')
                            ]}
                        />

                        {/* Step 2: Create Account */}
                        <StepCard
                            number={2}
                            icon={UserPlus}
                            title={t('how_it_works.steps.step2.title')}
                            description={t('how_it_works.steps.step2.description')}
                            color="teal"
                            steps={[
                                t('how_it_works.steps.step2.step1'),
                                t('how_it_works.steps.step2.step2'),
                                t('how_it_works.steps.step2.step3'),
                                t('how_it_works.steps.step2.step4'),
                                t('how_it_works.steps.step2.step5')
                            ]}
                        />

                        {/* Step 3: Change Language */}
                        <StepCard
                            number={3}
                            icon={Globe}
                            title={t('how_it_works.steps.step3.title')}
                            description={t('how_it_works.steps.step3.description')}
                            color="purple"
                            steps={[
                                t('how_it_works.steps.step3.step1'),
                                t('how_it_works.steps.step3.step2'),
                                t('how_it_works.steps.step3.step3'),
                                t('how_it_works.steps.step3.step4')
                            ]}
                        />

                        {/* Step 4: Dashboard */}
                        <StepCard
                            number={4}
                            icon={LayoutDashboard}
                            title={t('how_it_works.steps.step4.title')}
                            description={t('how_it_works.steps.step4.description')}
                            color="orange"
                            steps={[
                                t('how_it_works.steps.step4.step1'),
                                t('how_it_works.steps.step4.step2'),
                                t('how_it_works.steps.step4.step3'),
                                t('how_it_works.steps.step4.step4'),
                                t('how_it_works.steps.step4.step5')
                            ]}
                        />

                        {/* Step 5: Create Presentation */}
                        <StepCard
                            number={5}
                            icon={Plus}
                            title={t('how_it_works.steps.step5.title')}
                            description={t('how_it_works.steps.step5.description')}
                            color="green"
                            steps={[
                                t('how_it_works.steps.step5.step1'),
                                t('how_it_works.steps.step5.step2'),
                                t('how_it_works.steps.step5.step3'),
                                t('how_it_works.steps.step5.step4'),
                                t('how_it_works.steps.step5.step5')
                            ]}
                        />
                    </div>
                </motion.section>

                {/* Slide Types Section */}
                <section className="container mx-auto px-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-ink tracking-tight">
                            <FileText className="w-8 h-8 text-accent-teal" />
                            {t('how_it_works.slide_types.title')}
                        </h2>
                        <p className="text-ink-secondary">{t('how_it_works.slide_types.subtitle')}</p>
                    </motion.div>

                    <div className="max-w-6xl mx-auto">
                        {/* Present Content Section */}
                        <motion.div
                            variants={itemVariants}
                            className="mb-12"
                        >
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-ink tracking-tight">
                                <Presentation className="w-6 h-6 text-accent-sky" />
                                {t('how_it_works.slide_types.present_content.title')}
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FeatureCard
                                    icon={Type}
                                    title={t('how_it_works.slide_types.present_content.text_slide.title')}
                                    description={t('how_it_works.slide_types.present_content.text_slide.description')}
                                    color="blue"
                                />
                                <FeatureCard
                                    icon={ImageIcon}
                                    title={t('how_it_works.slide_types.present_content.image_slide.title')}
                                    description={t('how_it_works.slide_types.present_content.image_slide.description')}
                                    color="teal"
                                />
                                <FeatureCard
                                    icon={Video}
                                    title={t('how_it_works.slide_types.present_content.video_slide.title')}
                                    description={t('how_it_works.slide_types.present_content.video_slide.description')}
                                    color="purple"
                                />
                                <FeatureCard
                                    icon={HelpCircle}
                                    title={t('how_it_works.slide_types.present_content.instruction_slide.title')}
                                    description={t('how_it_works.slide_types.present_content.instruction_slide.description')}
                                    color="orange"
                                />
                            </div>
                        </motion.div>

                        {/* Engage Audience Section */}
                        <motion.div
                            variants={itemVariants}
                            className="mb-12"
                        >
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-ink tracking-tight">
                                <Users2 className="w-6 h-6 text-accent-purple-deep" />
                                {t('how_it_works.slide_types.engage_audience.title')}
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FeatureCard
                                    icon={MousePointerClick}
                                    title={t('how_it_works.slide_types.engage_audience.choose_one.title')}
                                    description={t('how_it_works.slide_types.engage_audience.choose_one.description')}
                                    color="blue"
                                />
                                <FeatureCard
                                    icon={Trophy}
                                    title={t('how_it_works.slide_types.engage_audience.quiz.title')}
                                    description={t('how_it_works.slide_types.engage_audience.quiz.description')}
                                    color="teal"
                                />
                                <FeatureCard
                                    icon={Brain}
                                    title={t('how_it_works.slide_types.engage_audience.word_cloud.title')}
                                    description={t('how_it_works.slide_types.engage_audience.word_cloud.description')}
                                    color="purple"
                                />
                                <FeatureCard
                                    icon={MessageSquare}
                                    title={t('how_it_works.slide_types.engage_audience.open_response.title')}
                                    description={t('how_it_works.slide_types.engage_audience.open_response.description')}
                                    color="orange"
                                />
                                <FeatureCard
                                    icon={Star}
                                    title={t('how_it_works.slide_types.engage_audience.rating_scale.title')}
                                    description={t('how_it_works.slide_types.engage_audience.rating_scale.description')}
                                    color="green"
                                />
                                <FeatureCard
                                    icon={Target}
                                    title={t('how_it_works.slide_types.engage_audience.rank_options.title')}
                                    description={t('how_it_works.slide_types.engage_audience.rank_options.description')}
                                    color="blue"
                                />
                                <FeatureCard
                                    icon={HelpCircle}
                                    title={t('how_it_works.slide_types.engage_audience.audience_questions.title')}
                                    description={t('how_it_works.slide_types.engage_audience.audience_questions.description')}
                                    color="teal"
                                />
                                <FeatureCard
                                    icon={Target}
                                    title={t('how_it_works.slide_types.engage_audience.number_guess.title')}
                                    description={t('how_it_works.slide_types.engage_audience.number_guess.description')}
                                    color="purple"
                                />
                                <FeatureCard
                                    icon={Star}
                                    title={t('how_it_works.slide_types.engage_audience.points_allocation.title')}
                                    description={t('how_it_works.slide_types.engage_audience.points_allocation.description')}
                                    color="orange"
                                />
                                <FeatureCard
                                    icon={BarChart3}
                                    title={t('how_it_works.slide_types.engage_audience.opinion_matrix.title')}
                                    description={t('how_it_works.slide_types.engage_audience.opinion_matrix.description')}
                                    color="green"
                                />
                                <FeatureCard
                                    icon={MousePointerClick}
                                    title={t('how_it_works.slide_types.engage_audience.spot_image.title')}
                                    description={t('how_it_works.slide_types.engage_audience.spot_image.description')}
                                    color="blue"
                                />
                            </div>
                        </motion.div>

                        {/* Challenge Mode Section */}
                        <motion.div
                            variants={itemVariants}
                        >
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-ink tracking-tight">
                                <Zap className="w-6 h-6 text-accent-orange" />
                                {t('how_it_works.slide_types.challenge_mode.title')}
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FeatureCard
                                    icon={FileCheck}
                                    title={t('how_it_works.slide_types.challenge_mode.pick_answer.title')}
                                    description={t('how_it_works.slide_types.challenge_mode.pick_answer.description')}
                                    color="orange"
                                />
                                <FeatureCard
                                    icon={FileQuestion}
                                    title={t('how_it_works.slide_types.challenge_mode.type_answer.title')}
                                    description={t('how_it_works.slide_types.challenge_mode.type_answer.description')}
                                    color="green"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* How to Use Features */}
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="container mx-auto px-6 mb-20"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-ink tracking-tight">
                            <Settings className="w-8 h-8 text-accent-teal" />
                            {t('how_it_works.features.title')}
                        </h2>
                        <p className="text-ink-secondary">{t('how_it_works.features.subtitle')}</p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-6">
                        <StepCard
                            number={6}
                            icon={Edit}
                            title={t('how_it_works.steps.step6.title')}
                            description={t('how_it_works.steps.step6.description')}
                            color="blue"
                            steps={[
                                t('how_it_works.steps.step6.step1'),
                                t('how_it_works.steps.step6.step2'),
                                t('how_it_works.steps.step6.step3'),
                                t('how_it_works.steps.step6.step4')
                            ]}
                        />

                        <StepCard
                            number={7}
                            icon={Play}
                            title={t('how_it_works.steps.step7.title')}
                            description={t('how_it_works.steps.step7.description')}
                            color="teal"
                            steps={[
                                t('how_it_works.steps.step7.step1'),
                                t('how_it_works.steps.step7.step2'),
                                t('how_it_works.steps.step7.step3'),
                                t('how_it_works.steps.step7.step4')
                            ]}
                        />

                        <StepCard
                            number={8}
                            icon={BarChart3}
                            title={t('how_it_works.steps.step8.title')}
                            description={t('how_it_works.steps.step8.description')}
                            color="purple"
                            steps={[
                                t('how_it_works.steps.step8.step1'),
                                t('how_it_works.steps.step8.step2'),
                                t('how_it_works.steps.step8.step3'),
                                t('how_it_works.steps.step8.step4')
                            ]}
                        />

                        <StepCard
                            number={9}
                            icon={Upload}
                            title={t('how_it_works.steps.step9.title')}
                            description={t('how_it_works.steps.step9.description')}
                            color="orange"
                            steps={[
                                t('how_it_works.steps.step9.step1'),
                                t('how_it_works.steps.step9.step2'),
                                t('how_it_works.steps.step9.step3'),
                                t('how_it_works.steps.step9.step4')
                            ]}
                        />
                    </div>
                </motion.section>

                {/* Pricing FAQ Section */}
                <section className="container mx-auto px-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-ink tracking-tight">
                            <CreditCard className="w-8 h-8 text-accent-teal" />
                            {t('how_it_works.pricing_faq.title')}
                        </h2>
                        <p className="text-ink-secondary max-w-3xl mx-auto">
                            {t('how_it_works.pricing_faq.subtitle')}
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Question 1 */}
                        <PricingFAQItem index={1} question={t('how_it_works.pricing_faq.q1.question')}>
                            <p className="text-ink-secondary mb-3">{t('how_it_works.pricing_faq.q1.answer')}</p>
                            <div className="grid md:grid-cols-2 gap-3 mt-4">
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <CheckCircle2 className="w-4 h-4 text-accent-teal" />
                                    <span><strong className="text-ink">{t('how_it_works.pricing_faq.q1.free')}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky" />
                                    <span><strong className="text-ink">{t('how_it_works.pricing_faq.q1.pro')}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <CheckCircle2 className="w-4 h-4 text-accent-purple-deep" />
                                    <span><strong className="text-ink">{t('how_it_works.pricing_faq.q1.lifetime')}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep" />
                                    <span><strong className="text-ink">{t('how_it_works.pricing_faq.q1.institution')}</strong></span>
                                </div>
                            </div>
                            <p className="text-ink-muted text-sm mt-3">{t('how_it_works.pricing_faq.q1.note')}</p>
                        </PricingFAQItem>

                        {/* Question 2 */}
                        <PricingFAQItem index={2} question={t('how_it_works.pricing_faq.q2.question')}>
                            <div className="mb-4">
                                <span className="text-2xl font-bold text-accent-teal">{t('how_it_works.pricing_faq.q2.price')}</span>
                                <span className="text-ink-muted ml-2">{t('how_it_works.pricing_faq.q2.price_label')}</span>
                            </div>
                            <p className="text-ink-secondary mb-4">{t('how_it_works.pricing_faq.q2.description')}</p>
                            <div className="space-y-2">
                                <p className="text-ink font-semibold mb-2">{t('how_it_works.pricing_faq.q2.includes_title')}</p>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.includes_user')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.includes_presentations')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.includes_slides')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.includes_audience')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.includes_slides_types')}</span>
                                    </li>
                                </ul>
                                <p className="text-ink font-semibold mt-4 mb-2">{t('how_it_works.pricing_faq.q2.not_includes_title')}</p>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    <li className="flex items-start gap-2">
                                        <X className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.not_includes_export')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <X className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.not_includes_import')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <X className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.not_includes_analytics')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <X className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q2.not_includes_ai')}</span>
                                    </li>
                                </ul>
                            </div>
                            <p className="text-ink-muted text-sm mt-3">{t('how_it_works.pricing_faq.q2.best_for')}</p>
                        </PricingFAQItem>

                        {/* Question 3 */}
                        <PricingFAQItem index={3} question={t('how_it_works.pricing_faq.q3.question')}>
                            <div className="mb-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-accent-sky">{t('how_it_works.pricing_faq.q3.price_monthly')}</span>
                                    <span className="text-ink-muted">{t('how_it_works.pricing_faq.q3.price_monthly_label')}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-xl font-bold text-accent-sky">{t('how_it_works.pricing_faq.q3.price_yearly')}</span>
                                    <span className="text-ink-muted">{t('how_it_works.pricing_faq.q3.price_yearly_label')}</span>
                                    <span className="text-accent-green text-sm ml-2">{t('how_it_works.pricing_faq.q3.price_yearly_save')}</span>
                                </div>
                            </div>
                            <p className="text-ink-secondary mb-4">{t('how_it_works.pricing_faq.q3.description')}</p>
                            <ul className="space-y-2 text-sm text-ink-secondary">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_user')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_presentations')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_slides')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_audience')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_export')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_import')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_analytics')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_ai')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q3.includes_support')}</span>
                                </li>
                            </ul>
                            <p className="text-ink-muted text-sm mt-3">{t('how_it_works.pricing_faq.q3.best_for')}</p>
                        </PricingFAQItem>

                        {/* Question 4 */}
                        <PricingFAQItem index={4} question={t('how_it_works.pricing_faq.q4.question')}>
                            <div className="mb-4 flex items-center gap-2">
                                <span className="text-2xl font-bold text-accent-purple-deep">{t('how_it_works.pricing_faq.q4.price')}</span>
                                <span className="text-ink-muted">{t('how_it_works.pricing_faq.q4.price_label')}</span>
                                <InfinityIcon className="w-5 h-5 text-accent-purple-deep" />
                            </div>
                            <p className="text-ink-secondary mb-4">{t('how_it_works.pricing_faq.q4.description')}</p>
                            <div className="space-y-2">
                                <p className="text-ink font-semibold mb-2">{t('how_it_works.pricing_faq.q4.includes_all_pro')}</p>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q4.includes_no_renewal')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q4.includes_updates')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                        <span>{t('how_it_works.pricing_faq.q4.includes_priority')}</span>
                                    </li>
                                </ul>
                            </div>
                            <p className="text-ink-muted text-sm mt-3">{t('how_it_works.pricing_faq.q4.best_for')}</p>
                        </PricingFAQItem>

                        {/* Question 5 */}
                        <PricingFAQItem index={5} question={t('how_it_works.pricing_faq.q5.question')}>
                            <p className="text-ink-secondary mb-4">{t('how_it_works.pricing_faq.q5.description')}</p>
                            <ul className="space-y-2 text-sm text-ink-secondary">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_users')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_presentations')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_slides')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_audience')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_export')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_import')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_analytics')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_ai')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_admin')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_permissions')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_support')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q5.includes_custom')}</span>
                                </li>
                            </ul>
                            <p className="text-ink-muted text-sm mt-3">{t('how_it_works.pricing_faq.q5.best_for')}</p>
                        </PricingFAQItem>

                        {/* Question 6 */}
                        <PricingFAQItem index={6} question={t('how_it_works.pricing_faq.q6.question')}>
                            <ul className="space-y-2 text-sm text-ink-secondary">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q6.step1')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q6.step2')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q6.step3')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q6.step4')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q6.step5')}</span>
                                </li>
                            </ul>
                        </PricingFAQItem>

                        {/* Question 7 */}
                        <PricingFAQItem index={7} question={t('how_it_works.pricing_faq.q7.question')}>
                            <p className="text-ink-secondary mb-3 font-semibold text-lg">{t('how_it_works.pricing_faq.q7.answer')}</p>
                        </PricingFAQItem>

                        {/* Question 8 */}
                        <PricingFAQItem index={8} question={t('how_it_works.pricing_faq.q8.question')}>
                            <p className="text-ink-secondary mb-3 font-semibold text-lg">{t('how_it_works.pricing_faq.q8.answer')}</p>
                        </PricingFAQItem>

                        {/* Question 9 */}
                        <PricingFAQItem index={9} question={t('how_it_works.pricing_faq.q9.question')}>
                            <p className="text-ink-secondary mb-3">{t('how_it_works.pricing_faq.q9.answer')}</p>
                        </PricingFAQItem>

                        {/* Question 10 */}
                        <PricingFAQItem index={10} question={t('how_it_works.pricing_faq.q10.question')}>
                            <p className="text-ink-secondary mb-3 font-semibold text-lg">{t('how_it_works.pricing_faq.q10.answer')}</p>
                        </PricingFAQItem>

                        {/* Question 11 */}
                        <PricingFAQItem index={11} question={t('how_it_works.pricing_faq.q11.question')}>
                            <p className="text-ink-secondary mb-3">{t('how_it_works.pricing_faq.q11.answer')}</p>
                        </PricingFAQItem>

                        {/* Question 12 */}
                        <PricingFAQItem index={12} question={t('how_it_works.pricing_faq.q12.question')}>
                            <div className="space-y-3 mt-4">
                                <div className="flex items-start gap-3 p-3 bg-canvas-soft rounded-md">
                                    <Sparkles className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.pricing_faq.q12.casual')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.pricing_faq.q12.casual_plan')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-canvas-soft rounded-md">
                                    <Briefcase className="w-5 h-5 text-accent-sky flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.pricing_faq.q12.regular')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.pricing_faq.q12.regular_plan')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-canvas-soft rounded-md">
                                    <InfinityIcon className="w-5 h-5 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.pricing_faq.q12.long_term')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.pricing_faq.q12.long_term_plan')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-canvas-soft rounded-md">
                                    <Building2 className="w-5 h-5 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-ink font-semibold">{t('how_it_works.pricing_faq.q12.organization')}</p>
                                        <p className="text-ink-secondary text-sm">{t('how_it_works.pricing_faq.q12.organization_plan')}</p>
                                    </div>
                                </div>
                            </div>
                        </PricingFAQItem>

                        {/* Question 13 */}
                        <PricingFAQItem index={13} question={t('how_it_works.pricing_faq.q13.question')}>
                            <ul className="space-y-2 text-sm text-ink-secondary">
                                <li className="flex items-start gap-2">
                                    <Crown className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q13.reason1')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Crown className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q13.reason2')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Crown className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q13.reason3')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Crown className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q13.reason4')}</span>
                                </li>
                            </ul>
                        </PricingFAQItem>

                        {/* Question 16 */}
                        <PricingFAQItem index={16} question={t('how_it_works.pricing_faq.q16.question')}>
                            <p className="text-ink-secondary mb-3">{t('how_it_works.pricing_faq.q16.ideal_for')}</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <GraduationCap className="w-4 h-4 text-accent-orange-deep" />
                                    <span>{t('how_it_works.pricing_faq.q16.schools')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <Briefcase className="w-4 h-4 text-accent-orange-deep" />
                                    <span>{t('how_it_works.pricing_faq.q16.corporate')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <HeartHandshake className="w-4 h-4 text-accent-orange-deep" />
                                    <span>{t('how_it_works.pricing_faq.q16.ngos')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                                    <Landmark className="w-4 h-4 text-accent-orange-deep" />
                                    <span>{t('how_it_works.pricing_faq.q16.government')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-ink-secondary md:col-span-2">
                                    <Building2 className="w-4 h-4 text-accent-orange-deep" />
                                    <span>{t('how_it_works.pricing_faq.q16.organizations')}</span>
                                </div>
                            </div>
                        </PricingFAQItem>

                        {/* Question 17 */}
                        <PricingFAQItem index={17} question={t('how_it_works.pricing_faq.q17.question')}>
                            <p className="text-ink-secondary mb-3">{t('how_it_works.pricing_faq.q17.answer')}</p>
                            <ul className="space-y-2 text-sm text-ink-secondary">
                                <li className="flex items-start gap-2">
                                    <HelpCircle className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q17.help1')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <HelpCircle className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q17.help2')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <HelpCircle className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                    <span>{t('how_it_works.pricing_faq.q17.help3')}</span>
                                </li>
                            </ul>
                        </PricingFAQItem>

                        {/* Question 18 */}
                        <PricingFAQItem index={18} question={t('how_it_works.pricing_faq.q18.question')}>
                            <div className="space-y-4">
                                <NestedDataPrivacyFAQItem index={1} question={t('how_it_works.data_privacy_faq.q1.question')} icon={Database}>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q1.answer')}</p>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q1.may_include')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q1.presenter_details')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q1.admin_details')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q1.presentation_content')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q1.participant_responses')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q1.usage_data')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mt-3">{t('how_it_works.data_privacy_faq.q1.note')}</p>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={2} question={t('how_it_works.data_privacy_faq.q2.question')} icon={UserCheck}>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q2.answer')}</p>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q2.participants')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary mb-3">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q2.no_account')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q2.join_code')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q2.optional_name')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q2.responses_treated')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q2.anonymous')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q2.pseudonymous')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={3} question={t('how_it_works.data_privacy_faq.q3.question')} icon={FileText}>
                                    <p className="text-ink-secondary mb-3 font-semibold">{t('how_it_works.data_privacy_faq.q3.answer')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q3.presenters_own')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q3.institutions_own')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q3.no_ownership')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={4} question={t('how_it_works.data_privacy_faq.q4.question')} icon={Shield}>
                                    <p className="text-ink-secondary mb-3 font-semibold">{t('how_it_works.data_privacy_faq.q4.answer')}</p>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q4.inavora')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q4.no_sell')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q4.no_share')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q4.no_marketing')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mt-3">{t('how_it_works.data_privacy_faq.q4.data_use')}</p>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={5} question={t('how_it_works.data_privacy_faq.q5.question')} icon={Lock}>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q5.answer')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary mb-3">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q5.secure_access')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q5.encrypted')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q5.role_based')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q5.for_institutions')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q5.gdpr')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q5.institutional')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={6} question={t('how_it_works.data_privacy_faq.q6.question')} icon={Database}>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q6.secure_cloud')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q6.restricted')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q6.monitoring')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mt-3 text-sm italic">{t('how_it_works.data_privacy_faq.q6.note')}</p>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={7} question={t('how_it_works.data_privacy_faq.q7.question')} icon={Settings}>
                                    <p className="text-ink-secondary mb-3 font-semibold">{t('how_it_works.data_privacy_faq.q7.answer')}</p>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q7.admins_can')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q7.manage_users')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q7.monitor')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q7.control_exports')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q7.apply_policies')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={8} question={t('how_it_works.data_privacy_faq.q8.question')} icon={Eye}>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q8.authorized')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q8.institution_level')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q8.no_exposure')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={9} question={t('how_it_works.data_privacy_faq.q9.question')} icon={Calendar}>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q9.active')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q9.request_deletion')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q9.delete_presentations')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mt-3">{t('how_it_works.data_privacy_faq.q9.note')}</p>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={10} question={t('how_it_works.data_privacy_faq.q10.question')} icon={Download}>
                                    <p className="text-ink-secondary mb-3 font-semibold">{t('how_it_works.data_privacy_faq.q10.answer')}</p>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q10.depending_plan')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q10.export_results')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q10.download_reports')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q10.maintain_records')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={11} question={t('how_it_works.data_privacy_faq.q11.question')} icon={Trash2}>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q11.account_removed')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q11.presentations_deleted')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q11.institutional_remains')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={12} question={t('how_it_works.data_privacy_faq.q12.question')} icon={Brain}>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q12.ai_features')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary mb-3">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q12.anonymized')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q12.no_expose')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q12.access_controls')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary">{t('how_it_works.data_privacy_faq.q12.opt_in')}</p>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={13} question={t('how_it_works.data_privacy_faq.q13.question')} icon={Cookie}>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q13.basic_cookies')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q13.no_intrusive')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q13.no_advertising')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={14} question={t('how_it_works.data_privacy_faq.q14.question')} icon={Shield}>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q14.inavora_uses')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q14.role_based_access')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q14.audit_logs')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q14.monitoring')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={15} question={t('how_it_works.data_privacy_faq.q15.question')} icon={Mail}>
                                    <p className="text-ink-secondary mb-3">
                                        <a href="mailto:support@inavora.com" className="text-primary hover:text-primary-active underline">{t('how_it_works.data_privacy_faq.q15.email')}</a>
                                    </p>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q15.institutions_can')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q15.dpa')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q15.security_docs')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q15.privacy_clarifications')}</span>
                                        </li>
                                    </ul>
                                </NestedDataPrivacyFAQItem>

                                <NestedDataPrivacyFAQItem index={16} question={t('how_it_works.data_privacy_faq.q16.question')} icon={AlertTriangle}>
                                    <p className="text-ink-secondary mb-3">{t('how_it_works.data_privacy_faq.q16.serves')}</p>
                                    <ul className="space-y-2 text-sm text-ink-secondary">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q16.schools')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q16.institutions')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{t('how_it_works.data_privacy_faq.q16.enterprises')}</span>
                                        </li>
                                    </ul>
                                    <p className="text-ink-secondary mt-3 font-semibold">{t('how_it_works.data_privacy_faq.q16.trust')}</p>
                                </NestedDataPrivacyFAQItem>
                            </div>
                        </PricingFAQItem>
                    </div>
                </section>




                {/* Use Cases Section */}
                <section id="use-cases-section" className="container mx-auto px-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3 text-ink tracking-tight">
                            <Globe className="w-8 h-8 text-accent-sky" />
                            {t('how_it_works.use_cases.title')}
                        </h2>
                        <p className="text-ink-secondary max-w-3xl mx-auto">
                            {t('how_it_works.use_cases.subtitle')}
                        </p>
                    </motion.div>

                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {/* Education & Learning */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-teal flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.education.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.education.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Startups & Businesses */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-sky flex items-center justify-center">
                                        <Rocket className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.startups.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.startups.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Corporate & Enterprise */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-purple-deep flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.corporate.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.corporate.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Investors & Financial Institutions */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-green flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.investors.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.investors.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Government & Public Sector */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-orange-deep flex items-center justify-center">
                                        <Landmark className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.government.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.government.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-orange-deep flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* NGOs, Foundations & Social Impact */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-pink flex items-center justify-center">
                                        <HeartHandshake className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.ngos.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.ngos.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-pink flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Events, Conferences & Meetups */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-sky flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.events.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.events.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Research & Data Collection */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-purple-deep flex items-center justify-center">
                                        <Search className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.research.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.research.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Healthcare & Medical Training */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-brown flex items-center justify-center">
                                        <Stethoscope className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.healthcare.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.healthcare.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-brown flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Communities & Associations */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-orange flex items-center justify-center">
                                        <Users2 className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.communities.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.communities.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-orange flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Marketing, Sales & Customer Engagement */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-teal flex items-center justify-center">
                                        <ShoppingBag className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.marketing.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.marketing.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Remote, Hybrid & Global Teams */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-purple-deep flex items-center justify-center">
                                        <Laptop className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.remote.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.remote.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-purple-deep flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Legal, Policy & Governance */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-ink-secondary flex items-center justify-center">
                                        <Gavel className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.legal.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.legal.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-ink-muted flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Gamification & Engagement */}
                            <motion.div variants={itemVariants} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-orange flex items-center justify-center">
                                        <Gamepad2 className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">{t('how_it_works.use_cases.gamification.title')}</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-ink-secondary">
                                    {t('how_it_works.use_cases.gamification.items', { returnObjects: true }).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-accent-orange flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Visual Flow Diagram */}
                <section className="container mx-auto px-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 text-ink tracking-tight">{t('how_it_works.flow_diagram.title')}</h2>
                        <p className="text-ink-secondary">{t('how_it_works.flow_diagram.subtitle')}</p>
                    </motion.div>

                    <div className="max-w-5xl mx-auto bg-surface border border-hairline rounded-lg p-8 shadow-[var(--shadow-level-1)]">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-full bg-accent-sky flex items-center justify-center">
                                    <UserPlus className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-sm text-ink-secondary text-center">{t('how_it_works.flow_diagram.step1')}</p>
                            </motion.div>

                            <ArrowRight className="w-8 h-8 text-ink-muted hidden md:block" />

                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-full bg-accent-teal flex items-center justify-center">
                                    <Plus className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-sm text-ink-secondary text-center">{t('how_it_works.flow_diagram.step2')}</p>
                            </motion.div>

                            <ArrowRight className="w-8 h-8 text-ink-muted hidden md:block" />

                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-full bg-accent-purple-deep flex items-center justify-center">
                                    <Share2 className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-sm text-ink-secondary text-center">{t('how_it_works.flow_diagram.step3')}</p>
                            </motion.div>

                            <ArrowRight className="w-8 h-8 text-ink-muted hidden md:block" />

                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-full bg-accent-orange-deep flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-sm text-ink-secondary text-center">{t('how_it_works.flow_diagram.step4')}</p>
                            </motion.div>

                            <ArrowRight className="w-8 h-8 text-ink-muted hidden md:block" />

                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-full bg-accent-green flex items-center justify-center">
                                    <BarChart3 className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-sm text-ink-secondary text-center">{t('how_it_works.flow_diagram.step5')}</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="container mx-auto px-6 text-center"
                >
                    <div className="bg-surface border border-hairline rounded-lg p-12 max-w-3xl mx-auto shadow-[var(--shadow-level-1)]">
                        <h2 className="text-3xl font-bold mb-4 text-ink tracking-tight">{t('how_it_works.cta.title')}</h2>
                        <p className="text-ink-secondary mb-8 text-lg">{t('how_it_works.cta.subtitle')}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-3 bg-primary text-on-primary rounded-full font-semibold hover:bg-primary-active active:scale-95 transition-all"
                            >
                                {t('how_it_works.cta.create_account')}
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-3 bg-surface border border-hairline rounded-full font-semibold text-ink hover:bg-canvas-soft transition-colors shadow-[var(--shadow-level-1)]"
                            >
                                {t('how_it_works.cta.join_presentation')}
                            </button>
                        </div>
                    </div>
                </motion.section>
            </main>

            <footer className="border-t border-hairline bg-canvas-soft pt-16 pb-8 mt-20">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-ink-secondary">{t('footer.rights_reserved', { brandName: 'Presento' })}</p>
                </div>
            </footer>
        </div>
    );
};

export default HowItWorks;

