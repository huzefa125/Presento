import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import DataTable from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import UserDetailModal from './UserDetailModal';
import toast from 'react-hot-toast';
import { Eye, Download, CheckSquare, Square } from 'lucide-react';
import { getEffectivePlan, getEffectiveStatus } from '../../../utils/subscriptionUtils';

const UsersList = ({ onUserClick }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [filters, setFilters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/super-admin/users', { params });
      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
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

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u._id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId, checked) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    try {
      const userIds = Array.from(selectedUsers);
      // In a real app, this would call a bulk update endpoint
      toast.success(`Bulk action "${bulkAction}" applied to ${userIds.length} users`);
      setSelectedUsers(new Set());
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const columns = [
    { label: '' },
    { label: 'Name' },
    { label: 'Email' },
    { label: 'Plan' },
    { label: 'Status' },
    { label: 'Institution' },
    { label: 'Joined' },
    { label: 'Actions' }
  ];

  const renderRow = (user) => {
    // Get effective plan and status (checks expiry)
    // Pass user object to check for institution users (backend already calculates effective plan)
    const effectivePlan = getEffectivePlan(user.subscription, user);
    const effectiveStatus = getEffectiveStatus(user.subscription);

    return (
      <>
        <td className="py-3 px-4">
          <input
            type="checkbox"
            checked={selectedUsers.has(user._id)}
            onChange={(e) => handleSelectUser(user._id, e.target.checked)}
            className="w-4 h-4 rounded border-hairline text-primary focus:ring-primary/30"
          />
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent-teal/10 flex items-center justify-center">
                <span className="text-accent-teal text-sm font-medium">
                  {user.displayName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium text-ink">{user.displayName}</span>
          </div>
        </td>
        <td className="py-3 px-4 text-ink-secondary">{user.email}</td>
        <td className="py-3 px-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPlanBadgeColor(effectivePlan)}`}>
            {effectivePlan}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(effectiveStatus)}`}>
            {effectiveStatus}
          </span>
        </td>
      <td className="py-3 px-4 text-ink-secondary">
        {user.institutionId ? (
          <span className="text-accent-teal">{user.institutionId.name || 'N/A'}</span>
        ) : (
          <span className="text-ink-faint">-</span>
        )}
      </td>
      <td className="py-3 px-4 text-ink-muted text-sm">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsModalOpen(true);
            }}
            className="p-2 hover:bg-canvas-soft rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-primary" />
          </button>
        </div>
      </td>
    </>
    );
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Email', 'Plan', 'Status', 'Institution', 'Joined'];
    const rows = users.map(user => [
      user.displayName,
      user.email,
      getEffectivePlan(user.subscription, user),
      getEffectiveStatus(user.subscription),
      user.institutionId?.name || '-',
      new Date(user.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Users</h2>
          <p className="text-ink-muted text-sm mt-1">Total: {pagination.total} users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface text-ink border border-hairline rounded-md hover:bg-canvas-soft transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-accent-teal/10 border border-accent-teal/20 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-accent-teal" />
              <span className="text-ink font-medium">
                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-4 py-2 bg-surface border border-hairline rounded-md text-ink text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                <option value="">Select action...</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-active transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-surface text-ink border border-hairline rounded-full hover:bg-canvas-soft transition-colors text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterBar
        filters={{ search: '', plan: '', status: '', dateFrom: '', dateTo: '' }}
        onFilterChange={handleFilterChange}
      />
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRow={renderRow}
        emptyMessage="No users found"
        limitOptions={[10, 15, 25, 50, 100]}
      />
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};

export default UsersList;

