/**
 * Tracking controller for managing battery location tracking and geofencing
 */
import logger from '../utils/logger.js';
import { socketIO } from '../server.js';
import { mockBatteries, mockTelemetry, mockAlerts, mockDevices } from '../utils/mockData.js';

/**
 * Helper function to calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

/**
 * Helper function to check if a point is within a circle
 */
const isPointInCircle = (pointLat, pointLng, centerLat, centerLng, radiusInMeters) => {
  const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  return distance <= radiusInMeters;
};

// In-memory store for geofences (would be in database in production)
const geofences = [
  {
    id: 'geo-001',
    name: 'San Francisco Office',
    type: 'circle',
    center: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    radius: 500, // meters
    batteryIds: ['batt-001', 'batt-002'],
    createdAt: '2025-02-20T10:00:00Z',
    updatedAt: '2025-02-20T10:00:00Z'
  },
  {
    id: 'geo-002',
    name: 'Oakland Warehouse',
    type: 'circle',
    center: {
      latitude: 37.8044,
      longitude: -122.2711
    },
    radius: 1000, // meters
    batteryIds: ['batt-003', 'batt-004'],
    createdAt: '2025-02-21T11:00:00Z',
    updatedAt: '2025-02-21T11:00:00Z'
  }
];

const trackingController = {
  /**
   * Get all geofences
   */
  async getAllGeofences(req, res) {
    try {
      return res.status(200).json({
        success: true,
        count: geofences.length,
        data: geofences
      });
    } catch (error) {
      logger.error('Error fetching geofences:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve geofences',
        error: error.message
      });
    }
  },
  
  /**
   * Get a specific geofence by ID
   */
  async getGeofenceById(req, res) {
    try {
      const { geofenceId } = req.params;
      
      const geofence = geofences.find(g => g.id === geofenceId);
      
      if (!geofence) {
        return res.status(404).json({
          success: false,
          message: 'Geofence not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: geofence
      });
    } catch (error) {
      logger.error(`Error fetching geofence ${req.params.geofenceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve geofence',
        error: error.message
      });
    }
  },
  
  /**
   * Create a new geofence
   */
  async createGeofence(req, res) {
    try {
      const { name, type, center, radius, batteryIds } = req.body;
      
      // Validate required fields
      if (!name || !type || !center || !radius) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Validate geofence type
      if (type !== 'circle' && type !== 'polygon') {
        return res.status(400).json({
          success: false,
          message: 'Invalid geofence type. Must be "circle" or "polygon"'
        });
      }
      
      // Create new geofence
      const newGeofence = {
        id: `geo-${Date.now()}`,
        name,
        type,
        center,
        radius,
        batteryIds: batteryIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to in-memory store (would be saved to database in production)
      geofences.push(newGeofence);
      
      // Emit socket event for real-time updates
      socketIO.emit('geofence:created', newGeofence);
      
      return res.status(201).json({
        success: true,
        message: 'Geofence created successfully',
        data: newGeofence
      });
    } catch (error) {
      logger.error('Error creating geofence:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create geofence',
        error: error.message
      });
    }
  },
  
  /**
   * Update a geofence
   */
  async updateGeofence(req, res) {
    try {
      const { geofenceId } = req.params;
      const { name, type, center, radius, batteryIds } = req.body;
      
      // Find geofence
      const geofenceIndex = geofences.findIndex(g => g.id === geofenceId);
      
      if (geofenceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Geofence not found'
        });
      }
      
      // Update geofence
      const updatedGeofence = {
        ...geofences[geofenceIndex],
        name: name || geofences[geofenceIndex].name,
        type: type || geofences[geofenceIndex].type,
        center: center || geofences[geofenceIndex].center,
        radius: radius || geofences[geofenceIndex].radius,
        batteryIds: batteryIds || geofences[geofenceIndex].batteryIds,
        updatedAt: new Date().toISOString()
      };
      
      // Save updated geofence
      geofences[geofenceIndex] = updatedGeofence;
      
      // Emit socket event for real-time updates
      socketIO.emit('geofence:updated', updatedGeofence);
      
      return res.status(200).json({
        success: true,
        message: 'Geofence updated successfully',
        data: updatedGeofence
      });
    } catch (error) {
      logger.error(`Error updating geofence ${req.params.geofenceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update geofence',
        error: error.message
      });
    }
  },
  
  /**
   * Delete a geofence
   */
  async deleteGeofence(req, res) {
    try {
      const { geofenceId } = req.params;
      
      // Find geofence
      const geofenceIndex = geofences.findIndex(g => g.id === geofenceId);
      
      if (geofenceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Geofence not found'
        });
      }
      
      // Remove geofence
      const deletedGeofence = geofences.splice(geofenceIndex, 1)[0];
      
      // Emit socket event for real-time updates
      socketIO.emit('geofence:deleted', { id: geofenceId });
      
      return res.status(200).json({
        success: true,
        message: 'Geofence deleted successfully',
        data: deletedGeofence
      });
    } catch (error) {
      logger.error(`Error deleting geofence ${req.params.geofenceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete geofence',
        error: error.message
      });
    }
  },
  
  /**
   * Get all batteries within a geofence
   */
  async getBatteriesInGeofence(req, res) {
    try {
      const { geofenceId } = req.params;
      
      // Find geofence
      const geofence = geofences.find(g => g.id === geofenceId);
      
      if (!geofence) {
        return res.status(404).json({
          success: false,
          message: 'Geofence not found'
        });
      }
      
      // Get batteries in geofence
      const batteriesInGeofence = [];
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        // Check each battery's last known location
        for (const batteryId of geofence.batteryIds) {
          const battery = mockBatteries.find(b => b._id === batteryId);
          
          if (battery) {
            // Find devices associated with this battery
            const associatedDevices = mockDevices.filter(device => device.batteryId === batteryId);
            
            // Get latest telemetry with location data
            let latestTelemetry = null;
            
            for (const device of associatedDevices) {
              if (mockTelemetry[device._id] && mockTelemetry[device._id].length > 0) {
                const deviceTelemetry = mockTelemetry[device._id][0];
                
                if (deviceTelemetry.latitude && deviceTelemetry.longitude) {
                  latestTelemetry = {
                    ...deviceTelemetry,
                    deviceId: device._id,
                    deviceType: device.type
                  };
                  break;
                }
              }
            }
            
            if (latestTelemetry) {
              // Check if battery is within geofence
              const isInGeofence = isPointInCircle(
                latestTelemetry.latitude,
                latestTelemetry.longitude,
                geofence.center.latitude,
                geofence.center.longitude,
                geofence.radius
              );
              
              if (isInGeofence) {
                batteriesInGeofence.push({
                  ...battery,
                  location: {
                    latitude: latestTelemetry.latitude,
                    longitude: latestTelemetry.longitude
                  },
                  lastSeen: latestTelemetry.timestamp
                });
              }
            }
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        count: batteriesInGeofence.length,
        data: batteriesInGeofence
      });
    } catch (error) {
      logger.error(`Error fetching batteries in geofence ${req.params.geofenceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve batteries in geofence',
        error: error.message
      });
    }
  },
  
  /**
   * Get geofence violations (batteries outside their assigned geofences)
   */
  async getGeofenceViolations(req, res) {
    try {
      const violations = [];
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        // Check each geofence
        for (const geofence of geofences) {
          for (const batteryId of geofence.batteryIds) {
            const battery = mockBatteries.find(b => b._id === batteryId);
            
            if (battery) {
              // Find devices associated with this battery
              const associatedDevices = mockDevices.filter(device => device.batteryId === batteryId);
              
              // Get latest telemetry with location data
              let latestTelemetry = null;
              
              for (const device of associatedDevices) {
                if (mockTelemetry[device._id] && mockTelemetry[device._id].length > 0) {
                  const deviceTelemetry = mockTelemetry[device._id][0];
                  
                  if (deviceTelemetry.latitude && deviceTelemetry.longitude) {
                    latestTelemetry = {
                      ...deviceTelemetry,
                      deviceId: device._id,
                      deviceType: device.type
                    };
                    break;
                  }
                }
              }
              
              if (latestTelemetry) {
                // Check if battery is outside geofence
                const isInGeofence = isPointInCircle(
                  latestTelemetry.latitude,
                  latestTelemetry.longitude,
                  geofence.center.latitude,
                  geofence.center.longitude,
                  geofence.radius
                );
                
                if (!isInGeofence) {
                  violations.push({
                    batteryId: battery._id,
                    batteryName: battery.serialNumber,
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    location: {
                      latitude: latestTelemetry.latitude,
                      longitude: latestTelemetry.longitude
                    },
                    timestamp: latestTelemetry.timestamp,
                    distance: calculateDistance(
                      latestTelemetry.latitude,
                      latestTelemetry.longitude,
                      geofence.center.latitude,
                      geofence.center.longitude
                    )
                  });
                }
              }
            }
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        count: violations.length,
        data: violations
      });
    } catch (error) {
      logger.error('Error fetching geofence violations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve geofence violations',
        error: error.message
      });
    }
  },
  

};

export default trackingController;
