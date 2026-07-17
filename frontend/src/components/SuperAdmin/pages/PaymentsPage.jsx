import { motion } from 'framer-motion';
import PaymentsList from '../Payments/PaymentsList';

const PaymentsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <PaymentsList />
    </motion.div>
  );
};

export default PaymentsPage;

