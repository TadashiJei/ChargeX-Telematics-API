/**
 * Battery controller for managing battery data
 */
import logger from '../utils/logger.js';
import { socketIO } from '../server.js';
import { mockBatteries, mockTelemetry, mockAlerts, mockDevices } from '../utils/mockData.js';

const batteryController = {
  /**
   * Get all batteries with optional filtering
   */
  async getAllBatteries(req, res) {
    try {
      const { 
        status, 
        model,
        health,
        limit = 100, 
        skip = 0,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        // Filter mock batteries based on query parameters
        let filteredBatteries = [...mockBatteries];
        
        if (status) {
          filteredBatteries = filteredBatteries.filter(battery => battery.status === status);
        }
        
        if (model) {
          filteredBatteries = filteredBatteries.filter(battery => battery.model.includes(model));
        }
        
        if (health) {
          const healthValue = parseFloat(health);
          filteredBatteries = filteredBatteries.filter(battery => battery.health >= healthValue);
        }
        
        // Sort batteries
        filteredBatteries.sort((a, b) => {
          if (order === 'desc') {
            return a[sort] > b[sort] ? -1 : 1;
          } else {
            return a[sort] > b[sort] ? 1 : -1;
          }
        });
        
        // Apply pagination
        const paginatedBatteries = filteredBatteries.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
        
        return res.status(200).json({
          success: true,
          count: paginatedBatteries.length,
          total: filteredBatteries.length,
          data: paginatedBatteries
        });
      } else {
        // In production, we would query the database
        return res.status(501).json({
          success: false,
          message: 'Battery database functionality not implemented yet'
        });
      }
    } catch (error) {
      logger.error('Error fetching batteries:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve batteries',
        error: error.message
      });
    }
  },
  
  /**
   * Get a specific battery by ID
   */
  async getBatteryById(req, res) {
    try {
      const { batteryId } = req.params;
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        const battery = mockBatteries.find(battery => battery._id === batteryId);
        
        if (!battery) {
          return res.status(404).json({
            success: false,
            message: 'Battery not found'
          });
        }
        
        // Find devices associated with this battery
        const associatedDevices = mockDevices.filter(device => device.batteryId === batteryId);
        
        // Get telemetry data for the associated devices
        const telemetryData = [];
        associatedDevices.forEach(device => {
          if (mockTelemetry[device._id]) {
            telemetryData.push(...mockTelemetry[device._id]);
          }
        });
        
        // Get alerts for the associated devices
        const alerts = mockAlerts.filter(alert => 
          associatedDevices.some(device => device._id === alert.deviceId)
        );
        
        return res.status(200).json({
          success: true,
          data: {
            ...battery,
            devices: associatedDevices.map(d => ({ id: d._id, type: d.type, status: d.status })),
            telemetry: telemetryData.length > 0 ? telemetryData[0] : null,
            alerts: {
              count: alerts.length,
              active: alerts.filter(a => a.status === 'active').length
            },
            location: telemetryData.length > 0 ? {
              latitude: telemetryData[0].latitude,
              longitude: telemetryData[0].longitude
            } : null
          }
        });
      } else {
        // In production, we would query the database
        return res.status(501).json({
          success: false,
          message: 'Battery database functionality not implemented yet'
        });
      }
    } catch (error) {
      logger.error(`Error fetching battery ${req.params.batteryId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve battery',
        error: error.message
      });
    }
  },
  
  /**
   * Get battery location history
   */
  async getBatteryLocationHistory(req, res) {
    try {
      const { batteryId } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        const battery = mockBatteries.find(battery => battery._id === batteryId);
        
        if (!battery) {
          return res.status(404).json({
            success: false,
            message: 'Battery not found'
          });
        }
        
        // Find devices associated with this battery
        const associatedDevices = mockDevices.filter(device => device.batteryId === batteryId);
        
        // Get telemetry data for the associated devices
        let locationHistory = [];
        associatedDevices.forEach(device => {
          if (mockTelemetry[device._id]) {
            // Add device telemetry with location data
            const deviceLocations = mockTelemetry[device._id]
              .filter(entry => entry.latitude && entry.longitude)
              .map(entry => ({
                timestamp: entry.timestamp,
                latitude: entry.latitude,
                longitude: entry.longitude,
                deviceId: device._id,
                deviceType: device.type
              }));
            
            locationHistory.push(...deviceLocations);
          }
        });
        
        // Sort by timestamp (newest first)
        locationHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit
        locationHistory = locationHistory.slice(0, parseInt(limit));
        
        return res.status(200).json({
          success: true,
          count: locationHistory.length,
          data: locationHistory
        });
      } else {
        // In production, we would query the database
        return res.status(501).json({
          success: false,
          message: 'Battery location history functionality not implemented yet'
        });
      }
    } catch (error) {
      logger.error(`Error fetching battery location history for ${req.params.batteryId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve battery location history',
        error: error.message
      });
    }
  },
  
  /**
   * Get battery telemetry history
   */
  async getBatteryTelemetryHistory(req, res) {
    try {
      const { batteryId } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        const battery = mockBatteries.find(battery => battery._id === batteryId);
        
        if (!battery) {
          return res.status(404).json({
            success: false,
            message: 'Battery not found'
          });
        }
        
        // Find devices associated with this battery
        const associatedDevices = mockDevices.filter(device => device.batteryId === batteryId);
        
        // Get telemetry data for the associated devices
        let telemetryHistory = [];
        associatedDevices.forEach(device => {
          if (mockTelemetry[device._id]) {
            // Add device telemetry
            const deviceTelemetry = mockTelemetry[device._id].map(entry => ({
              ...entry,
              deviceId: device._id,
              deviceType: device.type
            }));
            
            telemetryHistory.push(...deviceTelemetry);
          }
        });
        
        // Sort by timestamp (newest first)
        telemetryHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit
        telemetryHistory = telemetryHistory.slice(0, parseInt(limit));
        
        return res.status(200).json({
          success: true,
          count: telemetryHistory.length,
          data: telemetryHistory
        });
      } else {
        // In production, we would query the database
        return res.status(501).json({
          success: false,
          message: 'Battery telemetry history functionality not implemented yet'
        });
      }
    } catch (error) {
      logger.error(`Error fetching battery telemetry history for ${req.params.batteryId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve battery telemetry history',
        error: error.message
      });
    }
  }
};

export default batteryController;
