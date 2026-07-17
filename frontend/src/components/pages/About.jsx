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
            color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
        },
        {
            icon: <Layers className="w-6 h-6" />,
            title: t('about.values_radical_simplicity'),
            description: t('about.values_radical_simplicity_desc'),
            color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: t('about.values_inclusivity'),
            description: t('about.values_inclusivity_desc'),
            color: "text-green-400 bg-green-500/10 border-green-500/20"
        },
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: t('about.values_innovation'),
            description: t('about.values_innovation_desc'),
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
        }
    ];

    const pillars = [
        { icon: <MessageCircle className="w-8 h-8 text-blue-400" />, title: t('about.experience_pillar1') },
        { icon: <BarChart2 className="w-8 h-8 text-teal-400" />, title: t('about.experience_pillar2') },
        { icon: <Globe className="w-8 h-8 text-orange-400" />, title: t('about.experience_pillar3') },
        { icon: <Target className="w-8 h-8 text-red-400" />, title: t('about.experience_pillar4') },
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                        <span className="text-sm font-medium text-blue-200">{t('about.mission_badge')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                        {t('about.hero_title_line1')} <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400">
                            {t('about.hero_title_line2')}
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
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
                        <h2 className="text-3xl font-bold mb-4">{t('about.experience_title')}</h2>
                        <p className="text-gray-400">{t('about.experience_description')}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {pillars.map((pillar, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -5 }}
                                className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm flex flex-col items-center text-center hover:bg-white/10 transition-all"
                            >
                                <div className="mb-4 p-4 bg-white/5 rounded-full">{pillar.icon}</div>
                                <h3 className="font-bold text-lg">{pillar.title}</h3>
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
                            <h2 className="text-4xl font-bold mb-6">{t('about.values_title')} <span className="text-teal-400">{t('about.values_highlight')}</span></h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                {t('about.values_description')}
                            </p>
                            <div className="p-6 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-2xl border border-white/10">
                                <p className="text-xl font-medium italic">"{t('about.values_quote')}"</p>
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
                                    className={`p-8 rounded-2xl border ${value.color} backdrop-blur-sm hover:bg-opacity-20 transition-all`}
                                >
                                    <div className="mb-4">{value.icon}</div>
                                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">
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
                    className="bg-gradient-to-r from-blue-900/40 to-teal-900/40 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about.cta_title')}</h2>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            {t('about.cta_description')}
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-gray-100 transition-all text-lg shadow-xl"
                        >
                            {t('about.cta_button')}
                        </button>
                    </div>
                </motion.div>
            </main>

            <footer className="border-t border-white/10 bg-[#0f172a] pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-gray-500">{t('footer.rights_reserved')}</p>
                </div>
            </footer>
        </div>
    );
};

export default About;