import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown, Database, UserCheck, FileText, Shield, Lock, Settings, Eye,
  Calendar, Download, Trash2, Brain, Cookie, AlertTriangle, Mail,
  Briefcase, Building2, CheckCircle2, CreditCard, Crown, GraduationCap,
  HeartHandshake, HelpCircle, Landmark, Sparkles, X,
  Infinity as InfinityIcon
} from 'lucide-react';

// Shared with UseCasesSection.jsx (and the sections of HowItWorks.jsx still
// inline) - duplicated here rather than threaded in as a prop, since this
// is a pure, static object, not state. (containerVariants isn't needed here -
// this section only ever used itemVariants.)
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

/**
 * "Pricing FAQ" section (and its nested "Data Privacy" sub-FAQ) of the
 * How It Works page. Split out of HowItWorks.jsx; see CODE_STANDARDS.md.
 *
 * PricingFAQItem stays nested inside this component (not hoisted to module
 * scope) because it closes over openPricingFAQ/togglePricingFAQ, exactly as
 * it did inside HowItWorks itself - openPricingFAQ was page state used
 * nowhere outside this section, so it's local state here instead.
 *
 * Original indentation preserved as-is on the lifted JSX (not re-indented)
 * so it stays a pure, directly byte-diffable slice, same as every other
 * split this session.
 */
export default function PricingFAQSection() {
  const { t } = useTranslation();
  const [openPricingFAQ, setOpenPricingFAQ] = useState(null);

  const togglePricingFAQ = (index) => {
      setOpenPricingFAQ(prev => {
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

  // Pricing FAQ Section
  return (
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
  );
}
