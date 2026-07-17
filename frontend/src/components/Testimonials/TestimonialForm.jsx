import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Star, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TestimonialForm = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 0,
    testimonial: '',
    role: '',
    institution: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Disable background scrolling when modal is open
  useEffect(() => {
    // Store the original overflow value to restore it later
    const originalOverflow = document.body.style.overflow;
    
    // Disable scrolling on the background
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Auto-fill name and email when component mounts if user is logged in
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || currentUser.name || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('testimonials.form.name_required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('testimonials.form.name_min_length');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('testimonials.form.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('testimonials.form.email_invalid');
    }

    if (formData.rating === 0) {
      newErrors.rating = t('testimonials.form.rating_required');
    }

    if (!formData.testimonial.trim()) {
      newErrors.testimonial = t('testimonials.form.testimonial_required');
    } else if (formData.testimonial.trim().length < 50) {
      newErrors.testimonial = t('testimonials.form.testimonial_min_length');
    } else if (formData.testimonial.trim().length > 500) {
      newErrors.testimonial = t('testimonials.form.testimonial_max_length');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error(t('testimonials.form.validation_error'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/testimonials', formData);
      
      if (response.data.success) {
        toast.success(t('testimonials.form.submit_success_message'));
        setFormData({
          name: '',
          email: '',
          rating: 0,
          testimonial: '',
          role: '',
          institution: ''
        });
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('testimonials.form.submit_error');
      toast.error(errorMessage);
      
      // Set field-specific errors if provided
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          // Map express-validator error format to form field names
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

  const characterCount = formData.testimonial.length;
  const remainingChars = 500 - characterCount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {t('testimonials.form.title')}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('testimonials.form.rating')} <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-red-400 text-sm mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Name and Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('testimonials.form.name')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.name ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder={t('testimonials.form.name_placeholder')}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('testimonials.form.email')} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.email ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder={t('testimonials.form.email_placeholder')}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Role and Institution Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('testimonials.form.role')}
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={t('testimonials.form.role_placeholder')}
              />
            </div>

            {/* Institution (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('testimonials.form.institution')}
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={t('testimonials.form.institution_placeholder')}
              />
            </div>
          </div>

          {/* Testimonial */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('testimonials.form.testimonial')} <span className="text-red-400">*</span>
            </label>
            <textarea
              name="testimonial"
              value={formData.testimonial}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                errors.testimonial ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder={t('testimonials.form.testimonial_placeholder')}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.testimonial ? (
                <p className="text-red-400 text-sm">{errors.testimonial}</p>
              ) : (
                <p className="text-slate-500 text-sm">
                  {t('testimonials.form.testimonial_min_hint')}
                </p>
              )}
              <p className={`text-sm ${
                remainingChars < 50 ? 'text-yellow-400' : 'text-slate-500'
              }`}>
                {characterCount}/500
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                {t('testimonials.form.cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('testimonials.form.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t('testimonials.form.submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TestimonialForm;

