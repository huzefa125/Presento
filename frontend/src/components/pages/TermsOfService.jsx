import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Added translation hook

const TermsOfService = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(); // Added translation hook

    return (
        <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden selection:bg-teal-500 selection:text-white font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
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
                        {t('common.back') || 'Back'}
                    </button>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20 container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 leading-16">
                        {t('terms.title')}
                    </h1>
                    <p className="text-gray-400 mb-8">{t('terms.last_updated')}</p>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.section1_title')}</h2>
                            <p>
                                {t('terms.section1_content')}
                            </p>
                        </section>

                        <section className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.section2_title')}</h2>
                            <p>
                                {t('terms.section2_content')}
                            </p>
                        </section>

                        <section className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.section3_title')}</h2>
                            <p>
                                {t('terms.section3_content')}
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>{t('terms.section3_point1')}</li>
                                <li>{t('terms.section3_point2')}</li>
                                <li>{t('terms.section3_point3')}</li>
                            </ul>
                        </section>

                        <section className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.section4_title')}</h2>
                            <p>
                                {t('terms.section4_content')}
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            <footer className="border-t border-white/10 bg-[#0f172a] pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-gray-500">{t('footer.rights_reserved', { brandName: t('navbar.brand_name') })}</p>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfService;