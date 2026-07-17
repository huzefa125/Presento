import { useState, useEffect } from 'react';
import api from '../../../config/api';
import DataTable from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import InstitutionDetailModal from './InstitutionDetailModal';
import toast from 'react-hot-toast';
import { Eye, Download } from 'lucide-react';
import { getEffectiveStatus } from '../../../utils/subscriptionUtils';

const InstitutionsList = ({ onInstitutionClick }) => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [filters, setFilters] = useState({});
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, [pagination.page, filters]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/super-admin/institutions', { params });
      if (response.data.success) {
        setInstitutions(response.data.data.institutions);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
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

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      expired: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      trial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[status] || colors.active;
  };

  const columns = [
    { label: 'Name' },
    { label: 'Email' },
    { label: 'Admin' },
    { label: 'Users' },
    { label: 'Status' },
    { label: 'Expires' },
    { label: 'Actions' }
  ];

  const renderRow = (institution) => (
    <>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {institution.logo?.url ? (
            <img
              src={institution.logo.url}
              alt={institution.name}
              className="w-8 h-8 rounded"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-teal-500/20 flex items-center justify-center">
              <span className="text-teal-400 text-sm font-medium">
                {institution.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium">{institution.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-gray-300">{institution.email}</td>
      <td className="py-3 px-4 text-gray-300">{institution.adminEmail}</td>
      <td className="py-3 px-4">
        <span className="text-gray-300">
          {institution.actualUserCount || 0} / {institution.subscription?.maxUsers || 0}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadgeColor(getEffectiveStatus(institution.subscription))}`}>
          {getEffectiveStatus(institution.subscription)}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {institution.subscription?.endDate
          ? new Date(institution.subscription.endDate).toLocaleDateString()
          : '-'}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => {
            setSelectedInstitution(institution);
            setIsModalOpen(true);
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4 text-teal-400" />
        </button>
      </td>
    </>
  );

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Email', 'Admin Email', 'Users', 'Status', 'Expires', 'Created'];
    const rows = institutions.map(inst => [
      inst.name,
      inst.email,
      inst.adminEmail,
      `${inst.actualUserCount || 0}/${inst.subscription?.maxUsers || 0}`,
      inst.subscription?.status || 'active',
      inst.subscription?.endDate ? new Date(inst.subscription.endDate).toLocaleDateString() : '-',
      new Date(inst.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `institutions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Institutions exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Institutions</h2>
          <p className="text-gray-400 text-sm mt-1">Total: {pagination.total} institutions</p>
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
        filters={{ search: '', status: '', dateFrom: '', dateTo: '' }}
        onFilterChange={handleFilterChange}
      />
      <DataTable
        columns={columns}
        data={institutions}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRow={renderRow}
        emptyMessage="No institutions found"
      />
      {selectedInstitution && (
        <InstitutionDetailModal
          institution={selectedInstitution}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInstitution(null);
          }}
          onUpdate={fetchInstitutions}
        />
      )}
    </div>
  );
};

export default InstitutionsList;

