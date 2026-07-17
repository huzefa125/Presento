import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import StatCard from '../common/StatCard';
import { 
  Users, 
  Building2, 
  DollarSign, 
  Presentation, 
  TrendingUp,
  UserCheck,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

const OverviewStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/super-admin/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users?.total || 0}
          subtitle={`${stats.users?.active || 0} active, ${stats.users?.new || 0} new this month`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Institutions"
          value={stats.institutions?.total || 0}
          subtitle={`${stats.institutions?.active || 0} active, ${stats.institutions?.new || 0} new this month`}
          icon={Building2}
          color="teal"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue?.total || 0)}
          subtitle={`${formatCurrency(stats.revenue?.monthly || 0)} this month`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Presentations"
          value={stats.presentations?.total || 0}
          subtitle={`${stats.presentations?.active || 0} live now`}
          icon={Presentation}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Free Users"
          value={stats.users?.byPlan?.free || 0}
          icon={Users}
          color="gray"
        />
        <StatCard
          title="Pro Users"
          value={stats.users?.byPlan?.pro || 0}
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Lifetime Users"
          value={stats.users?.byPlan?.lifetime || 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Institution Users"
          value={stats.users?.institutionUsers || 0}
          icon={Building}
          color="teal"
        />
      </div>
    </div>
  );
};

export default OverviewStats;

