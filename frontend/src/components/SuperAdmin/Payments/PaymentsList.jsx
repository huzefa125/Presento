import { useState, useEffect } from 'react';
import api from '../../../config/api';
import DataTable from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import StatCard from '../common/StatCard';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, CheckCircle, XCircle, Download } from 'lucide-react';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [pagination.page, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/super-admin/payments', { params });
      if (response.data.success) {
        setPayments(response.data.data.payments);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await api.get('/super-admin/payments/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      captured: 'bg-green-500/20 text-green-400 border-green-500/30',
      created: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || colors.created;
  };

  const columns = [
    { label: 'Date' },
    { label: 'User/Institution' },
    { label: 'Plan' },
    { label: 'Amount' },
    { label: 'Status' },
    { label: 'Payment ID' }
  ];

  const renderRow = (payment) => (
    <>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {new Date(payment.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        {payment.userId ? (
          <div>
            <div className="text-gray-300">{payment.userId.email}</div>
            <div className="text-xs text-gray-500">User</div>
          </div>
        ) : payment.institutionId ? (
          <div>
            <div className="text-gray-300">{payment.institutionId.name}</div>
            <div className="text-xs text-gray-500">Institution</div>
          </div>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {payment.plan}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-300 font-medium">
        {formatCurrency(payment.amount)}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadgeColor(payment.status)}`}>
          {payment.status}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm font-mono">
        {payment.razorpayPaymentId || payment.razorpayOrderId || '-'}
      </td>
    </>
  );

  const handleExport = () => {
    const headers = ['Date', 'User/Institution', 'Plan', 'Amount', 'Status', 'Payment ID'];
    const rows = payments.map(payment => [
      new Date(payment.createdAt).toLocaleDateString(),
      payment.userId?.email || payment.institutionId?.name || '-',
      payment.plan,
      payment.amount,
      payment.status,
      payment.razorpayPaymentId || payment.razorpayOrderId || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Payments exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments & Revenue</h2>
          <p className="text-gray-400 text-sm mt-1">Total: {pagination.total} payments</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={TrendingUp}
            color="teal"
          />
          <StatCard
            title="MRR"
            value={formatCurrency(stats.mrr)}
            subtitle={`ARPU: ${formatCurrency(stats.arpu)}`}
            icon={CheckCircle}
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.totalPayments > 0 ? Math.round((stats.successfulPayments / stats.totalPayments) * 100) : 0}%`}
            subtitle={`${stats.successfulPayments} / ${stats.totalPayments}`}
            icon={XCircle}
            color="purple"
          />
        </div>
      )}

      <FilterBar
        filters={{ status: '', plan: '', dateFrom: '', dateTo: '' }}
        onFilterChange={handleFilterChange}
      />
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        renderRow={renderRow}
        emptyMessage="No payments found"
      />
    </div>
  );
};

export default PaymentsList;

