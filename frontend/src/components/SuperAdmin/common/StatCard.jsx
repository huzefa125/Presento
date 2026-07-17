import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-accent-sky bg-accent-sky/10',
    teal: 'text-accent-teal bg-accent-teal/10',
    green: 'text-accent-green bg-accent-green/10',
    yellow: 'text-accent-orange bg-accent-orange/10',
    purple: 'text-accent-purple-deep bg-accent-purple/20',
    red: 'text-accent-pink bg-accent-pink/10',
    gray: 'text-ink-muted bg-canvas-soft'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-hairline p-6 rounded-lg hover:shadow-[var(--shadow-level-1)] transition-all duration-200 group"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-ink-muted text-sm font-medium">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-md ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-ink mb-1">{value || 0}</p>
      {subtitle && (
        <p className="text-sm text-ink-muted">{subtitle}</p>
      )}
    </motion.div>
  );
};

export default StatCard;

