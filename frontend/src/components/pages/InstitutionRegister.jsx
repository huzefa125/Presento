// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Mail, Lock, User, Building2, Phone, Globe, 
  CreditCard, CheckCircle, Eye, EyeOff, Loader2, ArrowRight,
  Check, X, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../config/api';
import { translateError } from '../../utils/errorTranslator';

const InstitutionRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationToken, setRegistrationToken] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customUserCount, setCustomUserCount] = useState(10); // Minimum 10 users
  const [customUserCountError, setCustomUserCountError] = useState('');
  const billingCycle = 'yearly'; // Only yearly plans available
  const [showPassword, setShowPassword] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState({
    admin: false
  });
  const [otp, setOtp] = useState('');

  // Step 1: Basic Information
  const [formData, setFormData] = useState({
    institutionName: '',
    adminName: '',
    adminEmail: '',
    country: '',
    phoneNumber: '',
    institutionType: ''
  });

  // Step 4: Password
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Step 5: Payment
  const [paymentData, setPaymentData] = useState({
    billingAddress: '',
    taxId: '',
    billingEmail: ''
  });

  // Payment
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Load from sessionStorage on mount and pre-fill from navigation state
  useEffect(() => {
    const savedData = sessionStorage.getItem('institutionRegistration');
    const initialFormData = {
      institutionName: '',
      adminName: '',
      adminEmail: '',
      country: '',
      phoneNumber: '',
      institutionType: ''
    };
    let loadedFormData = initialFormData;
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.formData) {
          loadedFormData = { ...initialFormData, ...data.formData };
        }
        if (data.passwordData) setPasswordData(data.passwordData);
        if (data.paymentData) setPaymentData(data.paymentData);
        if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
        if (data.customUserCount) setCustomUserCount(data.customUserCount);
        if (data.emailVerificationStatus) setEmailVerificationStatus(data.emailVerificationStatus);
        if (data.currentStep) setCurrentStep(data.currentStep);
        if (data.registrationToken) setRegistrationToken(data.registrationToken);
      } catch (error) {
        console.error('Failed to load registration data from sessionStorage:', error);
      }
    }
    
    // Pre-fill from navigation state if available
    // Only pre-fill if fields are empty (either no saved data or saved data has empty fields)
    const userData = location.state;
    if (userData) {
      // Check if fields are empty (empty string or null/undefined)
      const isNameEmpty = !loadedFormData.adminName || loadedFormData.adminName.trim() === '';
      const isEmailEmpty = !loadedFormData.adminEmail || loadedFormData.adminEmail.trim() === '';
      const isCountryEmpty = !loadedFormData.country || loadedFormData.country.trim() === '';
      
      const shouldUpdateName = isNameEmpty && userData.adminName && userData.adminName.trim() !== '';
      const shouldUpdateEmail = isEmailEmpty && userData.adminEmail && userData.adminEmail.trim() !== '';
      const shouldUpdateCountry = isCountryEmpty && userData.country && userData.country.trim() !== '';
      
      if (shouldUpdateName || shouldUpdateEmail || shouldUpdateCountry) {
        loadedFormData = {
          ...loadedFormData,
          adminName: shouldUpdateName ? userData.adminName.trim() : loadedFormData.adminName,
          adminEmail: shouldUpdateEmail ? userData.adminEmail.trim() : loadedFormData.adminEmail,
          country: shouldUpdateCountry ? userData.country.trim() : loadedFormData.country
        };
      }
    }
    
    // Set formData once with all updates
    setFormData(loadedFormData);
    
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const loadPlans = async () => {
    try {
      const response = await api.get('/institution/register/plans');
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  // Save to sessionStorage whenever data changes
  useEffect(() => {
    const dataToSave = {
      formData,
      passwordData,
      paymentData,
      selectedPlan,
      customUserCount,
      emailVerificationStatus,
      currentStep,
      registrationToken
    };
    sessionStorage.setItem('institutionRegistration', JSON.stringify(dataToSave));
  }, [formData, passwordData, paymentData, selectedPlan, customUserCount, emailVerificationStatus, currentStep, registrationToken]);

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error(t('institution_register.invalid_otp'));
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/institution/register/verify-email', {
        adminEmail: formData.adminEmail,
        otp
      });

      if (response.data.success) {
        setEmailVerificationStatus(prev => ({
          ...prev,
          admin: true
        }));
        toast.success(t('institution_register.email_verified'));
        setCurrentStep(3); // Go to password setup (Step 3)
        setOtp(''); // Clear OTP after successful verification
      }
    } catch (error) {
      toast.error(translateError(error, t, 'institution_register.verification_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/institution/register/start', formData);
      
      if (response.data.success) {
        setRegistrationToken(response.data.registrationToken);
        setCurrentStep(2); // Go to Step 2: Email Verification
        toast.success(t('institution_register.step1_success'));
      }
    } catch (error) {
      toast.error(translateError(error, t, 'institution_register.step1_error'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Password Setup
  const handleStep3Submit = async (e) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error(t('institution_register.password_mismatch'));
      return;
    }

    if (passwordData.password.length < 8) {
      toast.error(t('institution_register.password_too_short'));
      return;
    }

    setLoading(true);

    try {
      // Validate password (no storage, just validation)
      const response = await api.post('/institution/register/validate-password', {
        password: passwordData.password
      });

      if (response.data.success) {
        setCurrentStep(4); // Go to Step 4: Select Plan
        toast.success(t('institution_register.password_saved'));
      }
    } catch (error) {
      toast.error(translateError(error, t, 'institution_register.password_error'));
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Select Plan
  const handleStep4Submit = async () => {
    if (!selectedPlan) {
      toast.error(t('institution_register.select_plan_error'));
      return;
    }

    // Validate custom plan user count
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (selectedPlanData?.isCustom) {
      const minUsers = selectedPlanData.minUsers || 10;
      if (!customUserCount || customUserCount < minUsers) {
        setCustomUserCountError(t('institution_register.custom_plan_min_users_error', { count: minUsers }));
        toast.error(t('institution_register.custom_plan_min_users_error', { count: minUsers }));
        return;
      }
    }

    setLoading(true);
    try {
      // Validate plan selection (no storage)
      const response = await api.post('/institution/register/select-plan', {
        plan: selectedPlan,
        billingCycle,
        customUserCount: selectedPlanData?.isCustom ? customUserCount : undefined
      });

      if (response.data.success) {
        setCurrentStep(5); // Go to Step 5: Payment
        toast.success(t('institution_register.plan_selected'));
      }
    } catch (error) {
      toast.error(translateError(error, t, 'institution_register.plan_selection_error'));
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Payment
  const handleStep5Submit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous payment requests
    if (isPaymentProcessing || loading) {
      return;
    }
    
    setLoading(true);
    setIsPaymentProcessing(true);

    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        // Try to load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            if (window.Razorpay) {
              resolve();
            } else {
              reject(new Error('Razorpay failed to load'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load Razorpay script'));
          document.body.appendChild(script);
        });
      }

      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const response = await api.post('/institution/register/create-payment', {
        plan: selectedPlan,
        billingCycle,
        customUserCount: selectedPlanData?.isCustom ? customUserCount : undefined
      });

      console.log('Payment order response:', response.data);

      if (response.data.success) {
        if (!response.data.orderId || !response.data.keyId) {
          throw new Error('Invalid payment response: missing orderId or keyId');
        }
        setRazorpayOrderId(response.data.orderId);
        // Initialize Razorpay payment
        initializeRazorpayPayment(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Payment setup error:', error);
      let errorMessage = t('institution_register.payment_error');
      
      if (error.response?.data) {
        // Check for different error formats
        errorMessage = error.response.data.error || 
                      error.response.data.message || 
                      error.response.data.error?.message ||
                      errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setLoading(false);
      setIsPaymentProcessing(false);
    }
  };

  const initializeRazorpayPayment = (paymentData) => {
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      // Validate payment data
      if (!paymentData.keyId) {
        throw new Error('Payment gateway key is missing. Please contact support.');
      }
      if (!paymentData.orderId) {
        throw new Error('Payment order ID is missing. Please try again.');
      }
      if (!paymentData.amount) {
        throw new Error('Payment amount is missing. Please try again.');
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        name: 'Inavora',
        description: `Institution Registration - ${selectedPlan}`,
        order_id: paymentData.orderId,
        handler: async function (response) {
          // Payment successful - ONLY NOW will data be saved to MongoDB
          try {
            // Store payment response
            setPaymentResponse({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            // Complete registration after payment - THIS IS THE ONLY PLACE WHERE DATA IS SAVED TO MONGODB
            await completeRegistrationAfterPayment();
            setLoading(false);
            setIsPaymentProcessing(false);
          } catch (error) {
            // If registration completion fails, data is NOT saved to database
            console.error('Payment handler error:', error);
            toast.error(translateError(error, t, 'institution_register.payment_error'));
            setLoading(false);
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          email: formData.adminEmail,
          name: formData.adminName
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function() {
            // Payment cancelled by user - DO NOT save any data to database
            // Data remains only in sessionStorage and will be cleared if user leaves
            setLoading(false);
            setIsPaymentProcessing(false);
            toast.error(t('institution_register.payment_cancelled'));
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        // Payment failed - DO NOT save any data to database
        // Data remains only in sessionStorage and will be cleared if user leaves
        console.error('Payment failed:', response.error);
        const errorMsg = response.error?.description || 
                        response.error?.reason || 
                        response.error?.code ||
                        t('institution_register.payment_error');
        toast.error(`Payment failed: ${errorMsg}`);
        setLoading(false);
        setIsPaymentProcessing(false);
      });
      
      razorpay.on('payment.authorized', function (response) {
        console.log('Payment authorized:', response);
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      toast.error(error.message || t('institution_register.payment_error'));
      setLoading(false);
      setIsPaymentProcessing(false);
    }
  };


  const handleSendOTP = async () => {
    try {
      setLoading(true);
      // Try resend first (has rate limiting), if that fails, try send-verification
      try {
        const response = await api.post('/institution/register/resend-verification', {
          adminEmail: formData.adminEmail,
          adminName: formData.adminName
        });

        if (response.data.success) {
          toast.success(t('institution_register.otp_sent_success'));
          return;
        }
      } catch (resendError) {
        // If resend fails (e.g., rate limit), try send-verification
        console.log('Resend failed, trying send-verification:', resendError);
      }
      
      // Fallback to send-verification endpoint
      const response = await api.post('/institution/register/send-verification', {
        adminEmail: formData.adminEmail,
        adminName: formData.adminName
      });

      if (response.data.success) {
        toast.success(t('institution_register.otp_sent_success'));
      }
    } catch (error) {
      toast.error(translateError(error, t, 'institution_register.send_otp_error'));
    } finally {
      setLoading(false);
    }
  };

  const completeRegistrationAfterPayment = async () => {
    // IMPORTANT: This function is ONLY called after successful payment
    // If payment is cancelled or fails, this function is NEVER called
    // Therefore, data is ONLY saved to MongoDB when payment is successful
    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      // Send ALL registration data to backend - THIS IS THE FIRST AND ONLY TIME DATA IS SAVED TO MONGODB
      // Backend will verify payment signature before saving
      const response = await api.post('/institution/register/complete', {
        // Registration data
        institutionName: formData.institutionName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
        institutionType: formData.institutionType,
        password: passwordData.password,
        // Plan data
        plan: selectedPlan,
        billingCycle: billingCycle,
        customUserCount: selectedPlanData?.isCustom ? customUserCount : undefined,
        // Payment data
        razorpayOrderId: paymentResponse?.razorpayOrderId || razorpayOrderId,
        razorpayPaymentId: paymentResponse?.razorpayPaymentId || null,
        razorpaySignature: paymentResponse?.razorpaySignature || null,
        billingAddress: paymentData.billingAddress,
        taxId: paymentData.taxId,
        billingEmail: paymentData.billingEmail || formData.adminEmail
      });

      if (response.data.success) {
        // Store token and redirect
        sessionStorage.setItem('institutionAdminToken', response.data.token);
        // Clear registration data from sessionStorage
        sessionStorage.removeItem('institutionRegistration');
        toast.success(t('institution_register.registration_complete'));
        navigate('/institution-admin?onboarding=true');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      toast.error(translateError(error, t, 'institution_register.completion_error'));
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.institution_name')} *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              required
              value={formData.institutionName}
              onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder={t('institution_register.institution_name_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.admin_name')} *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder={t('institution_register.admin_name_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.email')} *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder={t('institution_register.admin_email_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.country')}
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder={t('institution_register.country_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.phone')}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder={t('institution_register.phone_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.institution_type')}
          </label>
          <select
            value={formData.institutionType}
            onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          >
            <option value="">{t('institution_register.select_type')}</option>
            <option value="University">{t('institution_register.type_university')}</option>
            <option value="School">{t('institution_register.type_school')}</option>
            <option value="Corporate">{t('institution_register.type_corporate')}</option>
            <option value="NGO">{t('institution_register.type_ngo')}</option>
            <option value="Other">{t('institution_register.type_other')}</option>
          </select>
        </div>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('institution_register.continue')}
      </button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleOTPVerification} className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">{t('institution_register.verify_email')}</h3>
        <p className="text-gray-400 mb-6">{t('institution_register.verify_email_description')}</p>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${
            emailVerificationStatus.admin
              ? 'border-green-500 bg-green-500/10'
              : 'border-white/10 bg-white/5'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {emailVerificationStatus.admin ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <div>
                  <p className="font-semibold">{t('institution_register.email')}</p>
                  <p className="text-sm text-gray-400">{formData.adminEmail}</p>
                </div>
              </div>
            </div>

            {!emailVerificationStatus.admin && (
              <>
                {/* Send OTP Button - Prominent */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('institution_register.sending_otp')}
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        {t('institution_register.send_otp_to_verify')}
                      </>
                    )}
                  </button>
                </div>

                {/* OTP Input Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('institution_register.enter_otp')}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                      setOtp(value);
                    }}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="000000"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {t('institution_register.otp_sent_to_email')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {!emailVerificationStatus.admin && (
          <div className="mt-6 space-y-3">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {t('institution_register.verify')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full py-3 bg-white/5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('institution_register.back')}
            </button>
          </div>
        )}

        {emailVerificationStatus.admin && (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              {t('institution_register.continue')}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full py-3 bg-white/5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('institution_register.back')}
            </button>
          </div>
        )}
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('institution_register.password')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={passwordData.password}
            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
            autoComplete="new-password"
            className="w-full pl-10 pr-12 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder={t('institution_register.password_placeholder')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 text-gray-500 hover:text-gray-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-500 cursor-pointer" />
            ) : (
              <Eye className="w-5 h-5 text-gray-500 cursor-pointer" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">{t('institution_register.password_requirements')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('institution_register.confirm_password')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder={t('institution_register.confirm_password_placeholder')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Lock className="w-5 h-5" />
              {t('institution_register.continue')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="w-full py-3 bg-white/5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('institution_register.back')}
        </button>
      </div>
    </form>
  );

  const renderStep4 = () => (
    <div className="space-y-6">

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                {plan.badge}
              </div>
            )}
            <div className="flex items-center justify-end mb-4">
              {selectedPlan === plan.id && (
                <CheckCircle className="w-6 h-6 text-teal-500" />
              )}
            </div>
            {plan.isCustom ? (
              <>
                <div className="mb-4 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-baseline gap-1 mb-2 break-words">
                    <span className="text-2xl sm:text-3xl font-bold break-all min-w-0">
                      ₹{((plan.prices.yearly / 100).toLocaleString('en-IN'))}/yr
                    </span>
                    <span className="text-gray-400 text-lg sm:text-xl flex-shrink-0">+</span>
                    <span className="text-xl sm:text-2xl font-bold break-all min-w-0">
                      ₹{(((plan.prices.perUser || 0) * (selectedPlan === plan.id ? (customUserCount || plan.minUsers || 10) : plan.minUsers || 10)) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 break-words">
                    {t('institution_register.custom_plan_price_breakdown', {
                      baseText: t('institution_register.custom_plan_base_price', { base: plan.prices.yearly / 100 }),
                      userText: t('institution_register.custom_plan_per_user', {
                        count: selectedPlan === plan.id ? (customUserCount || plan.minUsers || 10) : plan.minUsers || 10,
                        price: plan.prices.perUser / 100
                      })
                    })}
                  </p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">1 Admin Dashboard +</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selectedPlan === plan.id ? customUserCount : plan.minUsers || 10}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Allow empty input or any number
                        if (inputValue === '') {
                          setCustomUserCount('');
                          setCustomUserCountError(t('institution_register.custom_plan_min_users_error', { count: plan.minUsers || 10 }));
                          if (selectedPlan !== plan.id) {
                            setSelectedPlan(plan.id);
                          }
                          return;
                        }
                        
                        const value = parseInt(inputValue) || 0;
                        setCustomUserCount(value);
                        
                        // Show error if below minimum
                        if (value < (plan.minUsers || 10)) {
                          setCustomUserCountError(t('institution_register.custom_plan_min_users_error', { count: plan.minUsers || 10 }));
                        } else {
                          setCustomUserCountError('');
                        }
                        
                        if (selectedPlan !== plan.id) {
                          setSelectedPlan(plan.id);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedPlan !== plan.id) {
                          setSelectedPlan(plan.id);
                        }
                      }}
                      className={`w-20 px-3 py-2 bg-black/30 border rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm ${
                        customUserCountError && selectedPlan === plan.id ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <span className="text-sm text-gray-300">{t('institution_register.users')}</span>
                  </div>
                  {customUserCountError && selectedPlan === plan.id && (
                    <p className="text-xs text-red-400 mt-1">{customUserCountError}</p>
                  )}
                  <div className="mt-2 min-w-0">
                    <p className="text-lg sm:text-xl font-bold text-teal-400 break-all overflow-hidden">
                      ₹{(((plan.prices.yearly || 0) + ((plan.prices.perUser || 0) * (selectedPlan === plan.id ? (customUserCount || plan.minUsers || 10) : plan.minUsers || 10))) / 100).toLocaleString('en-IN')} Total
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    ₹{plan.prices.yearly / 100}
                  </span>
                  <span className="text-gray-400">/yr</span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-400">1 Admin Dashboard + {plan.maxUsers} users</p>
                </div>
              </>
            )}
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, idx) => {
                // Map feature names to translation keys
                const featureKeyMap = {
                  'Custom Branding': 'institution_register.feature_custom_branding',
                  'Advanced Analytics': 'institution_register.feature_advanced_analytics',
                  'AI Features': 'institution_register.feature_ai_features',
                  'API Access': 'institution_register.feature_api_access',
                  'Bulk User Management': 'institution_register.feature_bulk_user_management',
                  'Export Results': 'institution_register.feature_detailed_export_results'
                };
                const translationKey = featureKeyMap[feature] || feature;
                const displayFeature = translationKey.startsWith('institution_register.') ? t(translationKey) : feature;
                return (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-500" />
                    {displayFeature}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleStep4Submit}
          disabled={!selectedPlan || loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('institution_register.continue')}
        </button>
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="w-full py-3 bg-white/5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('institution_register.back')}
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <form onSubmit={handleStep5Submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('institution_register.billing_address')}
        </label>
        <textarea
          value={paymentData.billingAddress}
          onChange={(e) => setPaymentData({ ...paymentData, billingAddress: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          placeholder={t('institution_register.billing_address_placeholder')}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.tax_id')}
          </label>
          <input
            type="text"
            value={paymentData.taxId}
            onChange={(e) => setPaymentData({ ...paymentData, taxId: e.target.value })}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder={t('institution_register.tax_id_placeholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('institution_register.billing_email')}
          </label>
          <input
            type="email"
            value={paymentData.billingEmail || formData.adminEmail}
            onChange={(e) => setPaymentData({ ...paymentData, billingEmail: e.target.value })}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder={t('institution_register.billing_email_placeholder')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading || isPaymentProcessing}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <CreditCard className="w-5 h-5" />
              {t('institution_register.proceed_to_payment')}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleBack}
          disabled={loading || isPaymentProcessing}
          className="w-full py-3 bg-white/5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('institution_register.back')}
        </button>
      </div>
    </form>
  );

  const steps = [
    { number: 1, title: t('institution_register.step1_title') },
    { number: 2, title: t('institution_register.step2_title') },
    { number: 3, title: t('institution_register.step3_title') },
    { number: 4, title: t('institution_register.step4_title') },
    { number: 5, title: t('institution_register.step5_title') }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-bold text-white">𝑖</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Inavora</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center border border-white/30 px-3 py-1 rounded-lg gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('institution_register.back')}
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-20 container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        currentStep >= step.number
                          ? 'bg-teal-500 text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="text-xs mt-2 text-center text-gray-400 hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        currentStep > step.number ? 'bg-teal-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10"
          >
            <h2 className="text-3xl font-bold mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-gray-400 mb-8">{t(`institution_register.step${currentStep}_description`)}</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default InstitutionRegister;

