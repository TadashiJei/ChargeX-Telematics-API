/**
 * Battery routes for the ChargeX Telematics API
 */
import express from 'express';
import batteryController from '../controllers/battery.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/batteries
 * @desc    Get all batteries with optional filtering
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorizeAdmin, batteryController.getAllBatteries);

/**
 * @route   GET /api/v1/batteries/:batteryId
 * @desc    Get a specific battery by ID
 * @access  Private (Admin)
 */
router.get('/:batteryId', authenticate, authorizeAdmin, batteryController.getBatteryById);

/**
 * @route   GET /api/v1/batteries/:batteryId/location/history
 * @desc    Get battery location history
 * @access  Private (Admin)
 */
router.get('/:batteryId/location/history', authenticate, authorizeAdmin, batteryController.getBatteryLocationHistory);

/**
 * @route   GET /api/v1/batteries/:batteryId/telemetry/history
 * @desc    Get battery telemetry history
 * @access  Private (Admin)
 */
router.get('/:batteryId/telemetry/history', authenticate, authorizeAdmin, batteryController.getBatteryTelemetryHistory);

export default router;
