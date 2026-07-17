import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    teal: 'text-teal-400 bg-teal-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
    gray: 'text-slate-400 bg-slate-500/10'
  };

  const borderClasses = {
    blue: 'border-blue-500/20',
    teal: 'border-teal-500/20',
    green: 'border-green-500/20',
    yellow: 'border-yellow-500/20',
    purple: 'border-purple-500/20',
    red: 'border-red-500/20',
    gray: 'border-slate-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-slate-700 hover:bg-slate-900/70 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]} border ${borderClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value || 0}</p>
      {subtitle && (
        <p className="text-sm text-slate-400">{subtitle}</p>
      )}
    </motion.div>
  );
};

export default StatCard;

