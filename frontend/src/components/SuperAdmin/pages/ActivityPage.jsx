import { motion } from 'framer-motion';
import ActivityLogs from '../Activity/ActivityLogs';

const ActivityPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <ActivityLogs />
    </motion.div>
  );
};

export default ActivityPage;

