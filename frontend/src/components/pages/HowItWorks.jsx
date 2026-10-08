// eslint-disable-next-line
import { motion } from 'framer-motion';
import { useEffect } from 'react';
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
    Users2,
    Scale,
    Network,
    TrendingUp,
    Megaphone,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import PricingFAQSection from '../howItWorks/PricingFAQSection';
import UseCasesSection from '../howItWorks/UseCasesSection';

const HowItWorks = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

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

                <PricingFAQSection />

                <UseCasesSection />

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

