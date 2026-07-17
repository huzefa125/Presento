import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const TestimonialCard = ({ testimonial, index = 0 }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending Review';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all h-full flex flex-col relative"
    >
      {/* Status Badge - Only show if status is present (private view) */}
      {testimonial.status && (
        <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(testimonial.status)}`}>
          {getStatusLabel(testimonial.status)}
        </div>
      )}

      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= testimonial.rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-600'
              }`}
          />
        ))}
      </div>

      {/* Testimonial Text */}
      <p className="text-slate-300 mb-6 flex-1 line-clamp-4">
        "{testimonial.testimonial}"
      </p>

      {/* Author Info */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{getInitials(testimonial.name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{testimonial.name}</p>
          {testimonial.role && (
            <p className="text-sm text-slate-400 truncate">
              {testimonial.role}
              {testimonial.institution && ` • ${testimonial.institution}`}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;

