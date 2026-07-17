import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, RefreshCw, Mail, Phone } from 'lucide-react';
import api from '../../config/api';

const Maintenance = () => {
  const [maintenanceMessage, setMaintenanceMessage] = useState('The system is currently under maintenance. Please check back later.');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkMaintenanceStatus();
    // Check every 30 seconds if maintenance is still active
    const interval = setInterval(checkMaintenanceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await api.get('/maintenance/status');
      if (response.data.success) {
        if (!response.data.maintenance) {
          // Maintenance mode is off, redirect to home
          window.location.href = '/';
          return;
        }
        if (response.data.message) {
          setMaintenanceMessage(response.data.message);
        }
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleRefresh = () => {
    setChecking(true);
    checkMaintenanceStatus();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center border border-blue-500/30">
            <Wrench className="w-12 h-12 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-teal-400 to-blue-400 bg-clip-text text-transparent"
        >
          Under Maintenance
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-300 mb-8 leading-relaxed"
        >
          {maintenanceMessage}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm"
        >
          <p className="text-sm text-gray-400 mb-4">We're working hard to improve your experience. The system will be back online shortly.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Again'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 space-y-2"
        >
          <p>Need immediate assistance?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:support@inavora.com"
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              support@inavora.com
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <a
              href="tel:+919043411110"
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Phone className="w-4 h-4" />
              +91 9043411110
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Maintenance;

