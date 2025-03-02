import express from 'express';
import { 
  registerDeviceOnBlockchain, 
  logTelemetryOnBlockchain, 
  getDeviceInfoFromBlockchain,
  getTelemetryLogFromBlockchain 
} from '../services/blockchain.service.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /blockchain/status
 * @description Get blockchain integration status
 * @access Public (for testing)
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
      providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545',
      deviceRegistryAddress: process.env.DEVICE_REGISTRY_CONTRACT_ADDRESS || 'Not configured',
      telemetryLogAddress: process.env.TELEMETRY_LOG_CONTRACT_ADDRESS || 'Not configured'
    };
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Error getting blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status'
    });
  }
});

/**
 * @route POST /blockchain/register-device
 * @description Register a device on the blockchain
 * @access Private (Admin)
 */
router.post('/register-device', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { deviceId, deviceType, batteryId } = req.body;
    
    if (!deviceId || !deviceType || !batteryId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, deviceType, batteryId'
      });
    }
    
    const device = {
      _id: deviceId,
      deviceType,
      batteryId
    };
    
    const result = await registerDeviceOnBlockchain(device);
    
    if (result) {
      res.json({
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
      message: error.message || 'Failed to register device on blockchain'
    });
  }
});

/**
 * @route POST /blockchain/log-telemetry
 * @description Log telemetry data on the blockchain
 * @access Private (Admin)
 */
router.post('/log-telemetry', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { deviceId, batteryId, data, timestamp } = req.body;
    
    if (!deviceId || !batteryId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, batteryId, data'
      });
    }
    
    const telemetryData = {
      deviceId,
      batteryId,
      ...data,
      timestamp: timestamp || Date.now()
    };
    
    const result = await logTelemetryOnBlockchain(telemetryData);
    
    if (result) {
      res.json({
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
    logger.error('Error logging telemetry on blockchain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to log telemetry data on blockchain'
    });
  }
});

/**
 * @route GET /blockchain/device/:deviceId
 * @description Get device information from the blockchain
 * @access Private (Admin)
 */
router.get('/device/:deviceId', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }
    
    const deviceInfo = await getDeviceInfoFromBlockchain(deviceId);
    
    if (deviceInfo) {
      res.json({
        success: true,
        deviceInfo
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Device information not found on blockchain'
      });
    }
  } catch (error) {
    logger.error('Error getting device info from blockchain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get device information from blockchain'
    });
  }
});

/**
 * @route GET /blockchain/telemetry/:deviceId/:index
 * @description Get telemetry log from the blockchain
 * @access Private (Admin)
 */
router.get('/telemetry/:deviceId/:index', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { deviceId, index } = req.params;
    
    if (!deviceId || isNaN(index)) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and valid index are required'
      });
    }
    
    const telemetryLog = await getTelemetryLogFromBlockchain(deviceId, parseInt(index));
    
    if (telemetryLog) {
      res.json({
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
    logger.error('Error getting telemetry log from blockchain:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get telemetry log from blockchain'
    });
  }
});

// Test routes (no authentication required)
if (process.env.NODE_ENV === 'development') {
  /**
   * @route POST /test/register-device
   * @description Test route to register a device on the blockchain
   * @access Public (for testing)
   */
  router.post('/test/register-device', async (req, res) => {
    try {
      const { deviceId, deviceType, batteryId } = req.body;
      
      if (!deviceId || !deviceType || !batteryId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: deviceId, deviceType, batteryId'
        });
      }
      
      const device = {
        _id: deviceId,
        deviceType,
        batteryId
      };
      
      const result = await registerDeviceOnBlockchain(device);
      
      if (result) {
        res.json({
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
        message: error.message || 'Failed to register device on blockchain'
      });
    }
  });
  
  /**
   * @route POST /test/log-telemetry
   * @description Test route to log telemetry data on the blockchain
   * @access Public (for testing)
   */
  router.post('/test/log-telemetry', async (req, res) => {
    try {
      const { deviceId, batteryId, data, timestamp } = req.body;
      
      if (!deviceId || !batteryId || !data) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: deviceId, batteryId, data'
        });
      }
      
      const telemetryData = {
        deviceId,
        batteryId,
        ...data,
        timestamp: timestamp || Date.now()
      };
      
      const result = await logTelemetryOnBlockchain(telemetryData);
      
      if (result) {
        res.json({
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
      logger.error('Error logging telemetry on blockchain:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to log telemetry data on blockchain'
      });
    }
  });
  
  /**
   * @route GET /test/device/:deviceId
   * @description Test route to get device information from the blockchain
   * @access Public (for testing)
   */
  router.get('/test/device/:deviceId', async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }
      
      const deviceInfo = await getDeviceInfoFromBlockchain(deviceId);
      
      if (deviceInfo) {
        res.json({
          success: true,
          deviceInfo
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Device information not found on blockchain'
        });
      }
    } catch (error) {
      logger.error('Error getting device info from blockchain:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get device information from blockchain'
      });
    }
  });
  
  /**
   * @route GET /test/telemetry/:deviceId/:index
   * @description Test route to get telemetry log from the blockchain
   * @access Public (for testing)
   */
  router.get('/test/telemetry/:deviceId/:index', async (req, res) => {
    try {
      const { deviceId, index } = req.params;
      
      if (!deviceId || isNaN(index)) {
        return res.status(400).json({
          success: false,
          message: 'Device ID and valid index are required'
        });
      }
      
      const telemetryLog = await getTelemetryLogFromBlockchain(deviceId, parseInt(index));
      
      if (telemetryLog) {
        res.json({
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
      logger.error('Error getting telemetry log from blockchain:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get telemetry log from blockchain'
      });
    }
  });
}

export default router;
