import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Calendar, Building2, CreditCard, Presentation, Edit2 } from 'lucide-react';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import PlanManagementModal from '../common/PlanManagementModal';
import { getEffectivePlan, getEffectiveStatus } from '../../../utils/subscriptionUtils';

const UserDetailModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/super-admin/users/${user._id}`);
      if (response.data.success) {
        setUserDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdate = () => {
    fetchUserDetails();
    if (onUpdate) onUpdate();
    setShowPlanModal(false);
  };

  if (!isOpen) return null;

  const userData = userDetails?.user || user;

  // Get effective plan and status (checks expiry)
  // Pass user object to check for institution users (backend already calculates effective plan)
  const effectivePlan = getEffectivePlan(userData.subscription, userData);
  const effectiveStatus = getEffectiveStatus(userData.subscription);

  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: 'bg-canvas-soft text-ink-muted border-hairline',
      pro: 'bg-accent-sky/10 text-accent-sky border-accent-sky/20',
      lifetime: 'bg-accent-green/10 text-accent-green border-accent-green/20',
      institution: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20'
    };
    return colors[plan] || colors.free;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-accent-green/10 text-accent-green border-accent-green/20',
      expired: 'bg-red-50 text-red-600 border-red-200',
      cancelled: 'bg-canvas-soft text-ink-muted border-hairline'
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
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-[var(--shadow-level-2)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-hairline">
                  <div className="flex items-center gap-4">
                    {userData.photoURL ? (
                      <img
                        src={userData.photoURL}
                        alt={userData.displayName}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-accent-teal/10 flex items-center justify-center">
                        <span className="text-accent-teal text-2xl font-medium">
                          {userData.displayName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-ink">{userData.displayName}</h2>
                      <p className="text-ink-muted">{userData.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-canvas-soft rounded-md transition-colors"
                  >
                    <X className="w-5 h-5 text-ink-muted hover:text-ink" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      {/* Subscription Info */}
                      <div className="bg-surface border border-hairline rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-ink">Subscription Details</h3>
                          <button
                            onClick={() => setShowPlanModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 border border-hairline text-primary rounded-md hover:bg-canvas-soft transition-colors text-sm font-medium"
                          >
                            <Edit2 className="w-4 h-4" />
                            Update Plan
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-ink-muted mb-1">Plan</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPlanBadgeColor(effectivePlan)}`}>
                              {effectivePlan}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-ink-muted mb-1">Status</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(effectiveStatus)}`}>
                              {effectiveStatus}
                            </span>
                          </div>
                          {userData.subscription?.startDate && (
                            <div>
                              <p className="text-sm text-ink-muted mb-1">Start Date</p>
                              <p className="text-ink">
                                {new Date(userData.subscription.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {userData.subscription?.endDate && (
                            <div>
                              <p className="text-sm text-ink-muted mb-1">End Date</p>
                              <p className="text-ink">
                                {new Date(userData.subscription.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                        {userData.isInstitutionUser && userData.institutionId && (
                          <div className="mt-4 pt-4 border-t border-hairline">
                            <p className="text-sm text-ink-muted mb-1">Institution</p>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-accent-teal" />
                              <span className="text-accent-teal">
                                {typeof userData.institutionId === 'object'
                                  ? userData.institutionId.name
                                  : 'Institution User'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Account Info */}
                      <div className="bg-surface border border-hairline rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4 text-ink">Account Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-ink-muted mb-1">Email</p>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-ink-muted" />
                              <p className="text-ink">{userData.email}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-ink-muted mb-1">Joined</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-ink-muted" />
                              <p className="text-ink">
                                {new Date(userData.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Presentations */}
                      {userDetails?.presentations && userDetails.presentations.length > 0 && (
                        <div className="bg-surface border border-hairline rounded-lg p-5">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-ink">
                            <Presentation className="w-5 h-5 text-ink-muted" />
                            Recent Presentations
                          </h3>
                          <div className="space-y-2">
                            {userDetails.presentations.slice(0, 5).map((pres) => (
                              <div
                                key={pres._id}
                                className="flex items-center justify-between p-3 bg-canvas-soft rounded-md"
                              >
                                <div>
                                  <p className="font-medium text-ink">{pres.title}</p>
                                  <p className="text-sm text-ink-muted">
                                    {new Date(pres.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {pres.isLive && (
                                  <span className="px-2 py-1 bg-accent-green/10 text-accent-green rounded-full text-xs font-medium">
                                    Live
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment History */}
                      {userDetails?.payments && userDetails.payments.length > 0 && (
                        <div className="bg-surface border border-hairline rounded-lg p-5">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-ink">
                            <CreditCard className="w-5 h-5 text-ink-muted" />
                            Payment History
                          </h3>
                          <div className="space-y-2">
                            {userDetails.payments.slice(0, 5).map((payment) => (
                              <div
                                key={payment._id}
                                className="flex items-center justify-between p-3 bg-canvas-soft rounded-md"
                              >
                                <div>
                                  <p className="font-medium text-ink">
                                    {new Intl.NumberFormat('en-IN', {
                                      style: 'currency',
                                      currency: 'INR'
                                    }).format(payment.amount)}
                                  </p>
                                  <p className="text-sm text-ink-muted">
                                    {payment.plan} • {new Date(payment.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  payment.status === 'captured'
                                    ? 'bg-accent-green/10 text-accent-green'
                                    : 'bg-red-50 text-red-600'
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
          type="user"
          entityId={userData._id}
          currentPlan={userData.subscription}
          onUpdate={handlePlanUpdate}
        />
      )}
    </>
  );
};

export default UserDetailModal;

