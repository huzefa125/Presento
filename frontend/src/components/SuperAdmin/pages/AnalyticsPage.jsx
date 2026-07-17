import { motion } from 'framer-motion';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';

const AnalyticsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <AnalyticsDashboard />
    </motion.div>
  );
};

export default AnalyticsPage;

