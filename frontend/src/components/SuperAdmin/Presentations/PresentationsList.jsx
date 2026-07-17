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
        <div className="font-medium">{presentation.title}</div>
      </td>
      <td className="py-3 px-4">
        <div>
          <div className="text-gray-300">{presentation.userId?.displayName || presentation.userId?.email || 'Unknown'}</div>
          {presentation.userId?.email && (
            <div className="text-xs text-gray-500">{presentation.userId.email}</div>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-teal-400">{presentation.accessCode}</span>
      </td>
      <td className="py-3 px-4">
        {presentation.isLive ? (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30">
            Live
          </span>
        ) : (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs border border-gray-500/30">
            Inactive
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {presentation.currentSlideIndex !== undefined ? presentation.currentSlideIndex + 1 : '-'}
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {new Date(presentation.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPresentation(presentation)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-teal-400" />
          </button>
          <button
            onClick={() => handleDelete(presentation._id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
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
          <h2 className="text-2xl font-bold">Presentations</h2>
          <p className="text-gray-400 text-sm mt-1">Total: {pagination.total} presentations</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors"
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-2xl w-full"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{presentation.title}</h2>
            <p className="text-gray-400 mt-1">Access Code: <span className="font-mono text-teal-400">{presentation.accessCode}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="text-gray-400 hover:text-white">✕</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Owner</p>
            <p className="text-white">{presentation.userId?.displayName || presentation.userId?.email || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status</p>
            {presentation.isLive ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                Live
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm border border-gray-500/30">
                Inactive
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Slide</p>
            <p className="text-white">{presentation.currentSlideIndex !== undefined ? presentation.currentSlideIndex + 1 : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Created</p>
            <p className="text-white">{new Date(presentation.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PresentationsList;

