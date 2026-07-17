import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../../../config/api';
import toast from 'react-hot-toast';

const PlanManagementModal = ({ isOpen, onClose, type, entityId, currentPlan, onUpdate }) => {
  const [formData, setFormData] = useState({
    plan: currentPlan?.plan || 'free',
    status: currentPlan?.status || 'active',
    startDate: currentPlan?.startDate 
      ? new Date(currentPlan.startDate).toISOString().split('T')[0]
      : '',
    endDate: currentPlan?.endDate 
      ? new Date(currentPlan.endDate).toISOString().split('T')[0]
      : ''
  });
  const [loading, setLoading] = useState(false);

  // Update form data when currentPlan changes or modal opens
  useEffect(() => {
    if (isOpen && currentPlan) {
      setFormData({
        plan: currentPlan?.plan || 'free',
        status: currentPlan?.status || 'active',
        startDate: currentPlan?.startDate 
          ? new Date(currentPlan.startDate).toISOString().split('T')[0]
          : '',
        endDate: currentPlan?.endDate 
          ? new Date(currentPlan.endDate).toISOString().split('T')[0]
          : ''
      });
    }
  }, [currentPlan, isOpen]);

  // Automatically update status when endDate changes
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    const newFormData = { ...formData, endDate: newEndDate };
    
    // If endDate is provided, automatically calculate status
    if (newEndDate) {
      const now = new Date();
      const endDateObj = new Date(newEndDate);
      // Set time to end of day for comparison
      endDateObj.setHours(23, 59, 59, 999);
      
      if (endDateObj < now) {
        newFormData.status = 'expired';
      } else {
        // Only auto-update to active if it was expired or cancelled
        // This prevents overriding an active status unnecessarily
        if (formData.status === 'expired' || formData.status === 'cancelled') {
          newFormData.status = 'active';
        }
      }
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = type === 'user' 
        ? `/super-admin/users/${entityId}/plan`
        : `/super-admin/institutions/${entityId}/plan`;

      const payload = {
        plan: formData.plan,
        status: formData.status
      };

      if (formData.startDate) {
        payload.startDate = formData.startDate;
      }

      if (formData.endDate) {
        payload.endDate = formData.endDate;
      }

      const response = await api.put(endpoint, payload);
      
      if (response.data.success) {
        toast.success(`${type === 'user' ? 'User' : 'Institution'} plan updated successfully`);
        if (onUpdate) onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-md w-full pointer-events-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Update Plan</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Plan
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    {type === 'user' ? (
                      <>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="lifetime">Lifetime</option>
                      </>
                    ) : (
                      <option value="institution">Institution</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {formData.plan !== 'lifetime' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={handleEndDateChange}
                        className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlanManagementModal;

