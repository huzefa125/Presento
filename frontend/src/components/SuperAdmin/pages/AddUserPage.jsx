import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../config/api';
import { 
  UserPlus, Mail, User, CreditCard, Calendar, 
  CheckCircle, XCircle, Loader, ArrowLeft, Eye, EyeOff,
  Building2, Phone, Globe, Lock
} from 'lucide-react';

const AddUserPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [institutionPlans, setInstitutionPlans] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    plan: 'free',
    status: 'active',
    billingCycle: '',
    endDate: '',
    password: '',
    createFirebaseAccount: false,
    // Institution-specific fields
    institutionName: '',
    adminName: '',
    adminEmail: '',
    country: '',
    phoneNumber: '',
    institutionType: '',
    institutionPlan: '',
    customUserCount: 10
  });
  const [errors, setErrors] = useState({});

  const plans = [
    { value: 'free', label: 'Free', description: 'Basic features, limited presentations' },
    { value: 'pro', label: 'Pro', description: 'Advanced features, unlimited presentations' },
    { value: 'lifetime', label: 'Lifetime', description: 'One-time payment, lifetime access' },
    { value: 'institution', label: 'Institution', description: 'For institution users' }
  ];

  const billingCycles = [
    { value: '', label: 'None' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'lifetime', label: 'Lifetime' },
    { value: 'one-time', label: 'One-time' }
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const institutionTypes = [
    { value: '', label: 'Select type' },
    { value: 'University', label: 'University' },
    { value: 'School', label: 'School' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'NGO', label: 'NGO' },
    { value: 'Other', label: 'Other' }
  ];

  // Fetch institution plans when institution plan is selected
  useEffect(() => {
    if (formData.plan === 'institution') {
      const fetchPlans = async () => {
        try {
          const response = await api.get('/institution/register/plans');
          if (response.data.success) {
            setInstitutionPlans(response.data.plans || []);
            // Set default plan if available and not already set
            if (response.data.plans && response.data.plans.length > 0 && !formData.institutionPlan) {
              setFormData(prev => ({ ...prev, institutionPlan: response.data.plans[0].id }));
            }
          }
        } catch (error) {
          console.error('Error fetching institution plans:', error);
        }
      };
      fetchPlans();
    } else {
      // Clear institution plans when not needed
      setInstitutionPlans([]);
    }
  }, [formData.plan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-set billing cycle for lifetime plan
    if (name === 'plan' && value === 'lifetime') {
      setFormData(prev => ({
        ...prev,
        billingCycle: 'lifetime'
      }));
    }

    // Reset institution fields when switching away from institution plan
    if (name === 'plan' && value !== 'institution') {
      setFormData(prev => ({
        ...prev,
        institutionName: '',
        adminName: '',
        adminEmail: '',
        country: '',
        phoneNumber: '',
        institutionType: '',
        institutionPlan: '',
        customUserCount: 10,
        password: ''
      }));
    }

    // Reset regular user fields when switching to institution plan
    if (name === 'plan' && value === 'institution') {
      setFormData(prev => ({
        ...prev,
        email: '',
        displayName: '',
        billingCycle: '',
        endDate: '',
        createFirebaseAccount: false
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.plan === 'institution') {
      // Institution-specific validation
      if (!formData.institutionName.trim()) {
        newErrors.institutionName = 'Institution name is required';
      }

      if (!formData.adminName.trim()) {
        newErrors.adminName = 'Admin name is required';
      } else if (formData.adminName.trim().length < 2) {
        newErrors.adminName = 'Admin name must be at least 2 characters';
      }

      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'Admin email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        newErrors.adminEmail = 'Invalid email format';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required for institution admin';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.institutionPlan) {
        newErrors.institutionPlan = 'Please select an institution plan';
      }

      // Validate custom user count for enterprise plan
      const selectedPlanData = institutionPlans.find(p => p.id === formData.institutionPlan);
      if (selectedPlanData?.isCustom) {
        const minUsers = selectedPlanData.minUsers || 10;
        if (!formData.customUserCount || formData.customUserCount < minUsers) {
          newErrors.customUserCount = `Minimum ${minUsers} users required for custom plan`;
        }
      }
    } else {
      // Regular user validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }

      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      } else if (formData.displayName.trim().length < 2) {
        newErrors.displayName = 'Display name must be at least 2 characters';
      }

      if (formData.createFirebaseAccount && !formData.password) {
        newErrors.password = 'Password is required when creating Firebase account';
      } else if (formData.createFirebaseAccount && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.plan !== 'free' && formData.plan !== 'lifetime' && !formData.billingCycle) {
        newErrors.billingCycle = 'Billing cycle is required for paid plans';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      if (formData.plan === 'institution') {
        // Create institution admin account
        const selectedPlanData = institutionPlans.find(p => p.id === formData.institutionPlan);
        const payload = {
          institutionName: formData.institutionName.trim(),
          adminName: formData.adminName.trim(),
          adminEmail: formData.adminEmail.trim(),
          password: formData.password,
          country: formData.country.trim() || null,
          phoneNumber: formData.phoneNumber.trim() || null,
          institutionType: formData.institutionType || null,
          plan: formData.institutionPlan,
          billingCycle: 'yearly', // Institution plans are yearly only
          customUserCount: selectedPlanData?.isCustom ? formData.customUserCount : undefined,
          status: formData.status,
          endDate: formData.endDate || null
        };

        const response = await api.post('/super-admin/institutions', payload);

        if (response.data.success) {
          toast.success('Institution admin account created successfully!');
          // Reset form
          setFormData({
            email: '',
            displayName: '',
            plan: 'free',
            status: 'active',
            billingCycle: '',
            endDate: '',
            password: '',
            createFirebaseAccount: false,
            institutionName: '',
            adminName: '',
            adminEmail: '',
            country: '',
            phoneNumber: '',
            institutionType: '',
            institutionPlan: '',
            customUserCount: 10
          });
          setErrors({});
          
          // Navigate to institutions page
          setTimeout(() => {
            navigate('/super-admin/institutions');
          }, 1500);
        }
      } else {
        // Create regular user account
        const payload = {
          email: formData.email.trim(),
          displayName: formData.displayName.trim(),
          plan: formData.plan,
          status: formData.status,
          billingCycle: formData.billingCycle || null,
          endDate: formData.endDate || null
        };

        // Only include password if creating Firebase account
        if (formData.createFirebaseAccount && formData.password) {
          payload.password = formData.password;
        }

        const response = await api.post('/super-admin/users', payload);

        if (response.data.success) {
          toast.success('User created successfully!');
          // Reset form
          setFormData({
            email: '',
            displayName: '',
            plan: 'free',
            status: 'active',
            billingCycle: '',
            endDate: '',
            password: '',
            createFirebaseAccount: false,
            institutionName: '',
            adminName: '',
            adminEmail: '',
            country: '',
            phoneNumber: '',
            institutionType: '',
            institutionPlan: '',
            customUserCount: 10
          });
          setErrors({});
          
          // Optionally navigate to users page
          setTimeout(() => {
            navigate('/super-admin/users');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error creating account:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to create account. Please try again.';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.code === 'DUPLICATE_ENTRY') {
        const field = formData.plan === 'institution' ? 'adminEmail' : 'email';
        setErrors(prev => ({ ...prev, [field]: 'Account with this email already exists' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/super-admin/users')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Users</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Add New User
            </h1>
            <p className="text-slate-400 mt-1">Create a new user account with custom subscription plan</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                {formData.plan === 'institution' ? 'Institution Information' : 'Basic Information'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {formData.plan === 'institution' ? 'Enter institution and admin details' : "Enter user's basic details"}
              </p>
            </div>

            {formData.plan === 'institution' ? (
              // Institution-specific fields
              <div className="grid md:grid-cols-2 gap-6">
                {/* Institution Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Institution Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.institutionName ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="Enter institution name"
                      required
                    />
                  </div>
                  {errors.institutionName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.institutionName}
                    </p>
                  )}
                </div>

                {/* Admin Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.adminName ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="Enter admin full name"
                      required
                    />
                  </div>
                  {errors.adminName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.adminName}
                    </p>
                  )}
                </div>

                {/* Admin Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.adminEmail ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  {errors.adminEmail && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.adminEmail}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                {/* Institution Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Institution Type
                  </label>
                  <select
                    name="institutionType"
                    value={formData.institutionType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    {institutionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              // Regular user fields
              <>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.email ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.displayName ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.displayName}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Subscription Section */}
          <div className="space-y-6 pt-6 border-t border-slate-800">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-400" />
                Subscription Plan
              </h2>
              <p className="text-sm text-slate-400 mt-1">Configure user's subscription plan</p>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Plan <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <label
                    key={plan.value}
                    className={`relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.plan === plan.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.value}
                      checked={formData.plan === plan.value}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white">{plan.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{plan.description}</div>
                    </div>
                    {formData.plan === plan.value && (
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution Plan Selection */}
            {formData.plan === 'institution' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Institution Plan <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {institutionPlans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.institutionPlan === plan.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="radio"
                          name="institutionPlan"
                          value={plan.id}
                          checked={formData.institutionPlan === plan.id}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                        />
                        {formData.institutionPlan === plan.id && (
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{plan.name}</div>
                        {plan.isCustom ? (
                          <div className="mt-2">
                            <div className="text-xs text-slate-400 mb-2">Base: ₹{plan.prices.yearly / 100}/yr + ₹{plan.prices.perUser / 100}/user</div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={formData.customUserCount}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setFormData(prev => ({ ...prev, customUserCount: value }));
                                  if (formData.institutionPlan !== plan.id) {
                                    setFormData(prev => ({ ...prev, institutionPlan: plan.id }));
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (formData.institutionPlan !== plan.id) {
                                    setFormData(prev => ({ ...prev, institutionPlan: plan.id }));
                                  }
                                }}
                                min={plan.minUsers || 10}
                                className={`w-20 px-2 py-1 bg-slate-700 border rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                                  errors.customUserCount && formData.institutionPlan === plan.id ? 'border-red-500' : 'border-slate-600'
                                }`}
                              />
                              <span className="text-xs text-slate-400">users</span>
                            </div>
                            {errors.customUserCount && formData.institutionPlan === plan.id && (
                              <p className="text-red-400 text-xs mt-1">{errors.customUserCount}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 mt-1">
                            {plan.maxUsers} users included
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.institutionPlan && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {errors.institutionPlan}
                  </p>
                )}
              </div>
            )}

            {/* Billing Cycle */}
            {formData.plan !== 'free' && formData.plan !== 'institution' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Billing Cycle {formData.plan !== 'lifetime' && <span className="text-red-400">*</span>}
                </label>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleChange}
                  disabled={formData.plan === 'lifetime'}
                  className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.billingCycle ? 'border-red-500' : 'border-slate-700'
                  } ${formData.plan === 'lifetime' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {billingCycles.map((cycle) => (
                    <option key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
                {errors.billingCycle && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {errors.billingCycle}
                  </p>
                )}
              </div>
            )}

            {/* End Date */}
            {formData.plan !== 'free' && formData.plan !== 'lifetime' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subscription End Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty to auto-calculate based on billing cycle
                </p>
              </div>
            )}
          </div>

          {/* Password Section */}
          {formData.plan === 'institution' ? (
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Admin Password
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Set password for institution admin account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.password ? 'border-red-500' : 'border-slate-700'
                    }`}
                    placeholder="Enter password (min 8 characters)"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Admin can change this password after first login
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Firebase Authentication (Optional)
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Create Firebase account for immediate login access
                </p>
              </div>

              {/* Create Firebase Account Toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  name="createFirebaseAccount"
                  checked={formData.createFirebaseAccount}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-500 focus:ring-blue-500 rounded"
                />
                <label className="text-sm text-slate-300 cursor-pointer">
                  Create Firebase authentication account
                </label>
              </div>

              {/* Password */}
              {formData.createFirebaseAccount && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.password ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="Enter password (min 6 characters)"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" />
                      ) : (
                        <Eye className="h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    User can change this password after first login
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/super-admin/users')}
              className="px-6 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {formData.plan === 'institution' ? 'Creating Institution...' : 'Creating User...'}
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  {formData.plan === 'institution' ? 'Create Institution Admin' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddUserPage;

