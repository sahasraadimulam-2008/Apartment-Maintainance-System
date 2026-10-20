const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @param {string} [customUri] - Optional custom URI (e.g. for testing)
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async (customUri) => {
  const uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg = 'CRITICAL: MONGODB_URI is not defined in environment variables. Database connection aborted.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production'
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[Database] MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB Disconnected successfully.');
  } catch (error) {
    console.error(`[Database] Error disconnecting MongoDB: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
