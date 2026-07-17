import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import { Activity, Database, Server, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import StatCard from '../common/StatCard';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [healthRes, perfRes] = await Promise.all([
        api.get('/super-admin/system/health'),
        api.get('/super-admin/system/performance')
      ]);

      if (healthRes.data.success) {
        setHealth(healthRes.data.data);
      }
      if (perfRes.data.success) {
        setPerformance(perfRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-gray-400 text-sm mt-1">Monitor system status and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/30 text-teal-500 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-400">Auto-refresh</span>
          </label>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Overall Status
            </h3>
            <span className={`text-2xl font-bold ${getStatusColor(health.status)}`}>
              {health.status.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* System Metrics */}
      {health?.system && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Memory Usage"
            value={`${health.system.memory.usagePercent}%`}
            subtitle={`${formatBytes(health.system.memory.used)} / ${formatBytes(health.system.memory.total)}`}
            icon={HardDrive}
            color={parseFloat(health.system.memory.usagePercent) > 80 ? 'red' : 'blue'}
          />
          <StatCard
            title="CPU Cores"
            value={health.system.cpu.count}
            subtitle={health.system.cpu.model}
            icon={Cpu}
            color="teal"
          />
          <StatCard
            title="Platform"
            value={health.system.platform}
            subtitle={`${health.system.arch} • Node ${health.system.nodeVersion}`}
            icon={Server}
            color="purple"
          />
          <StatCard
            title="Uptime"
            value={formatUptime(health.system.uptime)}
            subtitle="Process uptime"
            icon={Activity}
            color="green"
          />
        </div>
      )}

      {/* Database Health */}
      {health?.database && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Health
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Status</p>
              <p className={`font-medium ${
                health.database.connected ? 'text-green-400' : 'text-red-400'
              }`}>
                {health.database.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Collections</p>
              <p className="text-white font-medium">{health.database.collections}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Data Size</p>
              <p className="text-white font-medium">{formatBytes(health.database.dataSize)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Storage Size</p>
              <p className="text-white font-medium">{formatBytes(health.database.storageSize)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performance && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">Process Memory</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Heap Used</span>
                  <span className="text-white">{formatBytes(performance.process.memory.heapUsed)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Heap Total</span>
                  <span className="text-white">{formatBytes(performance.process.memory.heapTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">RSS</span>
                  <span className="text-white">{formatBytes(performance.process.memory.rss)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">System Load</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">1 min</span>
                  <span className="text-white">{performance.system.loadAverage[0].toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">5 min</span>
                  <span className="text-white">{performance.system.loadAverage[1].toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">15 min</span>
                  <span className="text-white">{performance.system.loadAverage[2].toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;

