const dns = require('dns');
const mongoose = require('mongoose');
const Logger = require('../utils/logger');

// Node's DNS resolver can fail SRV lookups (mongodb+srv://) against some
// VPN/corporate DNS servers even though the OS resolver works fine.
// Pointing Node at public resolvers avoids ECONNREFUSED on querySrv.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentimeter-clone', {
      // These options are no longer needed in Mongoose 6+
      // but included for compatibility
    });

    Logger.startup(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    Logger.error('MongoDB connection failed', error);
    process.exit(1);
  }
};

module.exports = connectDB;
