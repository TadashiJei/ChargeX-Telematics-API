import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import routes from './routes/index.js';
import testRoutes from './routes/test-routes.js';
import logger from './utils/logger.js';
import { initMqttClient } from './services/mqtt.service.js';
import { initBlockchainListener } from './services/blockchain.service.js';
import { initScheduledTasks } from './services/scheduler.service.js';
import { setupRedisClient } from './services/cache.service.js';
import { initInfluxDB } from './services/timeseries.service.js';
import errorHandler from './middleware/error.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://dashboard.chargex.io'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Apply security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://dashboard.chargex.io'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve Rivalz demo page
app.get('/rivalz-demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/rivalz-demo.html'));
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API routes
app.use('/api', routes);

// Test routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1', testRoutes);
  
  // Direct test routes for critical battery
  app.get('/api/v1/predictive/test/critical-battery/prediction', (req, res) => {
    console.log('Direct route: Returning critical test data for battery prediction');
    res.json({
      success: true,
      prediction: {
        batteryId: 'batt-critical-test',
        remainingUsefulLife: {
          days: 25,
          status: 'CRITICAL',
          confidence: 95
        },
        batteryHealth: {
          soh: 72.5,
          cycleCount: 550,
          temperature: 38.2
        },
        timestamp: new Date().toISOString(),
        nextMaintenanceDate: new Date(Date.now() + (25 * 24 * 60 * 60 * 1000)).toISOString()
      }
    });
  });
  
  app.get('/api/v1/predictive/test/critical-battery/recommendations', (req, res) => {
    console.log('Direct route: Returning critical test data for battery recommendations');
    res.json({
      success: true,
      batteryId: 'batt-critical-test',
      recommendations: [
        {
          priority: 'HIGH',
          action: 'REPLACE',
          description: 'Battery replacement recommended within 30 days',
          deadline: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
        },
        {
          priority: 'MEDIUM',
          action: 'COOLING',
          description: 'Battery temperature is high. Improve cooling or reduce load.',
          deadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
        },
        {
          priority: 'MEDIUM',
          action: 'MONITOR',
          description: 'Battery health below 80%. Increase monitoring frequency.',
          deadline: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString()
        }
      ],
      prediction: {
        days: 25,
        status: 'CRITICAL',
        confidence: 95
      },
      timestamp: new Date().toISOString()
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO setup for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', (deviceId) => {
    logger.info(`Client ${socket.id} subscribed to device: ${deviceId}`);
    socket.join(`device:${deviceId}`);
  });
  
  socket.on('unsubscribe', (deviceId) => {
    logger.info(`Client ${socket.id} unsubscribed from device: ${deviceId}`);
    socket.leave(`device:${deviceId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export socket.io instance for use in other modules
export const socketIO = io;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Initialize services after database connection
    const redisClient = setupRedisClient();
    if (redisClient) {
      logger.info('Redis client initialized');
    } else {
      logger.error('Redis initialization failed');
    }
    
    // Initialize InfluxDB if enabled
    if (process.env.ENABLE_INFLUXDB === 'true') {
      const influxDbInitialized = initInfluxDB();
      if (influxDbInitialized) {
        logger.info('InfluxDB client initialized');
      } else {
        logger.error('InfluxDB initialization failed');
      }
    } else {
      logger.info('InfluxDB integration is disabled');
    }
    
    if (process.env.MQTT_ENABLED === 'true') {
      initMqttClient()
        .then(() => logger.info('MQTT client initialized'))
        .catch(err => logger.error('MQTT initialization error:', err));
    } else {
      logger.info('MQTT client disabled');
    }
    
    if (process.env.ENABLE_BLOCKCHAIN_INTEGRATION === 'true') {
      initBlockchainListener()
        .then(() => logger.info('Blockchain listener initialized'))
        .catch(err => logger.error('Blockchain listener initialization error:', err));
    } else {
      logger.info('Blockchain integration disabled');
    }
    
    initScheduledTasks();
    
    // Start the server
    const PORT = process.env.PORT || 3030;
    server.listen(PORT, () => {
      logger.info(`ChargeX Telematics Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
