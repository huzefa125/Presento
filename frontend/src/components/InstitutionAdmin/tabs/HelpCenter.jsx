import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import {
    BookOpen,
    MessageCircle,
    PlayCircle,
    Mail,
    FileText,
    Search,
    ChevronRight,
    AlertCircle,
    Info,
    Users,
    Code,
    Settings as SettingsIcon,
    X
} from 'lucide-react';
import { getBrandingColors, getRgbaColor, hexToRgb } from '../utils/brandingColors';

const HelpCenter = ({ institution }) => {
    const { t, i18n } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [modalContent, setModalContent] = useState(null);

    // FAQ Data - memoized to update when language changes
    const faqs = useMemo(() => [
        {
            id: 1,
            question: t('institution_admin.faq_how_to_add_users'),
            answer: t('institution_admin.faq_how_to_add_users_answer')
        },
        {
            id: 2,
            question: t('institution_admin.faq_subscription_renewal'),
            answer: t('institution_admin.faq_subscription_renewal_answer')
        },
        {
            id: 3,
            question: t('institution_admin.faq_user_limit'),
            answer: t('institution_admin.faq_user_limit_answer')
        },
        {
            id: 4,
            question: t('institution_admin.faq_custom_branding'),
            answer: t('institution_admin.faq_custom_branding_answer')
        },
        {
            id: 7,
            question: t('institution_admin.faq_export_data'),
            answer: t('institution_admin.faq_export_data_answer')
        },
        {
            id: 8,
            question: t('institution_admin.faq_security_settings'),
            answer: t('institution_admin.faq_security_settings_answer')
        }
    ], [t, i18n.language]);

    // Filter FAQs based on search
    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Help sections - memoized to update when language changes
    const helpSections = useMemo(() => [
        {
            icon: BookOpen,
            title: t('institution_admin.documentation'),
            description: t('institution_admin.documentation_description'),
            action: t('institution_admin.view_docs'),
            color: 'blue',
            modalContent: {
                title: t('institution_admin.documentation'),
                icon: BookOpen,
                content: t('institution_admin.documentation_coming_soon')
            }
        },
        {
            icon: MessageCircle,
            title: t('institution_admin.faq'),
            description: t('institution_admin.faq_description'),
            action: t('institution_admin.view_faq'),
            color: 'purple',
            scrollTo: 'faq-section'
        },
        {
            icon: Mail,
            title: t('institution_admin.contact_support'),
            description: t('institution_admin.contact_support_description'),
            action: t('institution_admin.contact_us'),
            color: 'teal',
            scrollTo: 'contact-section'
        },
        {
            icon: PlayCircle,
            title: t('institution_admin.quick_start'),
            description: t('institution_admin.quick_start_description'),
            action: t('institution_admin.get_started'),
            color: 'green',
            scrollTo: 'faq-section'
        }
    ], [t, i18n.language]);

    // Quick links - memoized to update when language changes
    const quickLinks = useMemo(() => [
        {
            icon: Users,
            title: t('institution_admin.quick_link_user_management'),
            description: t('institution_admin.quick_link_user_management_desc'),
            modalContent: {
                title: t('institution_admin.quick_link_user_management'),
                icon: Users,
                content: t('institution_admin.quick_link_info')
            }
        },
        {
            icon: SettingsIcon,
            title: t('institution_admin.quick_link_settings'),
            description: t('institution_admin.quick_link_settings_desc'),
            modalContent: {
                title: t('institution_admin.quick_link_settings'),
                icon: SettingsIcon,
                content: t('institution_admin.settings_info')
            }
        },
        {
            icon: Code,
            title: t('institution_admin.quick_link_api'),
            description: t('institution_admin.quick_link_api_desc'),
            modalContent: {
                title: t('institution_admin.quick_link_api'),
                icon: Code,
                content: t('institution_admin.api_info')
            }
        },
        {
            icon: FileText,
            title: t('institution_admin.quick_link_analytics'),
            description: t('institution_admin.quick_link_analytics_desc'),
            modalContent: {
                title: t('institution_admin.quick_link_analytics'),
                icon: FileText,
                content: t('institution_admin.analytics_info')
            }
        }
    ], [t, i18n.language]);

    const handleSectionClick = (section) => {
        if (section.scrollTo) {
            const element = document.getElementById(section.scrollTo);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (section.modalContent) {
            setModalContent(section.modalContent);
        }
    };

    const handleQuickLinkClick = (link) => {
        if (link.modalContent) {
            setModalContent(link.modalContent);
        }
    };

    const closeModal = () => {
        setModalContent(null);
    };

    const getColorClasses = (color) => {
        const colors = {
            blue: '',
            purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            teal: '',
            green: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
        return colors[color] || colors.blue;
    };
    
    const getColorStyle = (color) => {
        if (color === 'blue') {
            return {
                backgroundColor: getRgbaColor(primaryColor, 0.2),
                color: primaryColor,
                borderColor: getRgbaColor(primaryColor, 0.3)
            };
        }
        if (color === 'teal') {
            return {
                backgroundColor: getRgbaColor(secondaryColor, 0.2),
                color: secondaryColor,
                borderColor: getRgbaColor(secondaryColor, 0.3)
            };
        }
        return {};
    };

    const formatModalContent = (content) => {
        return content.split('\n').map((line, index) => {
            if (line.trim() === '') return <br key={index} />;
            if (line.match(/^\d+\./)) {
                return (
                    <p key={index} className="mb-2 text-gray-300">
                        {line}
                    </p>
                );
            }
            return (
                <p key={index} className="mb-3 text-gray-300">
                    {line}
                </p>
            );
        });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8"
            >
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {t('institution_admin.help_center')}
                    </h1>
                    <p className="text-gray-400">
                        {t('institution_admin.help_center_description')}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('institution_admin.search_help')}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                            onFocus={(e) => {
                                e.target.style.borderColor = secondaryColor;
                                e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Help Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {helpSections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={index}
                                onClick={() => handleSectionClick(section)}
                                className={`bg-white/5 border ${getColorClasses(section.color)} rounded-xl p-6 cursor-pointer hover:bg-white/10 transition-all group`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${getColorClasses(section.color)}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-4">
                                            {section.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                                            <span>{section.action}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {t('institution_admin.quick_links')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickLinks.map((link, index) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleQuickLinkClick(link)}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group text-left w-full"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Icon className="w-5 h-5" style={{ color: secondaryColor }} />
                                        <h4 className="font-semibold text-white text-sm">
                                            {link.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {link.description}
                                    </p>
                                    <Info 
                                        className="w-4 h-4 text-gray-500 mt-2 transition-colors" 
                                        style={{ color: 'rgb(107, 114, 128)' }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = secondaryColor;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = 'rgb(107, 114, 128)';
                                        }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ Section */}
                <div id="faq-section" className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {t('institution_admin.faq')}
                    </h2>
                    <div className="space-y-3">
                        {filteredFaqs.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
                                <p className="text-gray-400">
                                    {t('institution_admin.no_faq_results')}
                                </p>
                            </div>
                        ) : (
                            filteredFaqs.map((faq) => (
                                <div
                                    key={faq.id}
                                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                                    >
                                        <span className="font-medium text-white pr-4">
                                            {faq.question}
                                        </span>
                                        <ChevronRight
                                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                                                expandedFaq === faq.id ? 'transform rotate-90' : ''
                                            }`}
                                        />
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                                            expandedFaq === faq.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="px-4 pb-4">
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Contact Support Section */}
                <div id="contact-section" className="bg-white/5 border border-white/10 rounded-xl p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: getRgbaColor(secondaryColor, 0.2) }}>
                            <Mail className="w-6 h-6" style={{ color: secondaryColor }} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {t('institution_admin.contact_support')}
                            </h2>
                            <p className="text-gray-400 mb-6">
                                {t('institution_admin.contact_support_description')}
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5" style={{ color: secondaryColor }} />
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {t('institution_admin.email_support')}
                                        </p>
                                        <a
                                            href="mailto:support@inavora.com"
                                            className="transition-colors"
                                            style={{ color: secondaryColor }}
                                            onMouseEnter={(e) => {
                                                const rgb = hexToRgb(secondaryColor);
                                                if (rgb) {
                                                    e.target.style.color = `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`;
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.color = secondaryColor;
                                            }}
                                        >
                                            support@inavora.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Info className="w-5 h-5" style={{ color: secondaryColor }} />
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {t('institution_admin.response_time')}
                                        </p>
                                        <p className="text-white">
                                            {t('institution_admin.response_time_value')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href="mailto:support@inavora.com"
                            className="flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-colors"
                            style={{ backgroundColor: secondaryColor }}
                            onMouseEnter={(e) => {
                                const rgb = hexToRgb(secondaryColor);
                                if (rgb) {
                                    e.target.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = secondaryColor;
                            }}
                        >
                            <Mail className="w-4 h-4" />
                            {t('institution_admin.contact_us')}
                        </a>
                        <button
                            onClick={() => {
                                setModalContent({
                                    title: t('institution_admin.documentation'),
                                    icon: BookOpen,
                                    content: t('institution_admin.documentation_coming_soon')
                                });
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-colors"
                        >
                            <BookOpen className="w-4 h-4" />
                            {t('institution_admin.view_docs')}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Help Info Modal */}
            <AnimatePresence>
                {modalContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1e293b] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1e293b] z-10">
                                <div className="flex items-center gap-3">
                                    {modalContent.icon && (
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: getRgbaColor(secondaryColor, 0.2) }}>
                                            {(() => {
                                                const Icon = modalContent.icon;
                                                return <Icon className="w-5 h-5" style={{ color: secondaryColor }} />;
                                            })()}
                                        </div>
                                    )}
                                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                                        {modalContent.title}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="prose prose-invert max-w-none">
                                    <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                                        {formatModalContent(modalContent.content)}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2 text-white font-medium rounded-lg transition-colors"
                                    style={{ backgroundColor: secondaryColor }}
                                    onMouseEnter={(e) => {
                                        const rgb = hexToRgb(secondaryColor);
                                        if (rgb) {
                                            e.target.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = secondaryColor;
                                    }}
                                >
                                    {t('institution_admin.close')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HelpCenter;
