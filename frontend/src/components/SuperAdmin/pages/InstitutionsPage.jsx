import { motion } from 'framer-motion';
import InstitutionsList from '../Institutions/InstitutionsList';

const InstitutionsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <InstitutionsList />
    </motion.div>
  );
};

export default InstitutionsPage;

