// eslint-disable-next-line
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Mail, Send, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const Contact = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        subject: '',
        message: '',
        category: 'general'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await api.post('/contact', formData);
            
            if (response.data.success) {
                toast.success(response.data.message || t('contact.message_sent_success'));
                setFormData({
                    name: currentUser?.displayName || '',
                    email: currentUser?.email || '',
                    subject: '',
                    message: '',
                    category: 'general'
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || t('contact.message_sent_error');
            toast.error(errorMessage);
            
            // Set field-specific errors if provided
            if (error.response?.data?.errors) {
                const fieldErrors = {};
                error.response.data.errors.forEach(err => {
                    const fieldName = err.path || err.param || err.field;
                    if (fieldName) {
                        fieldErrors[fieldName] = err.msg || err.message;
                    }
                });
                setErrors(fieldErrors);
            }
        } finally {
            setLoading(false);
        }
    };

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
                        {t('contact.back')}
                    </button>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20 container mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                        <span className="text-sm font-medium text-blue-200">{t('contact.contact_us_badge')}</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400 leading-tight">
                        {t('contact.page_title')}
                    </h1>
                    <p className="text-xl text-gray-400">
                        {t('contact.page_description')}
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto mb-32">
                    {/* Left Column: Get In Touch Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-3xl font-bold mb-6">{t('contact.get_in_touch_title')}</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {t('contact.get_in_touch_description')}
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-1 gap-4">
                            {/* Email Us */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group flex gap-5 items-center justify-start">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2">{t('contact.email_us_title')}</h3>
                                    <p className="text-gray-300 font-medium mb-1">{t('contact.email_us_address')}</p>
                                    <p className="text-gray-500 text-sm">{t('contact.email_us_hours')}</p>
                                </div>
                            </div>

                            {/* Visit Us */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group flex gap-5 items-center justify-start">
                                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 w-fit mb-4 group-hover:bg-orange-500/20 transition-colors">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold mb-2">{t('contact.visit_us_title')}</h3>
                                  <p className="text-gray-300 font-medium mb-1">{t('contact.visit_us_address')}</p>
                                  <p className="text-gray-500 text-sm">{t('contact.visit_us_description')}</p>
                                </div>
                            </div>

                            {/* Office Hours */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group flex gap-5 items-center justify-start">
                                <div className="p-3 rounded-xl bg-green-500/10 text-green-400 w-fit mb-4 group-hover:bg-green-500/20 transition-colors">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold mb-2">{t('contact.office_hours_title')}</h3>
                                  <p className="text-gray-300 font-medium mb-1">{t('contact.office_hours_days')}</p>
                                  <p className="text-gray-500 text-sm">{t('contact.office_hours_time')}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 sm:mt-14 p-8 md:p-10 rounded-3xl border border-white/10 backdrop-blur-sm h-fit"
                    >
                        <h2 className="text-2xl font-bold mb-8">{t('contact.send_message_title')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('contact.full_name_label')}</label>
                                <input
                                    type="text"
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-black/20 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all ${
                                        errors.name ? 'border-red-500' : 'border-white/10'
                                    }`}
                                    placeholder={t('contact.full_name_placeholder')}
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('contact.email_address_label')}</label>
                                <input
                                    type="email"
                                    required
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-black/20 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all ${
                                        errors.email ? 'border-red-500' : 'border-white/10'
                                    }`}
                                    placeholder={t('contact.email_address_placeholder')}
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('contact.subject_label')}</label>
                                <input
                                    type="text"
                                    required
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-black/20 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all ${
                                        errors.subject ? 'border-red-500' : 'border-white/10'
                                    }`}
                                    placeholder={t('contact.subject_placeholder')}
                                />
                                {errors.subject && (
                                    <p className="text-red-400 text-sm mt-1">{errors.subject}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('contact.category_label')}</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white transition-all"
                                >
                                    <option value="general">{t('contact.category_general')}</option>
                                    <option value="plan">{t('contact.category_plan')}</option>
                                    <option value="technical">{t('contact.category_technical')}</option>
                                    <option value="billing">{t('contact.category_billing')}</option>
                                    <option value="feature-request">{t('contact.category_feature_request')}</option>
                                    <option value="bug-report">{t('contact.category_bug_report')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('contact.message_label')}</label>
                                <textarea
                                    required
                                    rows={5}
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-black/20 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all resize-none ${
                                        errors.message ? 'border-red-500' : 'border-white/10'
                                    }`}
                                    placeholder={t('contact.message_placeholder')}
                                />
                                {errors.message && (
                                    <p className="text-red-400 text-sm mt-1">{errors.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {t('contact.sending')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {t('contact.send_message_button')}
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>

            <footer className="border-t border-white/10 bg-[#0f172a] pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-gray-500">{t('contact.footer_rights_reserved')}</p>
                </div>
            </footer>
        </div>
    );
};

export default Contact;