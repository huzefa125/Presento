import { motion } from 'framer-motion';
import UsersList from '../Users/UsersList';

const UsersPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <UsersList />
    </motion.div>
  );
};

export default UsersPage;

