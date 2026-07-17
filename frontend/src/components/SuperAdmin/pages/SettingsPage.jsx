import { motion } from 'framer-motion';
import SettingsPanel from '../Settings/SettingsPanel';

const SettingsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-canvas-soft min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8"
    >
      <SettingsPanel />
    </motion.div>
  );
};

export default SettingsPage;

