const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const healthRoutes = require('../../../src/routes/healthRoutes');

// Create a test app
const app = express();
app.use(express.json());
app.use('/health', healthRoutes);

// Mock mongoose connection
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connection: {
      readyState: 1, // connected
      host: 'localhost',
      name: 'test-db'
    }
  };
});

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status when database is connected', async () => {
      mongoose.connection.readyState = 1; // connected

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('database');
      expect(response.body.database.connected).toBe(true);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return unhealthy status when database is disconnected', async () => {
      mongoose.connection.readyState = 0; // disconnected

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database.connected).toBe(false);
    });

    it('should include memory usage information', async () => {
      mongoose.connection.readyState = 1;

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
      expect(response.body.memory.unit).toBe('MB');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when database is connected', async () => {
      mongoose.connection.readyState = 1;

      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return not ready status when database is disconnected', async () => {
      mongoose.connection.readyState = 0;

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toBe('Database not connected');
    });
  });

  describe('GET /health/live', () => {
    it('should always return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

