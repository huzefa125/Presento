const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');
const os = require('os');

/**
 * Get System Health
 * @route GET /api/super-admin/system/health
 * @access Private (Super Admin)
 */
const getSystemHealth = asyncHandler(async (req, res, next) => {
  try {
    // Database health
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get database stats
    const dbStats = await mongoose.connection.db.stats().catch(() => null);

    // System info
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      }
    };

    // Database health
    const databaseHealth = {
      status: dbStates[dbState] || 'unknown',
      connected: dbState === 1,
      collections: dbStats?.collections || 0,
      dataSize: dbStats?.dataSize || 0,
      storageSize: dbStats?.storageSize || 0,
      indexes: dbStats?.indexes || 0
    };

    // Overall health status
    const isHealthy = databaseHealth.connected && parseFloat(systemInfo.memory.usagePercent) < 90;

    res.status(200).json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: databaseHealth,
        system: systemInfo
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
});

/**
 * Get Performance Metrics
 * @route GET /api/super-admin/system/performance
 * @access Private (Super Admin)
 */
const getPerformanceMetrics = asyncHandler(async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers
        },
        cpuUsage: process.cpuUsage()
      },
      system: {
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      }
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = {
  getSystemHealth,
  getPerformanceMetrics
};

