import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import DataTable from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import StatCard from '../common/StatCard';
import toast from 'react-hot-toast';
import { MessageSquare, CheckCircle, XCircle, Clock, Star, Download, Edit, X } from 'lucide-react';

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ status: '' });
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    rating: 0,
    testimonial: '',
    role: '',
    institution: '',
    isFeatured: false
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTestimonials();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/testimonials/admin/all', { params });
      if (response.data.success) {
        setTestimonials(response.data.data.testimonials);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/testimonials/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit, total: pagination.total, pages: Math.ceil(pagination.total / newLimit) });
  };

  const handleApprove = async (id, isFeatured = false) => {
    try {
      const response = await api.put(`/testimonials/${id}/approve`, { isFeatured });
      if (response.data.success) {
        toast.success('Testimonial approved successfully');
        fetchTestimonials();
        fetchStats();
      }
    } catch (error) {
      console.error('Error approving testimonial:', error);
      toast.error('Failed to approve testimonial');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this testimonial?')) return;
    
    try {
      const response = await api.put(`/testimonials/${id}/reject`);
      if (response.data.success) {
        toast.success('Testimonial rejected successfully');
        fetchTestimonials();
        fetchStats();
      }
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      toast.error('Failed to reject testimonial');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) return;
    
    try {
      const response = await api.delete(`/testimonials/${id}`);
      if (response.data.success) {
        toast.success('Testimonial deleted successfully');
        fetchTestimonials();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial');
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setEditFormData({
      name: testimonial.name || '',
      rating: testimonial.rating || 0,
      testimonial: testimonial.testimonial || '',
      role: testimonial.role || '',
      institution: testimonial.institution || '',
      isFeatured: testimonial.isFeatured || false
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    setIsUpdating(true);
    try {
      const response = await api.put(`/testimonials/${editingTestimonial._id}`, editFormData);
      if (response.data.success) {
        toast.success('Testimonial updated successfully');
        setEditingTestimonial(null);
        fetchTestimonials();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to update testimonial');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTestimonial(null);
    setEditFormData({
      name: '',
      rating: 0,
      testimonial: '',
      role: '',
      institution: '',
      isFeatured: false
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-full">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-canvas-soft text-ink-muted border border-hairline rounded-full">Pending</span>;
    }
  };

  const columns = [
    { label: 'Name' },
    { label: 'Email' },
    { label: 'Rating' },
    { label: 'Testimonial' },
    { label: 'Status' },
    { label: 'Date' },
    { label: 'Actions' }
  ];

  const renderRow = (testimonial) => (
    <>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-sky flex items-center justify-center text-on-primary font-semibold text-sm">
            {testimonial.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink">{testimonial.name}</p>
            {testimonial.role && (
              <p className="text-xs text-ink-muted">{testimonial.role}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-ink-secondary text-sm">{testimonial.email}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent-orange text-accent-orange" />
          <span className="text-ink font-medium">{testimonial.rating}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-ink-secondary text-sm line-clamp-2 max-w-md">{testimonial.testimonial}</p>
      </td>
      <td className="py-3 px-4">
        {getStatusBadge(testimonial.status)}
        {testimonial.isFeatured && (
          <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full">Featured</span>
        )}
      </td>
      <td className="py-3 px-4 text-ink-muted text-sm">
        {new Date(testimonial.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(testimonial)}
            className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          {testimonial.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(testimonial._id)}
                className="p-2 hover:bg-accent-green/10 rounded-md transition-colors text-accent-green"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(testimonial._id)}
                className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {testimonial.status === 'approved' && (
            <button
              onClick={() => handleApprove(testimonial._id, !testimonial.isFeatured)}
              className={`p-2 rounded-md transition-colors ${
                testimonial.isFeatured
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-primary/10 text-primary'
              }`}
              title={testimonial.isFeatured ? "Unfeature" : "Feature"}
            >
              <Star className={`w-4 h-4 ${testimonial.isFeatured ? 'fill-primary' : ''}`} />
            </button>
          )}
          <button
            onClick={() => handleDelete(testimonial._id)}
            className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
            title="Delete"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </>
  );

  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 bg-canvas-soft min-h-full p-6"
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Testimonials"
            value={stats.total}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            icon={Star}
            color="teal"
            description={`${stats.approved} approved reviews`}
          />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        searchPlaceholder="Search testimonials..."
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={testimonials}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRow={renderRow}
        emptyMessage="No testimonials found"
      />

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTestimonial && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelEdit}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[var(--shadow-level-2)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-ink">Edit Testimonial</h2>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-surface border border-hairline rounded-xs text-ink focus:border-primary focus:shadow-[var(--shadow-level-1)] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      Rating <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, rating })}
                          className={`p-2 rounded-md transition-colors ${
                            editFormData.rating >= rating
                              ? 'text-accent-orange'
                              : 'text-ink-faint hover:text-ink-muted'
                          }`}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              editFormData.rating >= rating ? 'fill-accent-orange' : ''
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-ink-muted">{editFormData.rating}/5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      Testimonial <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={editFormData.testimonial}
                      onChange={(e) => setEditFormData({ ...editFormData, testimonial: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2 bg-surface border border-hairline rounded-xs text-ink focus:border-primary focus:shadow-[var(--shadow-level-1)] outline-none resize-none"
                      required
                      minLength={50}
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-ink-muted">
                      {editFormData.testimonial.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      Role (Optional)
                    </label>
                    <input
                      type="text"
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-4 py-2 bg-surface border border-hairline rounded-xs text-ink focus:border-primary focus:shadow-[var(--shadow-level-1)] outline-none"
                      placeholder="e.g., Student, Teacher, Business Professional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      Institution (Optional)
                    </label>
                    <input
                      type="text"
                      value={editFormData.institution}
                      onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                      className="w-full px-4 py-2 bg-surface border border-hairline rounded-xs text-ink focus:border-primary focus:shadow-[var(--shadow-level-1)] outline-none"
                      placeholder="Your school, company, or organization"
                    />
                  </div>

                  {editingTestimonial.status === 'approved' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={editFormData.isFeatured}
                        onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                        className="w-4 h-4 rounded bg-surface border-hairline text-primary focus:ring-2 focus:ring-primary"
                      />
                      <label htmlFor="isFeatured" className="text-sm font-medium text-ink-secondary">
                        Featured Testimonial
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary-active disabled:bg-primary/50 disabled:cursor-not-allowed text-on-primary font-medium rounded-full transition-colors"
                    >
                      {isUpdating ? 'Updating...' : 'Update Testimonial'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-surface border border-hairline hover:bg-canvas-soft text-ink-secondary font-medium rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TestimonialsPage;

