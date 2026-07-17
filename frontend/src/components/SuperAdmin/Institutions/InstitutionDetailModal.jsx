import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Calendar, Users, CreditCard, Building2, Edit2 } from 'lucide-react';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import PlanManagementModal from '../common/PlanManagementModal';
import { getEffectivePlan, getEffectiveStatus } from '../../../utils/subscriptionUtils';

const InstitutionDetailModal = ({ institution, isOpen, onClose, onUpdate }) => {
  const [institutionDetails, setInstitutionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (isOpen && institution?._id) {
      fetchInstitutionDetails();
    }
  }, [isOpen, institution]);

  const fetchInstitutionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/super-admin/institutions/${institution._id}`);
      if (response.data.success) {
        setInstitutionDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching institution details:', error);
      toast.error('Failed to load institution details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdate = () => {
    fetchInstitutionDetails();
    if (onUpdate) onUpdate();
    setShowPlanModal(false);
  };

  if (!isOpen) return null;

  const instData = institutionDetails?.institution || institution;

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      expired: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      trial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[status] || colors.active;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    {instData.logo?.url ? (
                      <img
                        src={instData.logo.url}
                        alt={instData.name}
                        className="w-16 h-16 rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-teal-500/20 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-teal-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">{instData.name}</h2>
                      <p className="text-gray-400">{instData.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      {/* Subscription Info */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Subscription Details</h3>
                          <button
                            onClick={() => setShowPlanModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Update Plan
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Status</p>
                            <span className={`px-3 py-1 rounded-full text-sm border ${getStatusBadgeColor(getEffectiveStatus(instData.subscription))}`}>
                              {getEffectiveStatus(instData.subscription)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Max Users</p>
                            <p className="text-white">{instData.subscription?.maxUsers || 0}</p>
                          </div>
                          {instData.subscription?.startDate && (
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Start Date</p>
                              <p className="text-white">
                                {new Date(instData.subscription.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {instData.subscription?.endDate && (
                            <div>
                              <p className="text-sm text-gray-400 mb-1">End Date</p>
                              <p className="text-white">
                                {new Date(instData.subscription.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Institution Info */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <h3 className="text-lg font-semibold mb-4">Institution Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Email</p>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <p className="text-white">{instData.email}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Admin Email</p>
                            <p className="text-white">{instData.adminEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Admin Name</p>
                            <p className="text-white">{instData.adminName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Created</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <p className="text-white">
                                {new Date(instData.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Users List */}
                      {institutionDetails?.users && institutionDetails.users.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Institution Users ({institutionDetails.users.length})
                          </h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {institutionDetails.users.map((user) => (
                              <div
                                key={user._id}
                                className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{user.displayName}</p>
                                  <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                  {getEffectivePlan(user.subscription)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment History */}
                      {institutionDetails?.payments && institutionDetails.payments.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment History
                          </h3>
                          <div className="space-y-2">
                            {institutionDetails.payments.slice(0, 5).map((payment) => (
                              <div
                                key={payment._id}
                                className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">
                                    {new Intl.NumberFormat('en-IN', {
                                      style: 'currency',
                                      currency: 'INR'
                                    }).format(payment.amount)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {payment.plan} • {new Date(payment.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  payment.status === 'captured' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {payment.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Plan Management Modal */}
      {showPlanModal && (
        <PlanManagementModal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          type="institution"
          entityId={instData._id}
          currentPlan={instData.subscription}
          onUpdate={handlePlanUpdate}
        />
      )}
    </>
  );
};

export default InstitutionDetailModal;

