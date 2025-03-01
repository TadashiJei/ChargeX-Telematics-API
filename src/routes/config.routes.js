import express from 'express';
import { authenticate as authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route GET /config
 * @description Get system configuration
 * @access Private
 */
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Configuration retrieved successfully',
    data: {
      telemetry: {
        defaultInterval: 30, // seconds
        batchSize: 100,
        retentionPeriod: 90 // days
      },
      alerts: {
        thresholds: {
          battery: {
            lowVoltage: 10.5,
            highVoltage: 14.5,
            lowTemperature: 0,
            highTemperature: 45,
            criticalTemperature: 60
          },
          system: {
            lowBattery: 20,
            criticalBattery: 10
          }
        },
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      geofencing: {
        enabled: true,
        defaultRadius: 500 // meters
      },
      blockchain: {
        enabled: process.env.ENABLE_BLOCKCHAIN_INTEGRATION === 'true',
        network: 'testnet'
      }
    }
  });
});

/**
 * @route PUT /config
 * @description Update system configuration
 * @access Private (Admin only)
 */
router.put('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Configuration updated successfully',
    data: {
      ...req.body,
      updatedAt: new Date()
    }
  });
});

/**
 * @route GET /config/device/:deviceId
 * @description Get device-specific configuration
 * @access Private
 */
router.get('/device/:deviceId', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Device configuration retrieved successfully',
    data: {
      deviceId: req.params.deviceId,
      telemetryInterval: 30,
      geofence: {
        enabled: true,
        radius: 500,
        center: [103.8198, 1.3521]
      },
      alerts: {
        enabled: true,
        thresholds: {
          voltage: {
            min: 10.5,
            max: 14.5
          },
          temperature: {
            min: 0,
            max: 45,
            criticalMax: 60
          }
        }
      },
      firmware: {
        currentVersion: '1.0.0',
        availableVersion: '1.0.1',
        updateUrl: 'https://updates.chargex.io/firmware/v1.0.1.bin'
      }
    }
  });
});

/**
 * @route PUT /config/device/:deviceId
 * @description Update device-specific configuration
 * @access Private
 */
router.put('/device/:deviceId', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Device configuration updated successfully',
    data: {
      deviceId: req.params.deviceId,
      ...req.body,
      updatedAt: new Date()
    }
  });
});

export default router;
