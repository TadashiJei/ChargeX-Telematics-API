import express from 'express';
import deviceRoutes from './device.routes.js';
import telemetryRoutes from './telemetry.routes.js';
import alertRoutes from './alert.routes.js';
import configRoutes from './config.routes.js';
import authRoutes from './auth.routes.js';
import analyticsRoutes from './analytics.routes.js';
import batteryRoutes from './battery.routes.js';
import trackingRoutes from './tracking.routes.js';
import predictiveRoutes from './predictive.routes.js';
import blockchainRoutes from './blockchain.routes.js';
import rivalzRoutes from './rivalz.routes.js';
import energyTradingRoutes from './energy-trading.routes.js';

const router = express.Router();

// API version prefix
const API_PREFIX = '/v1';

// Routes
router.use(`${API_PREFIX}/devices`, deviceRoutes);
router.use(`${API_PREFIX}/telemetry`, telemetryRoutes);
router.use(`${API_PREFIX}/alerts`, alertRoutes);
router.use(`${API_PREFIX}/config`, configRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/analytics`, analyticsRoutes);
router.use(`${API_PREFIX}/batteries`, batteryRoutes);
router.use(`${API_PREFIX}/tracking`, trackingRoutes);
router.use(`${API_PREFIX}/predictive`, predictiveRoutes);
router.use(`${API_PREFIX}/blockchain`, blockchainRoutes);
router.use(`${API_PREFIX}/rivalz`, rivalzRoutes);
router.use(`${API_PREFIX}/energy-trading`, energyTradingRoutes);

// API documentation route
router.get(`${API_PREFIX}/docs`, (req, res) => {
  res.json({
    message: 'ChargeX Telematics API Documentation',
    version: '1.0.0',
    endpoints: {
      devices: `${API_PREFIX}/devices`,
      telemetry: `${API_PREFIX}/telemetry`,
      alerts: `${API_PREFIX}/alerts`,
      config: `${API_PREFIX}/config`,
      auth: `${API_PREFIX}/auth`,
      analytics: `${API_PREFIX}/analytics`,
      batteries: `${API_PREFIX}/batteries`,
      tracking: `${API_PREFIX}/tracking`,
      predictive: `${API_PREFIX}/predictive`,
      blockchain: `${API_PREFIX}/blockchain`,
      rivalz: `${API_PREFIX}/rivalz`,
      energyTrading: `${API_PREFIX}/energy-trading`
    }
  });
});

export default router;
