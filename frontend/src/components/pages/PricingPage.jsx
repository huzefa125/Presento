import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../utils/errorTranslator'; // Added useTranslation import
import { Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { createOrder, verifyPayment, loadRazorpay } from '../../services/paymentService';
import { detectCountryFromBrowser } from '../../utils/countryDetector';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

const PricingPage = () => {
    const { t } = useTranslation(); // Added useTranslation hook
    const { user, token, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    // Refresh user data when component mounts to ensure latest plan information
    useEffect(() => {
        if (user) {
            refreshUser();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [billingCycle, setBillingCycle] = useState('monthly');

    // Calculate effective plan (checks expiry)
    const effectivePlan = useMemo(() => {
        return getEffectivePlan(user?.subscription);
    }, [user?.subscription]);

    const plans = [
        {
            id: 'free',
            name: t('pricing.free_plan_name'),
            price: t('pricing.free_plan_price'),
            features: [
                t('pricing.free_plan_feature1'),
                t('pricing.free_plan_feature2'),
                t('pricing.free_plan_feature3'),
                t('pricing.free_plan_feature4'),
            ],
            buttonText: user ? t('pricing.free_plan_button_current') : t('pricing.free_plan_button_continue'),
            disabled: user ? true : false,
            color: 'from-blue-500 to-cyan-500',
            borderColor: 'border-blue-500/20',
            bgGlow: 'bg-blue-500/10'
        },
        {
            id: billingCycle === 'monthly' ? 'pro-monthly' : 'pro-yearly',
            name: t('pricing.pro_plan_name'),
            price: billingCycle === 'monthly' ? t('pricing.pro_plan_price_monthly') : t('pricing.pro_plan_price_yearly'),
            originalPrice: billingCycle === 'yearly' ? t('pricing.pro_plan_original_price_yearly') : null,
            period: billingCycle === 'monthly' ? t('pricing.pro_plan_period_monthly') : t('pricing.pro_plan_period_yearly'),
            saveLabel: billingCycle === 'yearly' ? t('pricing.pro_plan_save_label') : null,
            features: [
                t('pricing.pro_plan_feature1'),
                t('pricing.pro_plan_feature2'),
                t('pricing.pro_plan_feature3'),
                t('pricing.pro_plan_feature4'),
                t('pricing.pro_plan_feature5'),
                t('pricing.pro_plan_feature6'),
            ],
            buttonText: t('pricing.pro_plan_button'),
            color: 'from-teal-400 to-emerald-500',
            borderColor: 'border-teal-500/30',
            bgGlow: 'bg-teal-500/10'
        },
        {
            id: 'lifetime',
            name: t('pricing.lifetime_plan_name'),
            price: t('pricing.lifetime_plan_price'),
            period: t('pricing.lifetime_plan_period'),
            features: [
                t('pricing.lifetime_plan_feature1'),
                t('pricing.lifetime_plan_feature2'),
                t('pricing.lifetime_plan_feature3'),
                t('pricing.lifetime_plan_feature4'),
                t('pricing.lifetime_plan_feature5')
            ],
            buttonText: t('pricing.lifetime_plan_button'),
            highlight: true,
            color: 'from-orange-400 to-amber-500',
            borderColor: 'border-orange-500/30',
            bgGlow: 'bg-orange-500/10'
        },
        {
            id: 'institution',
            name: t('pricing.institution_plan_name'),
            price: t('pricing.institution_plan_price'),
            period: t('pricing.institution_plan_period'),
            features: [
                t('pricing.institution_plan_feature2'),
                t('pricing.institution_plan_feature3'),
                t('pricing.institution_plan_feature4'),
                t('pricing.institution_plan_feature6'),
                t('pricing.institution_plan_feature5'),
                t('pricing.lifetime_plan_feature5')
            ],
            buttonText: t('pricing.institution_plan_button'),
            color: 'from-indigo-500 to-purple-500',
            borderColor: 'border-purple-500/30',
            bgGlow: 'bg-purple-500/10'
        }
    ];

    const comparisonFeatures = [
        { name: t('pricing.price_feature'), free: t('pricing.free_plan_price'), pro: `${billingCycle === 'monthly' ? t('pricing.pro_plan_price_monthly') : t('pricing.pro_plan_price_yearly')}${billingCycle === 'monthly' ? t('pricing.pro_plan_period_monthly') : t('pricing.pro_plan_period_yearly')}`, lifetime: t('pricing.lifetime_plan_price'), institution: `${t('pricing.institution_plan_price')}${t('pricing.institution_plan_period')}` },
        { name: t('pricing.slides_per_presentation_feature'), free: '10', pro: t('pricing.pro_plan_feature3'), lifetime: t('pricing.pro_plan_feature3'), institution: t('pricing.pro_plan_feature3') },
        { name: t('pricing.audience_limit_feature'), free: '20', pro: t('pricing.pro_plan_feature4'), lifetime: t('pricing.pro_plan_feature4'), institution: t('pricing.pro_plan_feature4') },
        { name: t('pricing.users_feature'), free: '1', pro: '1', lifetime: '1', institution: '10 - 50k+' },
        { name: t('pricing.ai_features_feature'), free: false, pro: true, lifetime: true, institution: true },
        { name: t('pricing.export_results_feature'), free: false, pro: true, lifetime: true, institution: true },
        { name: t('pricing.priority_support_feature'), free: false, pro: true, lifetime: true, institution: true },
        { name: t('pricing.lifetime_access_feature'), free: false, pro: false, lifetime: true, institution: false },
        { name: t('pricing.custom_branding_feature'), free: false, pro: false, lifetime: false, institution: true },
        { name: t('pricing.advanced_analytics_feature'), free: false, pro: false, lifetime: false, institution: true },
        { name: t('pricing.admin_dashboard_feature'), free: false, pro: false, lifetime: false, institution: true },
    ];

    const handleUpgrade = async (planId) => {
        // Institution plan should redirect to registration flow
        if (planId === 'institution') {
            // Detect country from browser
            const detectedCountry = detectCountryFromBrowser();
            
            // Prepare navigation state
            const navigationState = {
                country: detectedCountry || ''
            };
            
            // Add user data if logged in
            if (user) {
                // Check and add displayName
                if (user.displayName && user.displayName.trim() !== '') {
                    navigationState.adminName = user.displayName;
                }
                // Check and add email
                if (user.email && user.email.trim() !== '') {
                    navigationState.adminEmail = user.email;
                }
            }
            
            // Pass user data to pre-fill the form
            navigate('/institution/register', {
                state: navigationState
            });
            return;
        }

        if (!user) {
            toast.error(t('pricing.login_required_message'));
            navigate('/login', { state: { from: '/pricing' } });
            return;
        }

        // Prevent free plan from going through payment
        if (planId === 'free') {
            return;
        }

        setLoadingPlanId(planId);
        try {
            const res = await loadRazorpay();
            if (!res) {
                toast.error(t('pricing.razorpay_load_failed'));
                setLoadingPlanId(null);
                return;
            }

            // Create Order
            const orderData = await createOrder(planId, token);

            // Get plan name for description
            const planNameMap = {
                'pro-monthly': t('pricing.pro_plan_name'),
                'pro-yearly': t('pricing.pro_plan_name'),
                'lifetime': t('pricing.lifetime_plan_name'),
                'institution': t('pricing.institution_plan_name')
            };
            const planName = planNameMap[planId] || planId.charAt(0).toUpperCase() + planId.slice(1);

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Inavora',
                description: `${planName} ${t('navbar.plan')}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        await verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            plan: planId
                        }, token);

                        await refreshUser();
                        toast.success(t('pricing.payment_success_message'));
                        navigate('/dashboard');
                    } catch (error) {
                        console.error(error);
                        toast.error(t('pricing.payment_failed_message'));
                    }
                },
                prefill: {
                    name: user.displayName,
                    email: user.email,
                    contact: ''
                },
                theme: {
                    color: '#6366f1'
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error);
            toast.error(translateError(error, t, 'pricing.something_went_wrong'));
        } finally {
            setLoadingPlanId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden font-sans selection:bg-teal-500 selection:text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Navbar / Header */}
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
                        <ArrowLeft className="w-4 h-4" /> {t('pricing.back_button')}
                    </button>
                </div>
            </nav>

            <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-sm"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
                            <span className="text-sm font-medium text-blue-200">{t('pricing.flexible_plans_badge')}</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold mb-6"
                        >
                            {t('pricing.page_title')} <span className="text-teal-400">{t('pricing.page_title_highlight')}</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
                        >
                            {t('pricing.page_description')}
                        </motion.p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>{t('pricing.billing_toggle_monthly')}</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                                className="relative w-14 h-8 rounded-full bg-slate-700 border border-white/10 transition-colors focus:outline-none"
                            >
                                <motion.div
                                    animate={{ x: billingCycle === 'monthly' ? 2 : 26 }}
                                    className="w-6 h-6 rounded-full bg-teal-400 shadow-lg"
                                />
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
                                {t('pricing.billing_toggle_yearly')} <span className="text-teal-400 text-xs ml-1">({t('pricing.billing_toggle_save')})</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                        {plans.map((plan, index) => {

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                    className="relative h-full"
                                >
                                    <div className={`relative flex flex-col h-full rounded-2xl border ${plan.borderColor} ${plan.bgGlow} backdrop-blur-sm overflow-hidden group hover:border-opacity-50 transition-all duration-300`}>
                                        {plan.highlight && (
                                            <div className="absolute top-0 right-0 z-10">
                                                <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                                                    {t('pricing.pro_plan_popular')}
                                                </div>
                                            </div>
                                        )}
                                        {plan.saveLabel && (
                                            <div className="absolute top-0 right-0 z-10">
                                                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                                                    {plan.saveLabel}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-8 flex-1 flex flex-col">
                                            <h3 className={`text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${plan.color}`}>
                                                {plan.name}
                                            </h3>

                                            <div className="mb-6">
                                                {plan.originalPrice && (
                                                    <div className="text-gray-400 text-sm line-through mb-1">
                                                        {plan.originalPrice}
                                                    </div>
                                                )}
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                                    {plan.period && <span className="text-gray-400">{plan.period}</span>}
                                                </div>
                                            </div>

                                            <ul className="space-y-4 mb-8 flex-1">
                                                {plan.features.map((feature) => (
                                                    <li key={feature} className="flex items-start gap-3">
                                                        <div className={`mt-1 w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                        <span className="text-gray-300 text-sm">{feature}</span>
                                                    </li>
                                                ))}

                                            </ul>

                                            <button
                                                onClick={() => !plan.disabled && handleUpgrade(plan.id)}
                                                disabled={plan.disabled || loadingPlanId === plan.id}
                                                className={`w-full py-4 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${plan.disabled
                                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                                    : plan.highlight
                                                        ? `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:shadow-teal-500/25`
                                                        : 'bg-white text-slate-900 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {loadingPlanId === plan.id ? 'Processing...' : plan.buttonText}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Comparison Table */}
                    <div className="mt-30 max-sm:mt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h3 className="text-3xl md:text-4xl font-bold mb-4">{t('pricing.compare_plans_title')}</h3>
                            <p className="text-gray-400">{t('pricing.compare_plans_description')}</p>
                        </motion.div>

                        <div className="overflow-x-auto pb-4 pt-6">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="p-6 border-b border-white/10 bg-white/5 rounded-tl-2xl text-lg font-semibold">{t('pricing.compare_table_features')}</th>

                                        <th className="p-6 border-b border-white/10 bg-white/5 text-center text-lg font-semibold relative">
                                            {t('pricing.compare_table_free')}
                                            {user && effectivePlan === 'free' && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            )}
                                        </th>

                                        <th className="p-6 border-b border-white/10 bg-white/5 text-center text-lg font-semibold relative">
                                            {t('pricing.compare_table_pro')}
                                            {user && effectivePlan === 'pro' ? (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            ) : null}
                                        </th>

                                        <th className="p-6 border-b border-white/10 bg-amber-500/10 text-center text-lg font-bold relative text-amber-400">
                                            {t('pricing.compare_table_lifetime')}
                                            {user && effectivePlan === 'lifetime' ? (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            ) : (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{t('pricing.compare_table_recommended')}</div>
                                            )}
                                        </th>

                                        <th className="p-6 border-b border-white/10 bg-white/5 text-center rounded-tr-2xl text-lg font-semibold relative">
                                            {t('pricing.compare_table_institution')}
                                            {user && effectivePlan === 'institution' && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonFeatures.map((feature, index) => (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-6 text-gray-300 font-medium group-hover:text-white transition-colors">{feature.name}</td>
                                            <td className="p-6 text-center text-gray-400">
                                                {typeof feature.free === 'boolean' ? (
                                                    feature.free ? <Check className="w-6 h-6 text-teal-400 mx-auto" /> : <span className="text-gray-600">—</span>
                                                ) : (
                                                    <span className="text-white font-medium">{feature.free}</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-center text-gray-400">
                                                {typeof feature.pro === 'boolean' ? (
                                                    feature.pro ? <Check className="w-6 h-6 text-teal-400 mx-auto" /> : <span className="text-gray-600">—</span>
                                                ) : (
                                                    <span className="text-white font-medium">{feature.pro}</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-center text-gray-400 bg-amber-500/10">
                                                {typeof feature.lifetime === 'boolean' ? (
                                                    feature.lifetime ? <Check className="w-6 h-6 text-teal-400 mx-auto" /> : <span className="text-gray-600">—</span>
                                                ) : (
                                                    <span className="text-white font-medium">{feature.lifetime}</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-center text-gray-400">
                                                {typeof feature.institution === 'boolean' ? (
                                                    feature.institution ? <Check className="w-6 h-6 text-teal-400 mx-auto" /> : <span className="text-gray-600">—</span>
                                                ) : (
                                                    <span className="text-white font-medium">{feature.institution}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;