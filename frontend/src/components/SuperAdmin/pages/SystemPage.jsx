import { motion } from 'framer-motion';
import SystemHealth from '../System/SystemHealth';

const SystemPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <SystemHealth />
    </motion.div>
  );
};

export default SystemPage;

