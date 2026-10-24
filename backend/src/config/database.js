const dns = require('dns');
const mongoose = require('mongoose');
const Logger = require('../utils/logger');

// Pointing Node at public resolvers avoids ECONNREFUSED on querySrv for local dev,
// but in production on Render/AWS, internal DNS resolvers are much faster.
if (process.env.NODE_ENV !== 'production' || process.env.OVERRIDE_DNS === 'true') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

// In production, avoid building indexes on startup to speed up boots
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentimeter-clone', {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    Logger.startup(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    Logger.error('MongoDB connection failed', error);
    process.exit(1);
  }
};

module.exports = connectDB;
