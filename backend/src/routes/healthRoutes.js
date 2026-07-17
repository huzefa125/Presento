const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Logger = require('../utils/logger');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server health status including database connection, memory usage, and uptime
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     seconds:
 *                       type: number
 *                     formatted:
 *                       type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     connected:
 *                       type: boolean
 *                 memory:
 *                   type: object
 *       503:
 *         description: Server is unhealthy
 */
const healthCheck = async (req, res) => {
  try {
    const startTime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const isDbConnected = dbState === 1;
    
    // Calculate uptime
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeFormatted = formatUptime(uptimeSeconds);
    
    // Memory usage in MB
    const memoryMB = {
      rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      external: (memoryUsage.external / 1024 / 1024).toFixed(2)
    };
    
    // Overall health status
    const isHealthy = isDbConnected;
    const status = isHealthy ? 'healthy' : 'unhealthy';
    
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: uptimeFormatted
      },
      database: {
        status: dbStates[dbState],
        connected: isDbConnected
      },
      memory: {
        ...memoryMB,
        unit: 'MB'
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    Logger.error('Health check error', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe endpoint
 *     description: Checks if the server is ready to accept traffic (for Kubernetes/Docker)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is ready
 *       503:
 *         description: Server is not ready
 */
const readinessCheck = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const isReady = dbState === 1;
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    Logger.error('Readiness check error', error);
    res.status(503).json({
      status: 'not ready',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe endpoint
 *     description: Checks if the server is alive (not crashed) (for Kubernetes/Docker)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is alive
 */
const livenessCheck = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

router.get('/', healthCheck);
router.get('/ready', readinessCheck);
router.get('/live', livenessCheck);

module.exports = router;

