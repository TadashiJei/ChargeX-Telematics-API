/**
 * Tracking routes for the ChargeX Telematics API
 */
import express from 'express';
import trackingController from '../controllers/tracking.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/tracking/geofence
 * @desc    Get all geofences
 * @access  Private (Admin)
 */
router.get('/geofence', authenticate, authorizeAdmin, trackingController.getAllGeofences);

/**
 * @route   GET /api/v1/tracking/geofences
 * @desc    Get all geofences (test route without auth for development)
 * @access  Public
 */
router.get('/geofences', trackingController.getAllGeofences);

/**
 * @route   GET /api/v1/tracking/geofence/:geofenceId
 * @desc    Get a specific geofence by ID
 * @access  Private (Admin)
 */
router.get('/geofence/:geofenceId', authenticate, authorizeAdmin, trackingController.getGeofenceById);

/**
 * @route   GET /api/v1/tracking/geofences/:geofenceId
 * @desc    Get a specific geofence by ID (test route without auth for development)
 * @access  Public
 */
router.get('/geofences/:geofenceId', trackingController.getGeofenceById);

/**
 * @route   POST /api/v1/tracking/geofence
 * @desc    Create a new geofence
 * @access  Private (Admin)
 */
router.post('/geofence', authenticate, authorizeAdmin, trackingController.createGeofence);

/**
 * @route   PUT /api/v1/tracking/geofence/:geofenceId
 * @desc    Update a geofence
 * @access  Private (Admin)
 */
router.put('/geofence/:geofenceId', authenticate, authorizeAdmin, trackingController.updateGeofence);

/**
 * @route   DELETE /api/v1/tracking/geofence/:geofenceId
 * @desc    Delete a geofence
 * @access  Private (Admin)
 */
router.delete('/geofence/:geofenceId', authenticate, authorizeAdmin, trackingController.deleteGeofence);

/**
 * @route   GET /api/v1/tracking/geofence/:geofenceId/batteries
 * @desc    Get all batteries within a geofence
 * @access  Private (Admin)
 */
router.get('/geofence/:geofenceId/batteries', authenticate, authorizeAdmin, trackingController.getBatteriesInGeofence);

/**
 * @route   GET /api/v1/tracking/geofences/:geofenceId/batteries
 * @desc    Get all batteries within a geofence (test route without auth for development)
 * @access  Public
 */
router.get('/geofences/:geofenceId/batteries', trackingController.getBatteriesInGeofence);

/**
 * @route   GET /api/v1/tracking/violations
 * @desc    Get geofence violations (batteries outside their assigned geofences)
 * @access  Private (Admin)
 */
router.get('/violations', authenticate, authorizeAdmin, trackingController.getGeofenceViolations);

/**
 * @route   GET /api/v1/tracking/geofence-violations
 * @desc    Get geofence violations (test route without auth for development)
 * @access  Public
 */
router.get('/geofence-violations', trackingController.getGeofenceViolations);

export default router;
