import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../config/api';
import { getBrandingColors } from '../components/InstitutionAdmin/utils/brandingColors';

/**
 * All state and data-fetching/payment logic for the institution admin
 * Subscription tab - everything Subscription.jsx needed except the render
 * tree. Split out of that file, which held all of this plus ~690 lines of
 * JSX in one 1,033-line component; see CODE_STANDARDS.md.
 *
 * Takes the three props its own body actually uses (institution, for the
 * subscription fallback and Razorpay prefill; stats, as a fallback source
 * for currentUsers; onRefresh, to know when the parent wants fresh data) -
 * onAddUser stays as a plain prop on the component itself, since only the
 * render tree needs it.
 *
 * Returns every piece of state and every handler the render layer might
 * need; Subscription.jsx destructures only what it actually uses.
 */
export function useInstitutionSubscriptionData({ institution, stats, onRefresh }) {
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
                    name: 'Presento',
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

  return {
    t,
    primaryColor,
    secondaryColor,
    renewalLoading,
    setRenewalLoading,
    showPlanSelection,
    setShowPlanSelection,
    selectedPlan,
    setSelectedPlan,
    customUserCount,
    setCustomUserCount,
    plans,
    setPlans,
    loadingPlans,
    setLoadingPlans,
    payments,
    setPayments,
    loadingPayments,
    setLoadingPayments,
    subscriptionData,
    setSubscriptionData,
    loadingSubscription,
    setLoadingSubscription,
    usageStats,
    setUsageStats,
    fetchSubscriptionDetails,
    fetchUsageStats,
    subscription,
    isActive,
    isExpired,
    daysRemaining,
    currentUsers,
    userUsagePercent,
    showUserWarning,
    showRenewalWarning,
    getPlanName,
    currentPlanName,
    handleSelectPlan,
    handleRenewSubscription
  };
}
