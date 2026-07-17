import { motion } from 'framer-motion';
import SettingsPanel from '../Settings/SettingsPanel';

const SettingsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <SettingsPanel />
    </motion.div>
  );
};

export default SettingsPage;

