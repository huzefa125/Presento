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
            color: 'bg-accent-sky',
            borderColor: 'border-hairline',
            bgGlow: 'bg-surface'
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
            color: 'bg-accent-teal',
            borderColor: 'border-hairline',
            bgGlow: 'bg-surface'
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
            color: 'bg-accent-orange',
            borderColor: 'border-hairline',
            bgGlow: 'bg-canvas-soft'
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
            color: 'bg-accent-purple-deep',
            borderColor: 'border-hairline',
            bgGlow: 'bg-surface'
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
        <div className="min-h-screen bg-canvas-soft text-ink overflow-x-hidden font-sans selection:bg-primary selection:text-on-primary">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-sky/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-teal/10 blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Navbar / Header */}
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
                        className="flex items-center bg-surface border border-hairline px-3 py-1 rounded-md gap-2 text-sm font-medium text-ink hover:bg-canvas-soft transition-colors"
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-hairline shadow-[var(--shadow-level-1)] mb-8"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-accent-teal animate-pulse"></span>
                            <span className="text-xs font-semibold tracking-wide text-primary">{t('pricing.flexible_plans_badge')}</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold mb-6 text-ink tracking-tight"
                        >
                            {t('pricing.page_title')} <span className="text-accent-teal">{t('pricing.page_title_highlight')}</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-ink-muted max-w-2xl mx-auto mb-10"
                        >
                            {t('pricing.page_description')}
                        </motion.p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-ink' : 'text-ink-muted'}`}>{t('pricing.billing_toggle_monthly')}</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                                className="relative w-14 h-8 rounded-full bg-ink-faint/20 border border-hairline transition-colors focus:outline-none"
                            >
                                <motion.div
                                    animate={{ x: billingCycle === 'monthly' ? 2 : 26 }}
                                    className="w-6 h-6 rounded-full bg-primary shadow-[var(--shadow-level-1)]"
                                />
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-ink' : 'text-ink-muted'}`}>
                                {t('pricing.billing_toggle_yearly')} <span className="text-accent-green text-xs ml-1">({t('pricing.billing_toggle_save')})</span>
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
                                    <div className={`relative flex flex-col h-full rounded-md border ${plan.borderColor} ${plan.bgGlow} shadow-[var(--shadow-level-1)] overflow-hidden transition-all duration-300`}>
                                        {plan.highlight && (
                                            <div className="absolute top-0 right-0 z-10">
                                                <div className="bg-accent-orange text-on-primary text-xs font-bold px-3 py-1 rounded-bl-md">
                                                    {t('pricing.pro_plan_popular')}
                                                </div>
                                            </div>
                                        )}
                                        {plan.saveLabel && (
                                            <div className="absolute top-0 right-0 z-10">
                                                <div className="bg-accent-green text-on-primary text-xs font-bold px-3 py-1 rounded-bl-md">
                                                    {plan.saveLabel}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-8 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold mb-4 text-ink">
                                                {plan.name}
                                            </h3>

                                            <div className="mb-6">
                                                {plan.originalPrice && (
                                                    <div className="text-ink-faint text-sm line-through mb-1">
                                                        {plan.originalPrice}
                                                    </div>
                                                )}
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-ink">{plan.price}</span>
                                                    {plan.period && <span className="text-ink-muted">{plan.period}</span>}
                                                </div>
                                            </div>

                                            <ul className="space-y-4 mb-8 flex-1">
                                                {plan.features.map((feature) => (
                                                    <li key={feature} className="flex items-start gap-3">
                                                        <div className={`mt-1 w-5 h-5 rounded-full ${plan.color} flex items-center justify-center shrink-0`}>
                                                            <Check className="w-3 h-3 text-on-primary" />
                                                        </div>
                                                        <span className="text-ink-secondary text-sm">{feature}</span>
                                                    </li>
                                                ))}

                                            </ul>

                                            <button
                                                onClick={() => !plan.disabled && handleUpgrade(plan.id)}
                                                disabled={plan.disabled || loadingPlanId === plan.id}
                                                className={`w-full py-4 font-medium text-sm transition-all transform active:scale-95 ${plan.disabled
                                                    ? 'bg-canvas-soft text-ink-faint cursor-not-allowed border border-hairline rounded-md'
                                                    : plan.highlight
                                                        ? 'bg-primary text-on-primary hover:bg-primary-active rounded-full'
                                                        : 'bg-surface text-ink border border-hairline hover:bg-canvas-soft rounded-md'
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
                            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-ink tracking-tight">{t('pricing.compare_plans_title')}</h3>
                            <p className="text-ink-muted">{t('pricing.compare_plans_description')}</p>
                        </motion.div>

                        <div className="overflow-x-auto pb-4 pt-6">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="p-6 border-b border-hairline bg-canvas-soft rounded-tl-lg text-lg font-semibold text-ink">{t('pricing.compare_table_features')}</th>

                                        <th className="p-6 border-b border-hairline bg-canvas-soft text-center text-lg font-semibold relative text-ink">
                                            {t('pricing.compare_table_free')}
                                            {user && effectivePlan === 'free' && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[var(--shadow-level-1)] whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            )}
                                        </th>

                                        <th className="p-6 border-b border-hairline bg-canvas-soft text-center text-lg font-semibold relative text-ink">
                                            {t('pricing.compare_table_pro')}
                                            {user && effectivePlan === 'pro' ? (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[var(--shadow-level-1)] whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            ) : null}
                                        </th>

                                        <th className="p-6 border-b border-hairline bg-canvas-soft text-center text-lg font-bold relative text-ink">
                                            {t('pricing.compare_table_lifetime')}
                                            {user && effectivePlan === 'lifetime' ? (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[var(--shadow-level-1)] whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            ) : (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-orange text-on-primary text-[10px] px-2 py-0.5 rounded-full">{t('pricing.compare_table_recommended')}</div>
                                            )}
                                        </th>

                                        <th className="p-6 border-b border-hairline bg-canvas-soft text-center rounded-tr-lg text-lg font-semibold relative text-ink">
                                            {t('pricing.compare_table_institution')}
                                            {user && effectivePlan === 'institution' && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[var(--shadow-level-1)] whitespace-nowrap">
                                                    Current Plan
                                                </div>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonFeatures.map((feature, index) => (
                                        <tr key={index} className="border-b border-hairline hover:bg-canvas-soft transition-colors group">
                                            <td className="p-6 text-ink-secondary font-medium group-hover:text-ink transition-colors">{feature.name}</td>
                                            <td className="p-6 text-center text-ink-muted">
                                                {typeof feature.free === 'boolean' ? (
                                                    feature.free ? <Check className="w-6 h-6 text-accent-green mx-auto" /> : <span className="text-ink-faint">—</span>
                                                ) : (
                                                    <span className="text-ink font-medium">{feature.free}</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-center text-ink-muted">
                                                {typeof feature.pro === 'boolean' ? (
                                                    feature.pro ? <Check className="w-6 h-6 text-accent-green mx-auto" /> : <span className="text-ink-faint">—</span>
                                                ) : (
                                                    <span className="text-ink font-medium">{feature.pro}</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-center text-ink-muted bg-canvas-soft">
                                                {typeof feature.lifetime === 'boolean' ? (
                                                    feature.lifetime ? <Check className="w-6 h-6 text-accent-green mx-auto" /> : <span className="text-ink-faint">—</span>
                                                ) : (
                                                    <span className="text-ink font-medium">{feature.lifetime}</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-center text-ink-muted">
                                                {typeof feature.institution === 'boolean' ? (
                                                    feature.institution ? <Check className="w-6 h-6 text-accent-green mx-auto" /> : <span className="text-ink-faint">—</span>
                                                ) : (
                                                    <span className="text-ink font-medium">{feature.institution}</span>
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