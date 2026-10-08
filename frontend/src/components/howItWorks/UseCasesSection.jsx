import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Building2, Calendar, CheckCircle2, DollarSign, Gamepad2, Gavel, Globe,
  GraduationCap, HeartHandshake, Landmark, Laptop, Rocket, Search,
  ShoppingBag, Stethoscope, Users2
} from 'lucide-react';

// Shared with PricingFAQSection.jsx (and the sections of HowItWorks.jsx
// still inline) - duplicated here rather than threaded in as a prop, since
// these are pure, static objects, not state.
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

/**
 * "Use Cases" section of the How It Works page. Split out of
 * HowItWorks.jsx; see CODE_STANDARDS.md. Fully self-contained.
 */
export default function UseCasesSection() {
  const { t } = useTranslation();

  // Use Cases Section
  return (
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
  );
}
