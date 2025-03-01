import logger from '../utils/logger.js';

/**
 * Validates telemetry data submitted by devices
 */
export const validateTelemetryData = (req, res, next) => {
  try {
    const telemetryData = req.body;
    
    // Required fields
    const requiredFields = ['deviceId', 'batteryId'];
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!telemetryData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Validate battery data if present
    if (telemetryData.battery) {
      // Validate battery voltage
      if (telemetryData.battery.voltage) {
        const { total, cells } = telemetryData.battery.voltage;
        
        // Validate total voltage (must be a number)
        if (total !== undefined && (isNaN(total) || total < 0)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid battery voltage'
          });
        }
        
        // Validate cell voltages if present
        if (cells && !Array.isArray(cells)) {
          return res.status(400).json({
            success: false,
            message: 'Cell voltages must be an array'
          });
        }
      }
      
      // Validate battery current (must be a number)
      if (telemetryData.battery.current !== undefined && isNaN(telemetryData.battery.current)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid battery current'
        });
      }
      
      // Validate battery temperature
      if (telemetryData.battery.temperature) {
        const { average, cells } = telemetryData.battery.temperature;
        
        // Validate average temperature (must be a number)
        if (average !== undefined && isNaN(average)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid battery temperature'
          });
        }
        
        // Validate cell temperatures if present
        if (cells && !Array.isArray(cells)) {
          return res.status(400).json({
            success: false,
            message: 'Cell temperatures must be an array'
          });
        }
      }
      
      // Validate battery SOC (must be a number between 0 and 100)
      if (telemetryData.battery.soc !== undefined && 
          (isNaN(telemetryData.battery.soc) || 
           telemetryData.battery.soc < 0 || 
           telemetryData.battery.soc > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid battery SOC (must be between 0 and 100)'
        });
      }
    }
    
    // Validate location data if present
    if (telemetryData.location) {
      const { coordinates } = telemetryData.location;
      
      // Validate coordinates (must be an array with 2 elements: [longitude, latitude])
      if (coordinates) {
        if (!Array.isArray(coordinates) || coordinates.length !== 2 || 
            isNaN(coordinates[0]) || isNaN(coordinates[1])) {
          return res.status(400).json({
            success: false,
            message: 'Invalid coordinates format (must be [longitude, latitude])'
          });
        }
        
        // Validate longitude (-180 to 180)
        if (coordinates[0] < -180 || coordinates[0] > 180) {
          return res.status(400).json({
            success: false,
            message: 'Invalid longitude (must be between -180 and 180)'
          });
        }
        
        // Validate latitude (-90 to 90)
        if (coordinates[1] < -90 || coordinates[1] > 90) {
          return res.status(400).json({
            success: false,
            message: 'Invalid latitude (must be between -90 and 90)'
          });
        }
      }
    }
    
    // If all validations pass, proceed to the next middleware
    next();
  } catch (error) {
    logger.error('Error validating telemetry data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating telemetry data',
      error: error.message
    });
  }
};

/**
 * Validates device data for registration and updates
 */
export const validateDeviceData = (req, res, next) => {
  try {
    const deviceData = req.body;
    
    // Required fields for device registration
    const requiredFields = ['deviceId', 'type', 'name'];
    
    // Only check required fields for new device registration (POST)
    if (req.method === 'POST') {
      for (const field of requiredFields) {
        if (!deviceData[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`
          });
        }
      }
    }
    
    // Validate device type if present
    if (deviceData.type && !['bms', 'gps', 'controller', 'gateway', 'sensor'].includes(deviceData.type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device type'
      });
    }
    
    // Validate firmware version format if present (semver format: x.y.z)
    if (deviceData.firmware && deviceData.firmware.version) {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      if (!semverRegex.test(deviceData.firmware.version)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid firmware version format (must be x.y.z)'
        });
      }
    }
    
    // Validate config if present
    if (deviceData.config) {
      // Validate telemetry interval (must be a positive number)
      if (deviceData.config.telemetryInterval !== undefined && 
          (isNaN(deviceData.config.telemetryInterval) || deviceData.config.telemetryInterval <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid telemetry interval (must be a positive number)'
        });
      }
      
      // Validate geofence if present
      if (deviceData.config.geofence) {
        const { enabled, radius, center } = deviceData.config.geofence;
        
        // Validate radius (must be a positive number)
        if (radius !== undefined && (isNaN(radius) || radius <= 0)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid geofence radius (must be a positive number)'
          });
        }
        
        // Validate center coordinates
        if (center && (!Array.isArray(center) || center.length !== 2 || 
                      isNaN(center[0]) || isNaN(center[1]))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid geofence center coordinates (must be [longitude, latitude])'
          });
        }
      }
    }
    
    // If all validations pass, proceed to the next middleware
    next();
  } catch (error) {
    logger.error('Error validating device data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating device data',
      error: error.message
    });
  }
};

/**
 * Validates alert data
 */
export const validateAlert = (req, res, next) => {
  try {
    const alertData = req.body;
    
    // Required fields
    const requiredFields = ['type', 'severity', 'message'];
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!alertData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Validate severity (must be one of: 'critical', 'warning', 'info')
    const validSeverities = ['critical', 'warning', 'info'];
    if (!validSeverities.includes(alertData.severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity: ${alertData.severity}. Must be one of: ${validSeverities.join(', ')}`
      });
    }
    
    // Validate deviceId or batteryId (at least one must be present)
    if (!alertData.deviceId && !alertData.batteryId) {
      return res.status(400).json({
        success: false,
        message: 'Either deviceId or batteryId must be provided'
      });
    }
    
    // If all validations pass, proceed to the next middleware
    next();
  } catch (error) {
    logger.error('Error validating alert data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating alert data',
      error: error.message
    });
  }
};
