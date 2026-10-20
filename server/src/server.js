require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const aiService = require('./services/aiService');

const PORT = process.env.PORT || 5000;

let server;

// Connect to MongoDB and start HTTP listener
const startServer = async () => {
  try {
    console.log('--------------------------------------------------');
    console.log('Starting Apartment Maintenance System Backend...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('--------------------------------------------------');

    // Attempt MongoDB connection
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('⚠️  MONGODB_URI not set. Running in offline/unconnected mode.');
    }

    // Check AI configuration status
    const aiStatus = aiService.getStatus();
    if (aiStatus.configured) {
      console.log(`🤖 AI Engine: Configured (${aiStatus.provider} - ${aiStatus.model})`);
    } else {
      console.log('ℹ️  AI Engine: Not configured (AI_API_KEY missing). Application will start safely without AI.');
    }

    server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT} -> http://localhost:${PORT}`);
      console.log('--------------------------------------------------');
    });
  } catch (err) {
    console.error(`❌ Critical error during server startup: ${err.message}`);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // In production, keep running or shutdown cleanly
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
