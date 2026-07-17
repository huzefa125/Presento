import { useState, useEffect } from 'react';
import api from '../../../config/api';
import DataTable from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import toast from 'react-hot-toast';
import { Eye, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PresentationsList = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [filters, setFilters] = useState({});
  const [selectedPresentation, setSelectedPresentation] = useState(null);

  useEffect(() => {
    fetchPresentations();
  }, [pagination.page, pagination.limit, filters]);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/super-admin/presentations', { params });
      if (response.data.success) {
        setPresentations(response.data.data.presentations);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching presentations:', error);
      toast.error('Failed to load presentations');
    } finally {
      setLoading(false);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this presentation?')) return;

    try {
      await api.delete(`/presentations/${id}`);
      toast.success('Presentation deleted successfully');
      fetchPresentations();
    } catch (error) {
      console.error('Error deleting presentation:', error);
      toast.error('Failed to delete presentation');
    }
  };

  const handleExport = () => {
    const headers = ['Title', 'Owner', 'Access Code', 'Status', 'Created', 'Slides'];
    const rows = presentations.map(pres => [
      pres.title,
      pres.userId?.email || 'Unknown',
      pres.accessCode,
      pres.isLive ? 'Live' : 'Inactive',
      new Date(pres.createdAt).toLocaleDateString(),
      'N/A' // Could add slide count if available
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentations-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Presentations exported successfully');
  };

  const columns = [
    { label: 'Title' },
    { label: 'Owner' },
    { label: 'Access Code' },
    { label: 'Status' },
    { label: 'Current Slide' },
    { label: 'Created' },
    { label: 'Actions' }
  ];

  const renderRow = (presentation) => (
    <>
      <td className="py-3 px-4">
        <div className="font-medium text-ink">{presentation.title}</div>
      </td>
      <td className="py-3 px-4">
        <div>
          <div className="text-ink-secondary">{presentation.userId?.displayName || presentation.userId?.email || 'Unknown'}</div>
          {presentation.userId?.email && (
            <div className="text-xs text-ink-faint">{presentation.userId.email}</div>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-primary">{presentation.accessCode}</span>
      </td>
      <td className="py-3 px-4">
        {presentation.isLive ? (
          <span className="px-2 py-1 bg-accent-green/10 text-accent-green rounded-full text-xs border border-accent-green/30">
            Live
          </span>
        ) : (
          <span className="px-2 py-1 bg-canvas-soft text-ink-muted rounded-full text-xs border border-hairline">
            Inactive
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-ink-muted text-sm">
        {presentation.currentSlideIndex !== undefined ? presentation.currentSlideIndex + 1 : '-'}
      </td>
      <td className="py-3 px-4 text-ink-muted text-sm">
        {new Date(presentation.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPresentation(presentation)}
            className="p-2 hover:bg-canvas-soft rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => handleDelete(presentation._id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Presentations</h2>
          <p className="text-ink-muted text-sm mt-1">Total: {pagination.total} presentations</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-surface text-ink border border-hairline rounded-md hover:bg-canvas-soft transition-colors shadow-[var(--shadow-level-1)]"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <FilterBar
        filters={{ search: '', isLive: '', dateFrom: '', dateTo: '' }}
        onFilterChange={handleFilterChange}
      />

      <DataTable
        columns={columns}
        data={presentations}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRow={renderRow}
        emptyMessage="No presentations found"
        limitOptions={[10, 15, 25, 50, 100]}
      />

      {/* Presentation Detail Modal */}
      {selectedPresentation && (
        <PresentationDetailModal
          presentation={selectedPresentation}
          isOpen={!!selectedPresentation}
          onClose={() => setSelectedPresentation(null)}
        />
      )}
    </div>
  );
};

// Simple Presentation Detail Modal
const PresentationDetailModal = ({ presentation, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-xl p-6 max-w-2xl w-full shadow-[var(--shadow-level-2)]"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink">{presentation.title}</h2>
            <p className="text-ink-muted mt-1">Access Code: <span className="font-mono text-primary">{presentation.accessCode}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-canvas-soft rounded-lg transition-colors"
          >
            <span className="text-ink-muted hover:text-ink">✕</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-ink-muted mb-1">Owner</p>
            <p className="text-ink">{presentation.userId?.displayName || presentation.userId?.email || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted mb-1">Status</p>
            {presentation.isLive ? (
              <span className="px-3 py-1 bg-accent-green/10 text-accent-green rounded-full text-sm border border-accent-green/30">
                Live
              </span>
            ) : (
              <span className="px-3 py-1 bg-canvas-soft text-ink-muted rounded-full text-sm border border-hairline">
                Inactive
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-ink-muted mb-1">Current Slide</p>
            <p className="text-ink">{presentation.currentSlideIndex !== undefined ? presentation.currentSlideIndex + 1 : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted mb-1">Created</p>
            <p className="text-ink">{new Date(presentation.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PresentationsList;

