import express from 'express';
import deviceController from '../controllers/device.controller.js';
import { validateDeviceData } from '../middleware/validation.middleware.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route GET /api/v1/devices
 * @desc Get all devices with optional filtering
 * @access Private
 */
router.get(
  '/',
  authenticate,
  deviceController.getAllDevices
);

/**
 * @route GET /api/v1/devices/:deviceId
 * @desc Get a specific device by ID
 * @access Private
 */
router.get(
  '/:deviceId',
  authenticate,
  deviceController.getDeviceById
);

/**
 * @route POST /api/v1/devices
 * @desc Register a new device
 * @access Private (Admin)
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validateDeviceData,
  deviceController.registerDevice
);

/**
 * @route PUT /api/v1/devices/:deviceId
 * @desc Update a device
 * @access Private (Admin)
 */
router.put(
  '/:deviceId',
  authenticate,
  authorizeAdmin,
  validateDeviceData,
  deviceController.updateDevice
);

/**
 * @route DELETE /api/v1/devices/:deviceId
 * @desc Delete a device
 * @access Private (Admin)
 */
router.delete(
  '/:deviceId',
  authenticate,
  authorizeAdmin,
  deviceController.deleteDevice
);

/**
 * @route GET /api/v1/devices/battery/:batteryId
 * @desc Get all devices associated with a battery
 * @access Private
 */
router.get(
  '/battery/:batteryId',
  authenticate,
  deviceController.getDevicesByBatteryId
);

/**
 * @route POST /api/v1/devices/:deviceId/command
 * @desc Send a command to a device
 * @access Private
 */
router.post(
  '/:deviceId/command',
  authenticate,
  deviceController.sendDeviceCommand
);

/**
 * @route GET /api/v1/devices/:deviceId/config
 * @desc Get device configuration
 * @access Private
 */
router.get(
  '/:deviceId/config',
  authenticate,
  deviceController.getDeviceConfig
);

/**
 * @route PUT /api/v1/devices/:deviceId/config
 * @desc Update device configuration
 * @access Private (Admin)
 */
router.put(
  '/:deviceId/config',
  authenticate,
  authorizeAdmin,
  deviceController.updateDeviceConfig
);

/**
 * @route GET /api/v1/devices/:deviceId/status
 * @desc Get device status (for IoT devices to check in)
 * @access Public (with device token)
 */
router.get(
  '/:deviceId/status',
  deviceController.getDeviceStatus
);

export default router;
