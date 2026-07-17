// eslint-disable-next-line
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {  Zap, Users, BarChart2, Globe, MessageCircle, Layers, Sparkles, Target, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const About = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const values = [
        {
            icon: <Zap className="w-6 h-6" />,
            title: t('about.values_engagement_first'),
            description: t('about.values_engagement_first_desc'),
            color: "text-accent-orange-deep bg-accent-orange/10 border-accent-orange/20"
        },
        {
            icon: <Layers className="w-6 h-6" />,
            title: t('about.values_radical_simplicity'),
            description: t('about.values_radical_simplicity_desc'),
            color: "text-primary bg-primary/10 border-primary/20"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: t('about.values_inclusivity'),
            description: t('about.values_inclusivity_desc'),
            color: "text-accent-green bg-accent-green/10 border-accent-green/20"
        },
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: t('about.values_innovation'),
            description: t('about.values_innovation_desc'),
            color: "text-accent-purple-deep bg-accent-purple/20 border-accent-purple/30"
        }
    ];

    const pillars = [
        { icon: <MessageCircle className="w-8 h-8 text-accent-sky" />, title: t('about.experience_pillar1') },
        { icon: <BarChart2 className="w-8 h-8 text-accent-teal" />, title: t('about.experience_pillar2') },
        { icon: <Globe className="w-8 h-8 text-accent-orange" />, title: t('about.experience_pillar3') },
        { icon: <Target className="w-8 h-8 text-accent-pink" />, title: t('about.experience_pillar4') },
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
                        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-xl font-bold text-on-primary">𝑖</span>
                        </div>
                        <span className="text-xl font-bold text-ink">{t('navbar.brand_name')}</span>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center border border-hairline bg-surface px-3 py-1 rounded-full gap-2 text-sm font-medium text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('contact.back')}
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-hairline mb-8 shadow-[var(--shadow-level-1)]">
                        <span className="flex h-2 w-2 rounded-full bg-accent-teal animate-pulse"></span>
                        <span className="text-sm font-medium text-primary">{t('about.mission_badge')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-ink tracking-tight">
                        {t('about.hero_title_line1')} <br />
                        <span className="text-primary">
                            {t('about.hero_title_line2')}
                        </span>
                    </h1>
                    <p className="text-xl text-ink-muted leading-relaxed max-w-2xl mx-auto">
                        {t('about.hero_description')}
                    </p>
                </motion.div>

                {/* Pillars Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-32"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-ink tracking-tight">{t('about.experience_title')}</h2>
                        <p className="text-ink-muted">{t('about.experience_description')}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {pillars.map((pillar, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -5 }}
                                className="bg-surface border border-hairline p-8 rounded-lg flex flex-col items-center text-center hover:shadow-[var(--shadow-level-1)] transition-all"
                            >
                                <div className="mb-4 p-4 bg-canvas-soft rounded-full">{pillar.icon}</div>
                                <h3 className="font-bold text-lg text-ink">{pillar.title}</h3>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Values Section */}
                <section className="mb-32">
                    <div className="flex flex-col md:flex-row items-start gap-16">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="md:w-1/3"
                        >
                            <h2 className="text-4xl font-bold mb-6 text-ink tracking-tight">{t('about.values_title')} <span className="text-accent-teal">{t('about.values_highlight')}</span></h2>
                            <p className="text-ink-muted text-lg leading-relaxed mb-8">
                                {t('about.values_description')}
                            </p>
                            <div className="p-6 bg-canvas-soft rounded-lg border border-hairline">
                                <p className="text-xl font-medium italic text-ink">"{t('about.values_quote')}"</p>
                            </div>
                        </motion.div>

                        <div className="md:w-2/3 grid sm:grid-cols-2 gap-6">
                            {values.map((value, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-8 rounded-lg border ${value.color} hover:shadow-[var(--shadow-level-1)] transition-all`}
                                >
                                    <div className="mb-4">{value.icon}</div>
                                    <h3 className="text-xl font-bold mb-3 text-ink">{value.title}</h3>
                                    <p className="text-ink-secondary text-sm leading-relaxed">
                                        {value.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-canvas-soft border border-hairline rounded-xl p-12 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-sky via-accent-teal to-accent-orange" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-ink tracking-tight">{t('about.cta_title')}</h2>
                        <p className="text-xl text-ink-secondary mb-8 max-w-2xl mx-auto">
                            {t('about.cta_description')}
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-active active:scale-95 transition-all text-lg shadow-[var(--shadow-level-1)]"
                        >
                            {t('about.cta_button')}
                        </button>
                    </div>
                </motion.div>
            </main>

            <footer className="border-t border-hairline bg-canvas-soft pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-ink-faint">{t('footer.rights_reserved')}</p>
                </div>
            </footer>
        </div>
    );
};

export default About;