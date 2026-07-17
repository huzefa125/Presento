import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import { Activity, Filter, RefreshCw, Download } from 'lucide-react';
import DataTable from '../common/DataTable';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from an actual activity log endpoint
      // For now, we'll simulate with sample data structure
      const sampleLogs = [
        {
          _id: '1',
          action: 'user_created',
          user: 'admin@example.com',
          target: 'user@example.com',
          details: 'New user registered',
          ipAddress: '192.168.1.1',
          timestamp: new Date().toISOString()
        },
        {
          _id: '2',
          action: 'plan_updated',
          user: 'admin@example.com',
          target: 'user@example.com',
          details: 'Plan updated from free to pro',
          ipAddress: '192.168.1.1',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: '3',
          action: 'payment_received',
          user: 'system',
          target: 'user@example.com',
          details: 'Payment of ₹999 received',
          ipAddress: '192.168.1.1',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setLogs(sampleLogs);
      setPagination({ page: 1, limit: 50, total: sampleLogs.length, pages: 1 });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
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

  const handleExport = () => {
    const headers = ['Timestamp', 'Action', 'User', 'Target', 'Details', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.user,
      log.target,
      log.details,
      log.ipAddress
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Activity logs exported successfully');
  };

  const getActionColor = (action) => {
    if (action.includes('created') || action.includes('received')) {
      return 'bg-accent-green/10 text-accent-green border-accent-green/30';
    }
    if (action.includes('updated') || action.includes('modified')) {
      return 'bg-accent-sky/10 text-accent-sky border-accent-sky/30';
    }
    if (action.includes('deleted') || action.includes('removed')) {
      return 'bg-accent-orange-deep/10 text-accent-orange-deep border-accent-orange-deep/30';
    }
    return 'bg-canvas-soft text-ink-muted border-hairline';
  };

  const formatAction = (action) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const columns = [
    { label: 'Timestamp' },
    { label: 'Action' },
    { label: 'User' },
    { label: 'Target' },
    { label: 'Details' },
    { label: 'IP Address' }
  ];

  const renderRow = (log) => (
    <>
      <td className="py-3 px-4 text-ink-muted text-sm">
        {new Date(log.timestamp).toLocaleString()}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs border ${getActionColor(log.action)}`}>
          {formatAction(log.action)}
        </span>
      </td>
      <td className="py-3 px-4 text-ink-secondary">{log.user}</td>
      <td className="py-3 px-4 text-ink-secondary">{log.target}</td>
      <td className="py-3 px-4 text-ink-secondary">{log.details}</td>
      <td className="py-3 px-4 text-ink-muted text-sm font-mono">{log.ipAddress}</td>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Activity Logs
          </h2>
          <p className="text-ink-muted text-sm mt-1">View all platform activity and admin actions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface text-ink border border-hairline rounded-md hover:bg-canvas-soft transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface text-ink border border-hairline rounded-md hover:bg-canvas-soft transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-lg p-4">
        <p className="text-accent-orange-deep text-sm">
          <strong>Note:</strong> Activity logging is currently in development. This is a preview of the activity log structure.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRow={renderRow}
        emptyMessage="No activity logs found"
      />
    </div>
  );
};

export default ActivityLogs;

