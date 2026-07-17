import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
    CreditCard,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Bell,
    TrendingUp,
    Calendar,
    Clock,
    RefreshCw,
    Receipt,
    DollarSign,
    Building2,
    Mail,
    User,
    Plus,
    Sparkles,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../config/api';
import { getBrandingColors, getRgbaColor, hexToRgb } from '../utils/brandingColors';

const Subscription = ({ institution, stats, onRefresh, onAddUser }) => {
    const { t } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);
    const [renewalLoading, setRenewalLoading] = useState(false);
    const [showPlanSelection, setShowPlanSelection] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [customUserCount, setCustomUserCount] = useState(10);
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);
    const [usageStats, setUsageStats] = useState(null);

    // Fetch subscription details
    const fetchSubscriptionDetails = async () => {
        try {
            setLoadingSubscription(true);
            const response = await api.get('/institution-admin/subscription');
            if (response.data.success && response.data.subscription) {
                setSubscriptionData(response.data.subscription);
            } else {
                setSubscriptionData(null);
            }
        } catch (error) {
            console.error('Error fetching subscription details:', error);
            setSubscriptionData(null);
        } finally {
            setLoadingSubscription(false);
        }
    };

    // Fetch usage statistics
    const fetchUsageStats = async () => {
        try {
            const response = await api.get('/institution-admin/subscription/usage');
            if (response.data.success && response.data.usage) {
                setUsageStats(response.data.usage);
            } else {
                setUsageStats(null);
            }
        } catch (error) {
            console.error('Error fetching usage stats:', error);
            setUsageStats(null);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchSubscriptionDetails();
        fetchUsageStats();
    }, []);

    // Use subscription data from API or fallback to institution prop
    const subscription = subscriptionData || institution?.subscription;
    const isActive = subscription?.isActive !== undefined ? subscription.isActive : (subscription?.status === 'active' && subscription?.endDate && new Date(subscription.endDate) > new Date());
    const isExpired = subscription?.isExpired !== undefined ? subscription.isExpired : (subscription?.status === 'expired' || (subscription?.endDate && new Date(subscription.endDate) < new Date()));
    const daysRemaining = subscription?.daysRemaining !== undefined ? subscription.daysRemaining : (subscription?.endDate ? Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null);
    
    // Use usage stats from API or fallback to stats prop
    const currentUsers = usageStats?.totalUsers || stats?.totalUsers || subscription?.currentUsers || 0;
    const userUsagePercent = subscription?.maxUsers ? ((currentUsers / subscription.maxUsers) * 100) : 0;
    const showUserWarning = userUsagePercent >= 80;
    const showRenewalWarning = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;

    // Determine plan name based on maxUsers
    const getPlanName = (maxUsers) => {
        if (!maxUsers) return 'Institution';
        if (maxUsers === 10) return 'Basic';
        if (maxUsers === 50) return 'Professional';
        return 'Custom';
    };

    const currentPlanName = subscription?.planName || getPlanName(subscription?.maxUsers);

    // Fetch plans only when renewal modal is shown (for expired subscriptions)
    useEffect(() => {
        if (showPlanSelection && isExpired) {
            const fetchPlans = async () => {
                setLoadingPlans(true);
                try {
                    const response = await api.get('/institution/register/plans');
                    if (response.data.success) {
                        setPlans(response.data.plans || []);
                    }
                } catch (error) {
                    console.error('Error fetching plans:', error);
                    toast.error(t('institution_admin.failed_to_load_plans'));
                } finally {
                    setLoadingPlans(false);
                }
            };
            fetchPlans();
        }
    }, [showPlanSelection, isExpired]);

    // Refresh data when onRefresh is triggered (e.g., after actions like renewal/upgrade)
    useEffect(() => {
        if (onRefresh) {
            fetchSubscriptionDetails();
            fetchUsageStats();
        }
    }, [onRefresh]);

    // Fetch payment history
    useEffect(() => {
        const fetchPayments = async () => {
            setLoadingPayments(true);
            try {
                const response = await api.get('/institution-admin/payments');
                if (response.data.success) {
                    setPayments(response.data.payments || []);
                }
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoadingPayments(false);
            }
        };
        fetchPayments();
    }, []);

    // Handle plan selection for renewal/upgrade
    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        if (plan.isCustom) {
            // Set to minimum users when first selecting custom plan (matching registration page)
            setCustomUserCount(plan.minUsers || 10);
        }
    };

    // Handle subscription renewal/upgrade with plan selection
    const handleRenewSubscription = async (planToUse = null) => {
        const plan = planToUse || selectedPlan;
        
        // If expired and no plan selected, show plan selection modal
        if (isExpired && !plan && !showPlanSelection) {
            setShowPlanSelection(true);
            return;
        }

        // Validate plan selection
        if (!plan) {
            toast.error(t('institution_admin.please_select_plan'));
            return;
        }

        // Validate custom plan
        if (plan.isCustom) {
            if (!customUserCount || customUserCount < (plan.minUsers || 10)) {
                toast.error(t('institution_admin.minimum_users_required', { count: plan.minUsers || 10 }));
                return;
            }
        }

        // No confirmation needed - proceed directly to payment gateway

        setRenewalLoading(true);

        try {
            // Wait for Razorpay to be available
            let retries = 0;
            while (!window.Razorpay && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Razorpay script loading timeout'));
                    }, 10000);
                    
                    script.onload = () => {
                        clearTimeout(timeout);
                        if (window.Razorpay) {
                            resolve();
                        } else {
                            reject(new Error('Razorpay failed to load'));
                        }
                    };
                    script.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Failed to load Razorpay script'));
                    };
                    
                    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
                    if (existingScript) {
                        clearTimeout(timeout);
                        if (window.Razorpay) {
                            resolve();
                        } else {
                            setTimeout(() => {
                                if (window.Razorpay) {
                                    resolve();
                                } else {
                                    reject(new Error('Razorpay failed to initialize'));
                                }
                            }, 1000);
                        }
                    } else {
                        document.body.appendChild(script);
                    }
                });
            }

            // Create renewal/upgrade payment order with plan selection
            const requestData = {
                billingCycle: subscription?.billingCycle || 'yearly',
                plan: plan.id,
                ...(plan.isCustom && { customUserCount })
            };

            const response = await api.post('/institution-admin/subscription/renew', requestData);

            if (response.data.success) {
                if (!response.data.orderId || !response.data.keyId) {
                    throw new Error('Invalid payment response: missing orderId or keyId');
                }

                if (!window.Razorpay) {
                    throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
                }

                // Initialize Razorpay payment
                const options = {
                    key: response.data.keyId,
                    amount: response.data.amount,
                    currency: response.data.currency || 'INR',
                    name: 'Inavora',
                    description: `${isExpired ? 'Renew' : 'Upgrade'} Institution Subscription - ${plan.name} Plan - ${subscription?.billingCycle || 'Yearly'}`,
                    order_id: response.data.orderId,
                    handler: async function (paymentResponse) {
                        try {
                            
                            // Verify payment
                            const verifyResponse = await api.post('/institution-admin/subscription/verify-renewal', {
                                razorpayOrderId: paymentResponse.razorpay_order_id,
                                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                                razorpaySignature: paymentResponse.razorpay_signature
                            });

                            if (verifyResponse.data.success) {
                                toast.success(
                                    isExpired 
                                        ? t('institution_admin.subscription_renewed_success')
                                        : t('institution_admin.subscription_upgraded_success')
                                );
                                setShowPlanSelection(false);
                                setSelectedPlan(null);
                                // Refresh subscription data
                                await fetchSubscriptionDetails();
                                await fetchUsageStats();
                                if (onRefresh) {
                                    onRefresh();
                                }
                            } else {
                                toast.error(verifyResponse.data.message || t('institution_admin.payment_verification_failed'));
                            }
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            const errorMsg = error.response?.data?.message || error.message || t('institution_admin.payment_verification_failed');
                            toast.error(errorMsg);
                        } finally {
                            setRenewalLoading(false);
                        }
                    },
                    prefill: {
                        email: institution?.adminEmail || '',
                        name: institution?.adminName || ''
                    },
                    theme: {
                        color: '#14b8a6'
                    },
                    modal: {
                        ondismiss: function() {
                            setRenewalLoading(false);
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);
                
                razorpay.on('payment.failed', function (response) {
                    console.error('Payment failed:', response.error);
                    const errorMsg = response.error?.description || 
                                    response.error?.reason || 
                                    response.error?.code ||
                                    t('institution_admin.payment_initiation_failed');
                    toast.error(t('institution_admin.payment_failed', { error: errorMsg }));
                    setRenewalLoading(false);
                });
                
                razorpay.open();
            } else {
                throw new Error(response.data.message || 'Failed to create payment order');
            }
        } catch (error) {
            console.error('Renewal error:', error);
            let errorMessage = t('institution_admin.renewal_initiation_failed') || 'Failed to initiate renewal.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
            setRenewalLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{t('institution_admin.subscription_billing')}</h1>
                <p className="text-gray-400">{t('institution_admin.subscription_description')}</p>
            </div>

            <div className="space-y-6">
                {/* Institution Information - Always Visible */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" style={{ color: secondaryColor }} />
                        {t('institution_admin.institution_information')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{t('institution_admin.institution_name')}</p>
                            <p className="text-white font-medium">{institution?.name || t('institution_admin.not_available')}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{t('institution_admin.institution_email')}</p>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <p className="text-white">{institution?.email || t('institution_admin.not_available')}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{t('institution_admin.admin_name')}</p>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <p className="text-white">{institution?.adminName || t('institution_admin.not_available')}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{t('institution_admin.admin_email')}</p>
                            <p className="text-white">{institution?.adminEmail || t('institution_admin.not_available')}</p>
                        </div>
                    </div>
                </div>

                {/* Payment History - Always Visible */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Receipt className="w-5 h-5" style={{ color: secondaryColor }} />
                        {t('institution_admin.payment_history')}
                    </h3>
                    {loadingPayments ? (
                        <div className="flex items-center justify-center py-8">
                            <div 
                                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: `${secondaryColor} transparent transparent transparent` }}
                            ></div>
                        </div>
                    ) : payments.length > 0 ? (
                        <div className="space-y-3">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5 hover:bg-black/30 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <DollarSign className="w-5 h-5" style={{ color: secondaryColor }} />
                                            <p className="text-lg font-semibold text-white">
                                                {new Intl.NumberFormat('en-IN', {
                                                    style: 'currency',
                                                    currency: payment.currency || 'INR'
                                                }).format(payment.amount)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="capitalize">{payment.plan || 'institution'}</span>
                                            <span>•</span>
                                            <span>{new Date(payment.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                            {payment.orderId && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-mono text-xs">{t('institution_admin.order_label')}: {payment.orderId.slice(-8)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        payment.status === 'captured' 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                            : payment.status === 'failed'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}>
                                        {payment.status === 'captured' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                        {payment.status === 'captured' ? t('institution_admin.payment_status_captured') : payment.status === 'failed' ? t('institution_admin.payment_status_failed') : payment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
                            <p className="text-gray-400">{t('institution_admin.no_payment_history')}</p>
                        </div>
                    )}
                </div>

            {loadingSubscription ? (
                <div className="flex items-center justify-center py-12">
                    <div 
                        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: `${secondaryColor} transparent transparent transparent` }}
                    ></div>
                </div>
            ) : subscription ? (
                <div className="space-y-6">
                    {/* Current Plan Details - Enhanced */}
                    <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 rounded-2xl p-8 backdrop-blur-sm"
                         style={{ borderColor: isActive && !isExpired ? `${secondaryColor}80` : 'rgba(255,255,255,0.1)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <CreditCard className="w-6 h-6" style={{ color: secondaryColor }} />
                                    {t('institution_admin.current_plan_label')}: {currentPlanName}
                                </h3>
                                <p className="text-gray-400">{t('institution_admin.subscription_details_features')}</p>
                            </div>
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                                isActive && !isExpired
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : isExpired
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                                {isActive && !isExpired && <CheckCircle className="w-4 h-4 mr-2" />}
                                {isExpired ? t('institution_admin.expired') : (isActive ? t('institution_admin.active') : subscription.status)}
                            </span>
                        </div>

                        {/* Current Plan Pricing & Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-sm mb-2">{t('institution_admin.plan_price')}</p>
                                {(() => {
                                    const price = subscription?.planDetails?.prices?.yearly || 0;
                                    const priceInRupees = (price / 100).toLocaleString('en-IN');
                                    return (
                                        <div>
                                            <p className="text-2xl font-bold text-white">₹{priceInRupees}</p>
                                            <p className="text-xs text-gray-400">{t('institution_admin.per_year')}</p>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-sm mb-2">{t('institution_admin.max_users')}</p>
                                <p className="text-2xl font-bold text-white">{subscription.maxUsers || t('institution_admin.unlimited')}</p>
                                <p className="text-xs text-gray-400">{t('institution_admin.users_included')}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-sm mb-2">{t('institution_admin.billing_cycle_label')}</p>
                                <p className="text-2xl font-bold text-white capitalize">{subscription.billingCycle || t('institution_admin.yearly')}</p>
                                <p className="text-xs text-gray-400">{t('institution_admin.renewal_period')}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-sm mb-2">{t('institution_admin.renewal_date_label')}</p>
                                <p className="text-lg font-bold text-white">
                                    {subscription.endDate 
                                        ? new Date(subscription.endDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })
                                        : t('institution_admin.not_available')}
                                </p>
                                {daysRemaining !== null && (
                                    <p className={`text-xs mt-1 ${daysRemaining <= 30 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                        {daysRemaining > 0 ? `${daysRemaining} ${t('institution_admin.days_left')}` : t('institution_admin.expired')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Current Plan Features */}
                        {subscription?.planDetails?.features ? (
                            <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                                <h4 className="text-lg font-semibold text-white mb-4">{t('institution_admin.plan_features')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {subscription.planDetails.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: secondaryColor }} />
                                            <span className="text-gray-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Action Buttons */}
                        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
                            {isActive && !isExpired && onAddUser && (
                                <button
                                    onClick={onAddUser}
                                    className="px-6 py-3 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                                    style={{
                                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                                        boxShadow: `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.4)}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`;
                                    }}
                                >
                                    <Plus className="w-5 h-5" />
                                    {t('institution_admin.add_users')}
                                </button>
                            )}
                            {isExpired && (
                                <button
                                    onClick={() => {
                                        setShowPlanSelection(true);
                                    }}
                                    disabled={renewalLoading}
                                    className="px-6 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                                        boxShadow: `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!e.target.disabled) {
                                            e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.4)}`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`;
                                    }}
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    {t('institution_admin.renew_subscription')}
                                </button>
                            )}
                            {showRenewalWarning && !isExpired && (
                                <button
                                    onClick={() => handleRenewSubscription()}
                                    disabled={renewalLoading}
                                    className="px-6 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                                        boxShadow: `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!e.target.disabled) {
                                            e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.4)}`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`;
                                    }}
                                >
                                    {renewalLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            {t('institution_admin.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            {t('institution_admin.renew_now')}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Plan Selection Modal for Renewal (only for expired subscriptions) */}
                    {showPlanSelection && isExpired && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{t('institution_admin.select_plan')}</h3>
                                <p className="text-gray-400">{t('institution_admin.select_plan_description')}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPlanSelection(false);
                                    setSelectedPlan(null);
                                }}
                                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {loadingPlans ? (
                                <div className="flex items-center justify-center py-8">
                                    <div 
                                        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                                        style={{ borderColor: `${secondaryColor} transparent transparent transparent` }}
                                    ></div>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-6">
                                    {plans.map((plan) => {
                                        const isSelected = selectedPlan?.id === plan.id;
                                        const isCurrentPlan = !plan.isCustom && plan.maxUsers === subscription?.maxUsers;
                                        const basePrice = (plan.prices?.yearly || 0) / 100;
                                        const perUserPrice = (plan.prices?.perUser || 0) / 100;
                                        const currentUserCount = isSelected ? (customUserCount || plan.minUsers || 10) : (plan.minUsers || 10);
                                        const totalPrice = plan.isCustom 
                                            ? (basePrice + (perUserPrice * currentUserCount))
                                            : basePrice;

                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                                                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-teal-500 bg-teal-500/10'
                                                        : isCurrentPlan
                                                        ? 'border-gray-500 bg-gray-500/10 cursor-not-allowed opacity-60'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                {plan.badge && (
                                                    <div className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                                                        {plan.badge}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-end mb-4">
                                                    {isSelected && (
                                                        <CheckCircle className="w-6 h-6 text-teal-500" />
                                                    )}
                                                </div>
                                                
                                                {plan.isCustom ? (
                                                    <>
                                                        <div className="mb-4 min-w-0 overflow-hidden">
                                                            <div className="flex flex-wrap items-baseline gap-1 mb-2 break-words">
                                                                <span className="text-2xl sm:text-3xl font-bold break-all min-w-0">
                                                                    ₹{basePrice.toLocaleString('en-IN')}/yr
                                                                </span>
                                                                <span className="text-gray-400 text-lg sm:text-xl flex-shrink-0">+</span>
                                                                <span className="text-xl sm:text-2xl font-bold break-all min-w-0">
                                                                    ₹{(perUserPrice * currentUserCount).toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 break-words">
                                                                {t('institution_admin.custom_plan_price_breakdown', { base: basePrice.toLocaleString('en-IN'), count: currentUserCount, perUser: perUserPrice.toLocaleString('en-IN') })}
                                                            </p>
                                                        </div>
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-300 mb-2">1 {t('institution_admin.admin_dashboard')} +</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={isSelected ? customUserCount : (plan.minUsers || 10)}
                                                    onChange={(e) => {
                                                        const inputValue = e.target.value;
                                                        if (inputValue === '') {
                                                            setCustomUserCount('');
                                                            if (!isSelected) {
                                                                handleSelectPlan(plan);
                                                            }
                                                            return;
                                                        }
                                                        const value = parseInt(inputValue) || 0;
                                                        setCustomUserCount(value);
                                                        if (!isSelected) {
                                                            handleSelectPlan(plan);
                                                        }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isSelected) {
                                                            handleSelectPlan(plan);
                                                        }
                                                    }}
                                                    min={plan.minUsers || 10}
                                                    className="w-20 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                                                />
                                                <span className="text-sm text-gray-300">{t('institution_admin.users')}</span>
                                            </div>
                                            <div className="mt-2 min-w-0">
                                                <p className="text-lg sm:text-xl font-bold text-teal-400 break-all overflow-hidden">
                                                    ₹{totalPrice.toLocaleString('en-IN')} {t('institution_admin.total')}
                                                </p>
                                            </div>
                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="mb-4">
                                                            <span className="text-3xl font-bold">
                                                                ₹{basePrice.toLocaleString('en-IN')}
                                                            </span>
                                                            <span className="text-gray-400">{t('institution_admin.per_year_short')}</span>
                                                        </div>
                                                        <div className="mb-4">
                                                            <p className="text-sm text-gray-400">{t('institution_admin.admin_dashboard_plus_users', { count: plan.maxUsers })}</p>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                <ul className="space-y-2 mb-6">
                                                    {plan.features?.map((feature, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle className="w-4 h-4 text-teal-500" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                                
                                                {!isCurrentPlan && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (plan.isCustom) {
                                                                if (!isSelected) {
                                                                    handleSelectPlan(plan);
                                                                    return;
                                                                }
                                                                // Validate custom plan
                                                                if (!customUserCount || customUserCount < (plan.minUsers || 10)) {
                                                                    toast.error(t('institution_admin.minimum_users_required', { count: plan.minUsers || 10 }));
                                                                    return;
                                                                }
                                                            }
                                                            handleRenewSubscription(plan);
                                                        }}
                                                        disabled={renewalLoading || (plan.isCustom && !isSelected) || (plan.isCustom && (!customUserCount || customUserCount < (plan.minUsers || 10)))}
                                                        className="w-full mt-4 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                                        style={{
                                                            backgroundColor: (isSelected || !plan.isCustom) ? secondaryColor : 'rgba(255, 255, 255, 0.1)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!e.target.disabled && (isSelected || !plan.isCustom)) {
                                                                const rgb = hexToRgb(secondaryColor);
                                                                if (rgb) {
                                                                    e.target.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                                                                }
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (isSelected || !plan.isCustom) {
                                                                e.target.style.backgroundColor = secondaryColor;
                                                            }
                                                        }}
                                                    >
                                                        {renewalLoading ? t('institution_admin.processing') : (isExpired ? t('institution_admin.renew') : t('institution_admin.upgrade'))}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alerts & Notifications */}
                    {(showUserWarning || showRenewalWarning || isExpired) && !showPlanSelection && (
                        <div className="space-y-3">
                            {isExpired && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-red-400 mb-1">{t('institution_admin.subscription_expired')}</h4>
                                        <p className="text-sm text-gray-300">{t('institution_admin.subscription_expired_message')}</p>
                                    </div>
                                </div>
                            )}
                            {showUserWarning && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-yellow-400 mb-1">{t('institution_admin.user_limit_warning_80')}</h4>
                                        <p className="text-sm text-gray-300">{t('institution_admin.user_limit_warning_60', { percent: Math.round(userUsagePercent) })}</p>
                                    </div>
                                </div>
                            )}
                            {showRenewalWarning && !isExpired && (
                                <div 
                                    className="border rounded-xl p-4 flex items-start gap-3"
                                    style={{
                                        backgroundColor: getRgbaColor(primaryColor, 0.1),
                                        borderColor: getRgbaColor(primaryColor, 0.3)
                                    }}
                                >
                                    <Bell className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold mb-1" style={{ color: primaryColor }}>{t('institution_admin.renewal_warning_title')}</h4>
                                        <p className="text-sm text-gray-300">{t('institution_admin.renewal_warning_message', { days: daysRemaining })}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Usage Statistics & Subscription Period - Combined Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Usage Statistics */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" style={{ color: secondaryColor }} />
                                {t('institution_admin.usage_statistics')}
                            </h3>
                            
                            {/* Users Usage Progress */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-300 font-medium">{t('institution_admin.users_label')}</span>
                                    <span className="text-sm text-gray-400 font-semibold">
                                        {currentUsers} / {subscription.maxUsers || 10}
                                    </span>
                                </div>
                                <div className="w-full bg-black/30 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            userUsagePercent >= 90 
                                                ? 'bg-red-500' 
                                                : userUsagePercent >= 75
                                                ? 'bg-orange-500'
                                                : userUsagePercent >= 50
                                                ? 'bg-yellow-500'
                                                : 'bg-teal-500'
                                        }`}
                                        style={{ 
                                            width: `${Math.min(userUsagePercent, 100)}%`,
                                            boxShadow: userUsagePercent >= 75 ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-400">
                                        {t('institution_admin.percent_plan_limit_used', { percent: Math.round(userUsagePercent) })}
                                    </span>
                                    {userUsagePercent >= 75 && (
                                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {userUsagePercent >= 90 ? t('institution_admin.critical') : t('institution_admin.warning')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Other Usage Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs mb-1">{t('institution_admin.presentations_label')}</p>
                                    <p className="text-2xl font-bold text-white">{usageStats?.totalPresentations || stats?.totalPresentations || 0}</p>
                                </div>
                                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs mb-1">{t('institution_admin.total_responses_label_stats')}</p>
                                    <p className="text-2xl font-bold text-white">{usageStats?.totalResponses || stats?.totalResponses || 0}</p>
                                </div>
                                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs mb-1">{t('institution_admin.active_users_30_days')}</p>
                                    <p className="text-2xl font-bold text-white">{usageStats?.activeUsers || stats?.activeUsers || 0}</p>
                                </div>
                                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs mb-1">{t('institution_admin.available_users')}</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Math.max(0, (subscription.maxUsers || 10) - currentUsers)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Period */}
                        {subscription.startDate && subscription.endDate && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" style={{ color: secondaryColor }} />
                                    {t('institution_admin.subscription_period')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                        <p className="text-gray-400 text-xs mb-1">{t('institution_admin.start_date')}</p>
                                        <p className="text-lg font-semibold text-white">
                                            {new Date(subscription.startDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                        <p className="text-gray-400 text-xs mb-1">{t('institution_admin.end_date')}</p>
                                        <p className="text-lg font-semibold text-white">
                                            {new Date(subscription.endDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    {subscription.endDate && daysRemaining !== null && (
                                        <div className={`p-4 rounded-lg border ${
                                            daysRemaining <= 0 
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : daysRemaining <= 30
                                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                                : 'bg-blue-500/10 border-blue-500/30'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <Clock className={`w-5 h-5 ${
                                                    daysRemaining <= 0 
                                                        ? 'text-red-400'
                                                        : daysRemaining <= 30
                                                        ? 'text-yellow-400'
                                                        : 'text-blue-400'
                                                }`} />
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {daysRemaining <= 0 
                                                            ? t('institution_admin.subscription_expired')
                                                            : `${daysRemaining} ${t('institution_admin.days_remaining')}`
                                                        }
                                                    </p>
                                                    {daysRemaining > 0 && daysRemaining <= 30 && (
                                                        <p className="text-xs text-yellow-300 mt-1">
                                                            {t('institution_admin.renew_soon_message')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* No Subscription State */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm text-center">
                        <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-xl font-semibold text-white mb-2">{t('institution_admin.no_active_subscription')}</h3>
                        <p className="text-gray-400 mb-6">
                            {t('institution_admin.no_subscription_message')}
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mt-6">
                            <h4 className="text-lg font-semibold text-white mb-4">{t('institution_admin.institution_plan_features')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: secondaryColor }} />
                                    <div>
                                        <p className="text-white font-medium">{t('institution_admin.admin_dashboard')}</p>
                                        <p className="text-gray-400 text-sm">{t('institution_admin.admin_dashboard_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: secondaryColor }} />
                                    <div>
                                        <p className="text-white font-medium">{t('institution_admin.custom_branding')}</p>
                                        <p className="text-gray-400 text-sm">{t('institution_admin.custom_branding_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: secondaryColor }} />
                                    <div>
                                        <p className="text-white font-medium">{t('institution_admin.bulk_user_management')}</p>
                                        <p className="text-gray-400 text-sm">{t('institution_admin.bulk_user_management_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: secondaryColor }} />
                                    <div>
                                        <p className="text-white font-medium">{t('institution_admin.advanced_analytics')}</p>
                                        <p className="text-gray-400 text-sm">{t('institution_admin.advanced_analytics_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default Subscription;
