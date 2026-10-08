// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, Lock, User, Building2, Phone, Globe,
  CreditCard, CheckCircle, Eye, EyeOff, Loader2, ArrowRight,
  Check, AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useInstitutionRegistration } from '../../hooks/useInstitutionRegistration';

const InstitutionRegister = () => {
  const {
    currentStep,
    customUserCount,
    customUserCountError,
    emailVerificationStatus,
    formData,
    handleBack,
    handleOTPVerification,
    handleSendOTP,
    handleStep1Submit,
    handleStep3Submit,
    handleStep4Submit,
    handleStep5Submit,
    isPaymentProcessing,
    loading,
    navigate,
    otp,
    passwordData,
    paymentData,
    plans,
    selectedPlan,
    setCurrentStep,
    setCustomUserCount,
    setCustomUserCountError,
    setFormData,
    setOtp,
    setPasswordData,
    setPaymentData,
    setSelectedPlan,
    setShowPassword,
    showPassword,
    t
  } = useInstitutionRegistration();

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.institution_name')} *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              type="text"
              required
              value={formData.institutionName}
              onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
              className="pl-10"
              placeholder={t('institution_register.institution_name_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.admin_name')} *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              className="pl-10"
              placeholder={t('institution_register.admin_name_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.email')} *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="pl-10"
              placeholder={t('institution_register.admin_email_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.country')}
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="pl-10"
              placeholder={t('institution_register.country_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.phone')}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="pl-10"
              placeholder={t('institution_register.phone_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.institution_type')}
          </label>
          <select
            value={formData.institutionType}
            onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
            className="w-full bg-surface text-ink text-[15px] border border-[#dddddd] rounded-xs px-3 py-2.5 outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
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

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('institution_register.continue')}
      </Button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleOTPVerification} className="space-y-6">
      <div className="bg-canvas-soft border border-hairline rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-ink">{t('institution_register.verify_email')}</h3>
        <p className="text-ink-muted mb-6">{t('institution_register.verify_email_description')}</p>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${
            emailVerificationStatus.admin
              ? 'border-accent-green bg-accent-green/10'
              : 'border-hairline bg-surface'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {emailVerificationStatus.admin ? (
                  <CheckCircle className="w-6 h-6 text-accent-green" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-ink-faint" />
                )}
                <div>
                  <p className="font-semibold text-ink">{t('institution_register.email')}</p>
                  <p className="text-sm text-ink-muted">{formData.adminEmail}</p>
                </div>
              </div>
            </div>

            {!emailVerificationStatus.admin && (
              <>
                {/* Send OTP Button - Prominent */}
                <div className="mb-6">
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full"
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
                  </Button>
                </div>

                {/* OTP Input Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
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
                    className="w-full px-4 py-3 bg-surface border border-[#dddddd] rounded-xs text-ink text-center text-2xl tracking-widest outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                    placeholder="000000"
                    required
                  />
                  <p className="text-xs text-ink-muted mt-2 text-center">
                    {t('institution_register.otp_sent_to_email')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {!emailVerificationStatus.admin && (
          <div className="mt-6 space-y-3">
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {t('institution_register.verify')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="utility"
              onClick={handleBack}
              disabled={loading}
              className="w-full"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('institution_register.back')}
            </Button>
          </div>
        )}

        {emailVerificationStatus.admin && (
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="w-full"
            >
              {t('institution_register.continue')}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="utility"
              onClick={handleBack}
              className="w-full"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('institution_register.back')}
            </Button>
          </div>
        )}
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {t('institution_register.password')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={passwordData.password}
            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
            autoComplete="new-password"
            className="pl-10 pr-12"
            placeholder={t('institution_register.password_placeholder')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 text-ink-faint hover:text-ink-muted"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-ink-faint cursor-pointer" />
            ) : (
              <Eye className="w-5 h-5 text-ink-faint cursor-pointer" />
            )}
          </button>
        </div>
        <p className="text-xs text-ink-muted mt-1">{t('institution_register.password_requirements')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {t('institution_register.confirm_password')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="pl-10"
            placeholder={t('institution_register.confirm_password_placeholder')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Lock className="w-5 h-5" />
              {t('institution_register.continue')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="utility"
          onClick={handleBack}
          disabled={loading}
          className="w-full"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('institution_register.back')}
        </Button>
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
                ? 'border-primary bg-primary/5'
                : 'border-hairline bg-surface hover:border-ink-faint'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 bg-accent-orange text-on-primary text-xs font-bold px-3 py-1 rounded-full shadow-[var(--shadow-level-1)] z-10">
                {plan.badge}
              </div>
            )}
            <div className="flex items-center justify-end mb-4">
              {selectedPlan === plan.id && (
                <CheckCircle className="w-6 h-6 text-primary" />
              )}
            </div>
            {plan.isCustom ? (
              <>
                <div className="mb-4 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-baseline gap-1 mb-2 break-words">
                    <span className="text-2xl sm:text-3xl font-bold break-all min-w-0 text-ink">
                      ₹{((plan.prices.yearly / 100).toLocaleString('en-IN'))}/yr
                    </span>
                    <span className="text-ink-muted text-lg sm:text-xl flex-shrink-0">+</span>
                    <span className="text-xl sm:text-2xl font-bold break-all min-w-0 text-ink">
                      ₹{(((plan.prices.perUser || 0) * (selectedPlan === plan.id ? (customUserCount || plan.minUsers || 10) : plan.minUsers || 10)) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted break-words">
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
                  <p className="text-sm text-ink-secondary mb-2">1 Admin Dashboard +</p>
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
                      className={`w-20 px-3 py-2 bg-surface border rounded-xs text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary text-sm ${
                        customUserCountError && selectedPlan === plan.id ? 'border-red-500' : 'border-[#dddddd]'
                      }`}
                    />
                    <span className="text-sm text-ink-secondary">{t('institution_register.users')}</span>
                  </div>
                  {customUserCountError && selectedPlan === plan.id && (
                    <p className="text-xs text-red-500 mt-1">{customUserCountError}</p>
                  )}
                  <div className="mt-2 min-w-0">
                    <p className="text-lg sm:text-xl font-bold text-primary break-all overflow-hidden">
                      ₹{(((plan.prices.yearly || 0) + ((plan.prices.perUser || 0) * (selectedPlan === plan.id ? (customUserCount || plan.minUsers || 10) : plan.minUsers || 10))) / 100).toLocaleString('en-IN')} Total
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-ink">
                    ₹{plan.prices.yearly / 100}
                  </span>
                  <span className="text-ink-muted">/yr</span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-ink-muted">1 Admin Dashboard + {plan.maxUsers} users</p>
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
                  <li key={idx} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <Check className="w-4 h-4 text-accent-green" />
                    {displayFeature}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleStep4Submit}
          disabled={!selectedPlan || loading}
          className="w-full"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('institution_register.continue')}
        </Button>
        <Button
          type="button"
          variant="utility"
          onClick={handleBack}
          disabled={loading}
          className="w-full"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('institution_register.back')}
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <form onSubmit={handleStep5Submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {t('institution_register.billing_address')}
        </label>
        <textarea
          value={paymentData.billingAddress}
          onChange={(e) => setPaymentData({ ...paymentData, billingAddress: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-surface border border-[#dddddd] rounded-xs text-ink outline-none transition-shadow duration-150 placeholder:text-ink-faint focus:shadow-[var(--shadow-level-1)] focus:border-primary"
          placeholder={t('institution_register.billing_address_placeholder')}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.tax_id')}
          </label>
          <Input
            type="text"
            value={paymentData.taxId}
            onChange={(e) => setPaymentData({ ...paymentData, taxId: e.target.value })}
            placeholder={t('institution_register.tax_id_placeholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            {t('institution_register.billing_email')}
          </label>
          <Input
            type="email"
            value={paymentData.billingEmail || formData.adminEmail}
            onChange={(e) => setPaymentData({ ...paymentData, billingEmail: e.target.value })}
            placeholder={t('institution_register.billing_email_placeholder')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={loading || isPaymentProcessing}
          className="w-full"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <CreditCard className="w-5 h-5" />
              {t('institution_register.proceed_to_payment')}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="utility"
          onClick={handleBack}
          disabled={loading || isPaymentProcessing}
          className="w-full"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('institution_register.back')}
        </Button>
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
    <div className="min-h-screen bg-canvas-soft text-ink overflow-x-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-teal/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-canvas/80 border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-on-primary">𝑖</span>
            </div>
            <span className="text-xl font-bold text-ink">Presento</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center bg-surface border border-hairline px-3 py-1 rounded-md gap-2 text-sm font-medium text-ink hover:bg-canvas-soft transition-colors"
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
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface text-ink-faint border border-hairline'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="text-xs mt-2 text-center text-ink-faint hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        currentStep > step.number ? 'bg-primary' : 'bg-hairline'
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
            className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10"
          >
            <h2 className="text-3xl font-bold mb-2 text-ink">{steps[currentStep - 1].title}</h2>
            <p className="text-ink-muted mb-8">{t(`institution_register.step${currentStep}_description`)}</p>

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
