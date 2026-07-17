import { motion } from 'framer-motion';
import OverviewStats from '../Dashboard/OverviewStats';

const DashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <OverviewStats />
    </motion.div>
  );
};

export default DashboardPage;

