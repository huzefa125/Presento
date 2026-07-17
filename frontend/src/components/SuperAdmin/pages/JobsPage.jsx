import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../../utils/errorTranslator';
import { Plus, Edit2, Trash2, Briefcase, MapPin, Users, X, Save } from 'lucide-react';
import Pagination from '../common/Pagination';

const JobsPage = () => {
  const { t } = useTranslation();
  const [jobPostings, setJobPostings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: 'Remote / Chennai',
    type: 'Full-time',
    description: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    salaryRange: { min: '', max: '', currency: 'INR' },
    experienceLevel: 'Mid Level',
    status: 'draft',
    expiresAt: ''
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    fetchJobPostings();
  }, [pagination.page, pagination.limit]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await api.get('/job-postings', { params });
      if (response.data.success) {
        const data = response.data.data;
        setJobPostings(data.jobPostings || data);
        // If backend returns pagination, use it; otherwise calculate
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          const total = Array.isArray(data) ? data.length : (data.jobPostings?.length || 0);
          setPagination(prev => ({
            ...prev,
            total,
            pages: Math.ceil(total / prev.limit)
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast.error(t('super_admin.fetch_job_postings_error'));
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

  const handleOpenModal = (job = null) => {
    if (job) {
      setCurrentJob(job);
      setFormData({
        title: job.title || '',
        department: job.department || '',
        location: job.location || 'Remote / Chennai',
        type: job.type || 'Full-time',
        description: job.description || '',
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        salaryRange: job.salaryRange || { min: '', max: '', currency: 'INR' },
        experienceLevel: job.experienceLevel || 'Mid Level',
        status: job.status || 'draft',
        expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : ''
      });
    } else {
      setCurrentJob(null);
      setFormData({
        title: '',
        department: '',
        location: 'Remote / Chennai',
        type: 'Full-time',
        description: '',
        requirements: [],
        responsibilities: [],
        benefits: [],
        salaryRange: { min: '', max: '', currency: 'INR' },
        experienceLevel: 'Mid Level',
        status: 'draft',
        expiresAt: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentJob(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        salaryRange: {
          min: formData.salaryRange.min ? parseInt(formData.salaryRange.min) : null,
          max: formData.salaryRange.max ? parseInt(formData.salaryRange.max) : null,
          currency: formData.salaryRange.currency
        }
      };

      if (currentJob) {
        await api.put(`/job-postings/${currentJob._id}`, payload);
        toast.success(t('super_admin.job_posting_updated'));
      } else {
        await api.post('/job-postings', payload);
        toast.success(t('super_admin.job_posting_created'));
      }

      fetchJobPostings();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving job posting:', error);
      toast.error(translateError(error, t, 'super_admin.save_job_posting_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('super_admin.delete_job_confirm'))) return;

    try {
      await api.delete(`/job-postings/${id}`);
      toast.success(t('super_admin.job_posting_deleted'));
      fetchJobPostings();
    } catch (error) {
      console.error('Error deleting job posting:', error);
      toast.error(t('super_admin.delete_job_posting_error'));
    }
  };

  const addItem = (type, value) => {
    if (value.trim()) {
      const lines = value.split(/\r?\n/).filter(line => line.trim());
      const processedItems = lines.map(line => {
        let cleaned = line.trim()
          .replace(/^[•\-\*]\s*/, '')
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/^[○●▪▫]\s*/, '')
          .trim();
        return cleaned;
      }).filter(item => item.length > 0);

      if (processedItems.length > 0) {
        setFormData(prev => ({
          ...prev,
          [type]: [...prev[type], ...processedItems]
        }));
        if (type === 'requirements') setNewRequirement('');
        if (type === 'responsibilities') setNewResponsibility('');
        if (type === 'benefits') setNewBenefit('');
      }
    }
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'closed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Postings</h2>
          <p className="text-slate-400 mt-1">Manage job postings and applications</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Job Posting
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-4">
            {jobPostings.map((job) => (
          <div key={job._id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applicationCount || 0} applications
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
                <button
                  onClick={() => handleOpenModal(job)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(job._id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-slate-300 line-clamp-2">{job.description}</p>
          </div>
        ))}
            {jobPostings.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No job postings yet</p>
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

      {/* Job Posting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                    <h2 className="text-2xl font-bold">{currentJob ? 'Edit Job Posting' : 'Create Job Posting'}</h2>
                    <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-slate-800 rounded-lg">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Job Title *</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Senior Frontend Developer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Department *</label>
                        <input
                          type="text"
                          required
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Engineering"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Job description..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (currentJob ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default JobsPage;

