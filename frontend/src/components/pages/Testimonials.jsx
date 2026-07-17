import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import api from '../../config/api';
import TestimonialCard from '../Testimonials/TestimonialCard';
import TestimonialForm from '../Testimonials/TestimonialForm';
import { MessageSquare, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Testimonials = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [, setStats] = useState({ averageRating: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        // Add cache-busting timestamp to prevent browser caching
        _t: Date.now()
      };
      // Use the private endpoint to fetch only user's testimonials
      const response = await api.get('/testimonials/my', { params });

      if (response.data.success) {
        setTestimonials(response.data.data.testimonials);
        // Stats might not be returned by getMyTestimonials, handle gracefully
        if (response.data.data.stats) {
          setStats(response.data.data.stats);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      // Handle 401 specifically if needed, but api interceptor should handle it
      toast.error(t('testimonials.loading_error'));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, t]);

  useEffect(() => {
    fetchTestimonials();

    // Refetch when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTestimonials();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTestimonials]);


  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleFormSuccess = () => {
    fetchTestimonials();
    toast.success(t('testimonials.submit_success'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center border border-white/30 px-3 py-1 rounded-lg gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('testimonials.back')}</span>
            </button>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-4"
          >
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 font-medium">{t('testimonials.badge_text')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight"
          >
            {t('testimonials.page_title')}
          </motion.h1>


          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all text-lg"
          >
            <Plus className="w-6 h-6" />
            {t('testimonials.share_experience')}
          </motion.button>
        </div>


        {/* Testimonials Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : testimonials.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial._id}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('testimonials.previous')}
                </button>
                <span className="text-slate-400">
                  {t('testimonials.page_of', { current: pagination.page, total: pagination.pages })}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('testimonials.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 mx-auto mb-6 opacity-50 text-slate-400" />
            <h3 className="text-2xl font-bold mb-4">{t('testimonials.no_testimonials_title')}</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {t('testimonials.no_testimonials_description')}
            </p>
          </div>
        )}
      </main>

      {/* Testimonial Form Modal */}
      {showForm && (
        <TestimonialForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Testimonials;

