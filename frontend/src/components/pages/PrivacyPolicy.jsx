import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-ink tracking-tight leading-tight">
                        {t('privacy.title')}
                    </h1>
                    <p className="text-ink-muted mb-8">{t('privacy.last_updated')}</p>

                    <div className="space-y-8 text-ink-secondary leading-relaxed">
                        <section className="bg-surface p-8 rounded-lg border border-hairline">
                            <h2 className="text-2xl font-bold text-ink mb-4 tracking-tight">{t('privacy.section1_title')}</h2>
                            <p>
                                {t('privacy.section1_content')}
                            </p>
                        </section>

                        <section className="bg-surface p-8 rounded-lg border border-hairline">
                            <h2 className="text-2xl font-bold text-ink mb-4 tracking-tight">{t('privacy.section2_title')}</h2>
                            <p className="mb-4">
                                {t('privacy.section2_content')}
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>{t('privacy.section2_point1')}</li>
                                <li>{t('privacy.section2_point2')}</li>
                                <li>{t('privacy.section2_point3')}</li>
                                <li>{t('privacy.section2_point4')}</li>
                            </ul>
                        </section>

                        <section className="bg-surface p-8 rounded-lg border border-hairline">
                            <h2 className="text-2xl font-bold text-ink mb-4 tracking-tight">{t('privacy.section3_title')}</h2>
                            <p>
                                {t('privacy.section3_content')}
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>{t('privacy.section3_point1')}</li>
                                <li>{t('privacy.section3_point2')}</li>
                                <li>{t('privacy.section3_point3')}</li>
                            </ul>
                        </section>

                        <section className="bg-surface p-8 rounded-lg border border-hairline">
                            <h2 className="text-2xl font-bold text-ink mb-4 tracking-tight">{t('privacy.section4_title')}</h2>
                            <p>
                                {t('privacy.section4_content')}
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            <footer className="border-t border-hairline bg-canvas-soft pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-ink-faint">{t('footer.rights_reserved', { brandName: t('navbar.brand_name') })}</p>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;