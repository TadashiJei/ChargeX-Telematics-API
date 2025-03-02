import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import logger from './utils/logger.js';
import mockBlockchainProvider from './utils/mock-blockchain.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock authentication middleware
const mockAuthenticate = (req, res, next) => {
  // Skip authentication for testing
  next();
};

// Mock authorization middleware
const mockAuthorizeAdmin = (req, res, next) => {
  // Skip authorization for testing
  next();
};

// Blockchain routes
app.post('/api/v1/blockchain/register-device', mockAuthenticate, mockAuthorizeAdmin, async (req, res) => {
  try {
    const device = req.body;
    logger.info(`Registering device ${device._id} on blockchain`);
    
    const result = await mockBlockchainProvider.registerDevice(device);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Device registered on blockchain successfully',
        transactionHash: result.transactionHash
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register device on blockchain'
      });
    }
  } catch (error) {
    logger.error('Error registering device on blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device on blockchain',
      error: error.message
    });
  }
});

app.post('/api/v1/blockchain/log-telemetry', mockAuthenticate, async (req, res) => {
  try {
    const telemetryData = req.body;
    logger.info(`Logging telemetry data for device ${telemetryData.deviceId} on blockchain`);
    
    const result = await mockBlockchainProvider.logTelemetry(telemetryData);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Telemetry data logged on blockchain successfully',
        transactionHash: result.transactionHash
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to log telemetry data on blockchain'
      });
    }
  } catch (error) {
    logger.error('Error logging telemetry data on blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging telemetry data on blockchain',
      error: error.message
    });
  }
});

app.get('/api/v1/blockchain/device-info/:deviceId', mockAuthenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    logger.info(`Retrieving device info for ${deviceId} from blockchain`);
    
    const deviceInfo = await mockBlockchainProvider.getDeviceInfo(deviceId);
    
    if (deviceInfo) {
      res.status(200).json({
        success: true,
        deviceInfo
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Device not found on blockchain'
      });
    }
  } catch (error) {
    logger.error('Error retrieving device info from blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving device info from blockchain',
      error: error.message
    });
  }
});

app.get('/api/v1/blockchain/telemetry-log/:deviceId/:index', mockAuthenticate, async (req, res) => {
  try {
    const { deviceId, index } = req.params;
    logger.info(`Retrieving telemetry log at index ${index} for device ${deviceId} from blockchain`);
    
    const telemetryLog = await mockBlockchainProvider.getTelemetryLog(deviceId, parseInt(index));
    
    if (telemetryLog) {
      res.status(200).json({
        success: true,
        telemetryLog
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Telemetry log not found on blockchain'
      });
    }
  } catch (error) {
    logger.error('Error retrieving telemetry log from blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving telemetry log from blockchain',
      error: error.message
    });
  }
});

// Serve static files from public directory
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  logger.info(`Blockchain test server running on port ${PORT}`);
});
