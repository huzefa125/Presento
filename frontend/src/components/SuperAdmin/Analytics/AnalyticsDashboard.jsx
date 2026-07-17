import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import StatCard from '../common/StatCard';
import { TrendingUp, DollarSign, Users, Building2 } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [growthTrends, setGrowthTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, paymentRes, growthRes] = await Promise.all([
        api.get('/super-admin/dashboard/stats'),
        api.get('/super-admin/payments/stats'),
        api.get(`/super-admin/analytics/growth?days=${timeRange}`)
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (paymentRes.data.success) {
        setPaymentStats(paymentRes.data.data);
      }
      if (growthRes.data.success) {
        setGrowthTrends(growthRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data
  const revenueByPlanData = paymentStats?.revenueByPlan
    ? Object.entries(paymentStats.revenueByPlan).map(([plan, data]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        revenue: data.revenue,
        count: data.count
      }))
    : [];

  const usersByPlanData = stats?.users?.byPlan
    ? Object.entries(stats.users.byPlan).map(([plan, count]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count
      }))
    : [];

  const COLORS = ['#62aef0', '#2a9d99', '#1aae39', '#dd5b00', '#ff64c8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Analytics & Reports</h2>
          <p className="text-ink-muted text-sm mt-1">Platform insights and metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-surface border border-hairline rounded-md text-ink focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(paymentStats?.totalRevenue || 0)}
          subtitle={`MRR: ${formatCurrency(paymentStats?.mrr || 0)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(paymentStats?.monthlyRevenue || 0)}
          subtitle={`ARPU: ${formatCurrency(paymentStats?.arpu || 0)}`}
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Total Users"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} active`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Institutions"
          value={stats?.institutions?.total || 0}
          subtitle={`${stats?.institutions?.active || 0} active`}
          icon={Building2}
          color="purple"
        />
      </div>

      {/* Growth Trends */}
      {growthTrends && (
        <div className="bg-surface border border-hairline rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-ink">Growth Trends (Last {timeRange} days)</h3>
          {growthTrends.users && growthTrends.users.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthTrends.users}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                <XAxis
                  dataKey="date"
                  stroke="#615d59"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#615d59" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e6e6e6',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#62aef0"
                  strokeWidth={2}
                  name="New Users"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-ink-muted">
              No growth data available
            </div>
          )}
        </div>
      )}

      {/* Revenue Growth */}
      {growthTrends?.revenue && growthTrends.revenue.length > 0 && (
        <div className="bg-surface border border-hairline rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-ink">Revenue Growth (Last {timeRange} days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthTrends.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
              <XAxis
                dataKey="date"
                stroke="#615d59"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#615d59"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e6e6e6',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2a9d99"
                strokeWidth={2}
                name="Daily Revenue"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-surface border border-hairline rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-ink">Revenue by Plan</h3>
          {revenueByPlanData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                <XAxis dataKey="name" stroke="#615d59" />
                <YAxis stroke="#615d59" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e6e6e6',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#2a9d99" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-ink-muted">
              No revenue data available
            </div>
          )}
        </div>

        {/* Users by Plan */}
        <div className="bg-surface border border-hairline rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-ink">Users by Plan</h3>
          {usersByPlanData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usersByPlanData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#62aef0"
                  dataKey="value"
                >
                  {usersByPlanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e6e6e6',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-ink-muted">
              No user data available
            </div>
          )}
        </div>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="bg-surface border border-hairline rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-ink">Payment Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-ink-muted mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-ink">{paymentStats.totalPayments || 0}</p>
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-1">Successful</p>
              <p className="text-2xl font-bold text-accent-green">
                {paymentStats.successfulPayments || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-1">Failed</p>
              <p className="text-2xl font-bold text-accent-orange-deep">
                {paymentStats.failedPayments || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-ink">
                {paymentStats.totalPayments > 0
                  ? Math.round((paymentStats.successfulPayments / paymentStats.totalPayments) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;

