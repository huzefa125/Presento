import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../config/api';
import TestimonialCard from './TestimonialCard';
import TestimonialForm from './TestimonialForm';
import { Star, MessageSquare, Plus } from 'lucide-react';

const TestimonialsSection = ({ featured = false, limit = 6 }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        ...(featured && { featured: 'true' }),
        // Add cache-busting timestamp to prevent browser caching
        _t: Date.now()
      };
      const response = await api.get('/testimonials', { params });
      
      if (response.data.success) {
        setTestimonials(response.data.data.testimonials);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured, limit]);

  const handleFormSuccess = () => {
    // Refresh testimonials after successful submission
    setTimeout(() => {
      fetchTestimonials();
    }, 500);
  };

  // Don't show the section if there are no testimonials and we're showing featured ones
  if (!loading && featured && testimonials.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if no testimonials and it's a featured section
  if (testimonials.length === 0 && featured) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-4"
          >
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 font-medium">Testimonials</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
          >
            What Our Users Say
          </motion.h2>
          
          {stats.totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 text-slate-400"
            >
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-semibold text-white">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
              <span>•</span>
              <span>{stats.totalCount} Reviews</span>
            </motion.div>
          )}
        </div>

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial._id}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No testimonials yet. Be the first to share your experience!</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Share Your Experience
            </button>
          </div>
        )}
      </div>

      {/* Testimonial Form Modal */}
      {showForm && (
        <TestimonialForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </section>
  );
};

export default TestimonialsSection;

