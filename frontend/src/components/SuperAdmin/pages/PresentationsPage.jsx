import { motion } from 'framer-motion';
import PresentationsList from '../Presentations/PresentationsList';

const PresentationsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <PresentationsList />
    </motion.div>
  );
};

export default PresentationsPage;

