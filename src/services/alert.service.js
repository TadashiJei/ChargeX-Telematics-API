import Alert from '../models/Alert.js';
import Device from '../models/Device.js';
import logger from '../utils/logger.js';
import { socketIO } from '../server.js';
import { cacheAlert } from './cache.service.js';

/**
 * Check telemetry data against alert thresholds
 * @param {Object} telemetryData - Telemetry data
 * @returns {Promise<Array>} Generated alerts
 */
export const checkAlertThresholds = async (telemetryData) => {
  try {
    const { deviceId, batteryId, battery, system, location } = telemetryData;
    const alerts = [];
    
    // Get device to check configured thresholds
    const device = await Device.findOne({ deviceId });
    
    if (!device || !device.config || !device.config.alerts) {
      return alerts;
    }
    
    const { alerts: alertConfig } = device.config;
    
    // Check battery voltage
    if (battery && battery.voltage && alertConfig.voltage) {
      const { total } = battery.voltage;
      const { min, max } = alertConfig.voltage;
      
      if (min !== undefined && total < min) {
        const alert = await createAlert({
          type: 'battery_voltage_low',
          severity: 'warning',
          deviceId,
          batteryId,
          message: `Battery voltage (${total}V) below minimum threshold (${min}V)`,
          data: {
            current: total,
            threshold: min,
            unit: 'V'
          }
        });
        
        alerts.push(alert);
      }
      
      if (max !== undefined && total > max) {
        const alert = await createAlert({
          type: 'battery_voltage_high',
          severity: 'warning',
          deviceId,
          batteryId,
          message: `Battery voltage (${total}V) above maximum threshold (${max}V)`,
          data: {
            current: total,
            threshold: max,
            unit: 'V'
          }
        });
        
        alerts.push(alert);
      }
    }
    
    // Check battery temperature
    if (battery && battery.temperature && alertConfig.temperature) {
      const { average } = battery.temperature;
      const { min, max } = alertConfig.temperature;
      
      if (min !== undefined && average < min) {
        const alert = await createAlert({
          type: 'battery_temperature_low',
          severity: 'warning',
          deviceId,
          batteryId,
          message: `Battery temperature (${average}°C) below minimum threshold (${min}°C)`,
          data: {
            current: average,
            threshold: min,
            unit: '°C'
          }
        });
        
        alerts.push(alert);
      }
      
      if (max !== undefined && average > max) {
        const alert = await createAlert({
          type: 'battery_temperature_high',
          severity: alertConfig.temperature.criticalMax && average > alertConfig.temperature.criticalMax ? 'critical' : 'warning',
          deviceId,
          batteryId,
          message: `Battery temperature (${average}°C) above maximum threshold (${max}°C)`,
          data: {
            current: average,
            threshold: max,
            unit: '°C'
          }
        });
        
        alerts.push(alert);
      }
    }
    
    // Check battery SOC
    if (battery && battery.soc !== undefined && alertConfig.soc) {
      const { soc } = battery;
      const { min } = alertConfig.soc;
      
      if (min !== undefined && soc < min) {
        const alert = await createAlert({
          type: 'battery_soc_low',
          severity: alertConfig.soc.criticalMin && soc < alertConfig.soc.criticalMin ? 'critical' : 'warning',
          deviceId,
          batteryId,
          message: `Battery SOC (${soc}%) below minimum threshold (${min}%)`,
          data: {
            current: soc,
            threshold: min,
            unit: '%'
          }
        });
        
        alerts.push(alert);
      }
    }
    
    // Check device battery level
    if (system && system.batteryLevel !== undefined && alertConfig.deviceBattery) {
      const { batteryLevel } = system;
      const { min } = alertConfig.deviceBattery;
      
      if (min !== undefined && batteryLevel < min) {
        const alert = await createAlert({
          type: 'device_battery_low',
          severity: 'warning',
          deviceId,
          batteryId,
          message: `Device battery level (${batteryLevel}%) below minimum threshold (${min}%)`,
          data: {
            current: batteryLevel,
            threshold: min,
            unit: '%'
          }
        });
        
        alerts.push(alert);
      }
    }
    
    // Check signal strength
    if (system && system.signalStrength !== undefined && alertConfig.signalStrength) {
      const { signalStrength } = system;
      const { min } = alertConfig.signalStrength;
      
      if (min !== undefined && signalStrength < min) {
        const alert = await createAlert({
          type: 'signal_strength_low',
          severity: 'info',
          deviceId,
          batteryId,
          message: `Signal strength (${signalStrength}%) below minimum threshold (${min}%)`,
          data: {
            current: signalStrength,
            threshold: min,
            unit: '%'
          }
        });
        
        alerts.push(alert);
      }
    }
    
    // Check geofence if configured
    if (location && location.coordinates && device.config.geofence && device.config.geofence.enabled) {
      const { coordinates } = location;
      const { center, radius } = device.config.geofence;
      
      if (center && radius) {
        const distance = calculateDistance(
          coordinates[1], coordinates[0],
          center[1], center[0]
        );
        
        if (distance > radius) {
          const alert = await createAlert({
            type: 'geofence_violation',
            severity: 'warning',
            deviceId,
            batteryId,
            message: `Device outside geofence (${distance.toFixed(2)}m from center, radius: ${radius}m)`,
            data: {
              current: distance,
              threshold: radius,
              unit: 'm',
              coordinates,
              center
            }
          });
          
          alerts.push(alert);
        }
      }
    }
    
    return alerts;
  } catch (error) {
    logger.error('Error checking alert thresholds:', error);
    return [];
  }
};

/**
 * Create a new alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} Created alert
 */
export const createAlert = async (alertData) => {
  try {
    // Check if a similar active alert already exists
    const existingAlert = await Alert.findOne({
      type: alertData.type,
      deviceId: alertData.deviceId,
      status: 'active'
    });
    
    if (existingAlert) {
      // Update existing alert occurrence count
      const updatedAlert = await Alert.findByIdAndUpdate(
        existingAlert._id,
        {
          $inc: { occurrences: 1 },
          $set: {
            lastOccurrence: new Date(),
            data: alertData.data
          }
        },
        { new: true }
      );
      
      // Cache updated alert
      await cacheAlert(updatedAlert._id.toString(), updatedAlert);
      
      return updatedAlert;
    }
    
    // Create new alert
    const alert = new Alert({
      ...alertData,
      status: 'active',
      createdAt: new Date(),
      lastOccurrence: new Date(),
      occurrences: 1
    });
    
    await alert.save();
    
    // Cache alert
    await cacheAlert(alert._id.toString(), alert);
    
    // Emit alert event
    socketIO.emit('new_alert', {
      ...alert.toObject(),
      timestamp: new Date()
    });
    
    // Also emit to device and battery rooms
    if (alert.deviceId) {
      socketIO.to(`device:${alert.deviceId}`).emit('device_alert', {
        ...alert.toObject(),
        timestamp: new Date()
      });
    }
    
    if (alert.batteryId) {
      socketIO.to(`battery:${alert.batteryId}`).emit('battery_alert', {
        ...alert.toObject(),
        timestamp: new Date()
      });
    }
    
    return alert;
  } catch (error) {
    logger.error('Error creating alert:', error);
    throw new Error('Failed to create alert');
  }
};

/**
 * Resolve an alert
 * @param {String} alertId - Alert ID
 * @param {String} resolvedBy - User ID who resolved the alert
 * @param {String} resolution - Resolution notes
 * @returns {Promise<Object>} Resolved alert
 */
export const resolveAlert = async (alertId, resolvedBy, resolution) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
        resolution
      },
      { new: true }
    );
    
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    // Emit alert resolved event
    socketIO.emit('alert_resolved', {
      ...alert.toObject(),
      timestamp: new Date()
    });
    
    return alert;
  } catch (error) {
    logger.error(`Error resolving alert ${alertId}:`, error);
    throw new Error('Failed to resolve alert');
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  
  return d;
};

export default {
  checkAlertThresholds,
  createAlert,
  resolveAlert
};
