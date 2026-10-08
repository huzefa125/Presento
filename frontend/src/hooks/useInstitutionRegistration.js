import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../config/api';
import { translateError } from '../utils/errorTranslator';

/**
 * All state and step-submit handlers for the institution registration
 * wizard - everything InstitutionRegister.jsx needed except the render
 * tree. Split out of that file, which held all of this plus 5
 * renderStepN JSX functions in one 1,179-line component; see
 * CODE_STANDARDS.md.
 *
 * Returns every piece of state and every handler the render layer might
 * need; InstitutionRegister.jsx destructures only what it actually uses.
 */
export function useInstitutionRegistration() {
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
        name: 'Presento',
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

  return {
    navigate,
    location,
    t,
    currentStep,
    setCurrentStep,
    loading,
    setLoading,
    registrationToken,
    setRegistrationToken,
    plans,
    setPlans,
    selectedPlan,
    setSelectedPlan,
    customUserCount,
    setCustomUserCount,
    customUserCountError,
    setCustomUserCountError,
    billingCycle,
    showPassword,
    setShowPassword,
    emailVerificationStatus,
    setEmailVerificationStatus,
    otp,
    setOtp,
    formData,
    setFormData,
    passwordData,
    setPasswordData,
    paymentData,
    setPaymentData,
    razorpayOrderId,
    setRazorpayOrderId,
    paymentResponse,
    setPaymentResponse,
    isPaymentProcessing,
    setIsPaymentProcessing,
    loadPlans,
    handleOTPVerification,
    handleBack,
    handleStep1Submit,
    handleStep3Submit,
    handleStep4Submit,
    handleStep5Submit,
    initializeRazorpayPayment,
    handleSendOTP,
    completeRegistrationAfterPayment
  };
}
