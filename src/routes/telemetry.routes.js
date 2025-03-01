import express from 'express';
import telemetryController from '../controllers/telemetry.controller.js';
import { validateTelemetryData } from '../middleware/validation.middleware.js';
import { authenticate, authorizeDevice } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/v1/telemetry
 * @desc Submit telemetry data from device
 * @access Private (Device)
 */
router.post(
  '/',
  validateTelemetryData,
  authorizeDevice,
  telemetryController.submitTelemetry
);

/**
 * @route GET /api/v1/telemetry/device/:deviceId
 * @desc Get telemetry data for a specific device
 * @access Private
 */
router.get(
  '/device/:deviceId',
  authenticate,
  telemetryController.getDeviceTelemetry
);

/**
 * @route GET /api/v1/telemetry/battery/:batteryId
 * @desc Get telemetry data for a specific battery
 * @access Private
 */
router.get(
  '/battery/:batteryId',
  authenticate,
  telemetryController.getBatteryTelemetry
);

/**
 * @route GET /api/v1/telemetry/latest
 * @desc Get latest telemetry data for all devices
 * @access Private
 */
router.get(
  '/latest',
  authenticate,
  telemetryController.getLatestTelemetry
);

/**
 * @route GET /api/v1/telemetry/history
 * @desc Get historical telemetry data with filtering
 * @access Private
 */
router.get(
  '/history',
  authenticate,
  telemetryController.getTelemetryHistory
);

/**
 * @route POST /api/v1/telemetry/batch
 * @desc Submit batch telemetry data (multiple readings at once)
 * @access Private (Device)
 */
router.post(
  '/batch',
  authorizeDevice,
  telemetryController.submitBatchTelemetry
);

/**
 * @route GET /api/v1/telemetry/stats
 * @desc Get aggregated telemetry statistics
 * @access Private
 */
router.get(
  '/stats',
  authenticate,
  telemetryController.getTelemetryStats
);

export default router;
