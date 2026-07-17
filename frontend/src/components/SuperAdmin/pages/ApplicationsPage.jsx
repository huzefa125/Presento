import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../../utils/errorTranslator';
import { Eye, FileText, X } from 'lucide-react';
import Pagination from '../common/Pagination';

const ApplicationsPage = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, pagination.limit]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await api.get('/careers/applications', { params });
      if (response.data.success) {
        const data = response.data.data;
        setApplications(data.applications || data);
        // If backend returns pagination, use it; otherwise calculate
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          const total = Array.isArray(data) ? data.length : (data.applications?.length || 0);
          setPagination(prev => ({
            ...prev,
            total,
            pages: Math.ceil(total / prev.limit)
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit, total: pagination.total, pages: Math.ceil(pagination.total / newLimit) });
  };

  const handleUpdateApplicationStatus = async (id, status) => {
    try {
      await api.patch(`/careers/applications/${id}/status`, { status });
      toast.success(t('super_admin.application_status_updated'));
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('super_admin.update_status_error'));
    }
  };

  const handleDownloadResume = async (resumeUrl, fileName) => {
    try {
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(t('super_admin.resume_downloaded'));
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast.error(t('super_admin.download_resume_error'));
      window.open(resumeUrl, '_blank');
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-accent-green/10 text-accent-green border-accent-green/20';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-200';
      case 'shortlisted': return 'bg-accent-sky/10 text-accent-sky border-accent-sky/20';
      case 'interview': return 'bg-accent-purple/25 text-accent-purple-deep border-accent-purple/40';
      case 'reviewing': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      default: return 'bg-canvas-soft text-ink-muted border-hairline';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 bg-canvas-soft min-h-full p-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-ink">Job Applications</h2>
        <p className="text-ink-muted mt-1">Review and manage job applications</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && (
        <>
          <div className="space-y-4">
        {applications.map((app) => (
          <div key={app._id} className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 cursor-pointer" onClick={() => {
                setSelectedApplication(app);
                setIsApplicationModalOpen(true);
              }}>
                <h3 className="text-lg font-bold text-ink">{app.firstName} {app.lastName}</h3>
                <p className="text-ink-muted">{app.email}</p>
                <p className="text-sm text-ink-faint mt-1">{app.position} - {app.department}</p>
                <p className="text-xs text-ink-faint mt-1">
                  Applied: {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getApplicationStatusColor(app.status)} text-center sm:text-left`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
                <select
                  value={app.status}
                  onChange={(e) => handleUpdateApplicationStatus(app._id, e.target.value)}
                  className="px-4 py-2 bg-surface border border-hairline rounded-xs text-ink text-sm focus:border-primary focus:shadow-[var(--shadow-level-1)] outline-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApplication(app);
                  setIsApplicationModalOpen(true);
                }}
                className="text-primary hover:text-primary-active flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (app.resume?.url) {
                    handleDownloadResume(app.resume.url, app.resume.fileName);
                  }
                }}
                className="text-accent-teal hover:opacity-80 flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Resume
              </button>
            </div>
          </div>
        ))}
        {applications.length === 0 && (
          <div className="text-center py-12 text-ink-muted">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No applications yet</p>
          </div>
        )}
      </div>

      {pagination && pagination.pages > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          showLimitSelector={true}
        />
      )}
        </>
      )}

      {/* Application Details Modal */}
      <AnimatePresence>
        {isApplicationModalOpen && selectedApplication && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsApplicationModalOpen(false);
                setSelectedApplication(null);
              }}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-[var(--shadow-level-2)]"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-hairline">
                  <h2 className="text-2xl font-bold text-ink">Application Details</h2>
                  <button
                    onClick={() => {
                      setIsApplicationModalOpen(false);
                      setSelectedApplication(null);
                    }}
                    className="p-2 hover:bg-canvas-soft rounded-md"
                  >
                    <X className="w-5 h-5 text-ink-muted" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-ink">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-ink-muted mb-1">Name</p>
                        <p className="text-ink">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-ink-muted mb-1">Email</p>
                        <p className="text-ink">{selectedApplication.email}</p>
                      </div>
                    </div>
                  </div>
                  {selectedApplication.coverLetter && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-ink">Cover Letter</h3>
                      <div className="bg-canvas-soft border border-hairline rounded-lg p-4 max-h-60 overflow-y-auto">
                        <p className="text-ink-secondary whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ApplicationsPage;

