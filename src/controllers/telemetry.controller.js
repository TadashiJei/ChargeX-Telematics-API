import Telemetry from '../models/Telemetry.js';
import Device from '../models/Device.js';
import logger from '../utils/logger.js';
import { socketIO } from '../server.js';
import { saveTimeseriesData } from '../services/timeseries.service.js';
import { checkAlertThresholds } from '../services/alert.service.js';
import { cacheLatestTelemetry } from '../services/cache.service.js';

const telemetryController = {
  /**
   * Submit telemetry data from a device
   */
  async submitTelemetry(req, res) {
    try {
      const telemetryData = req.body;
      
      // Create new telemetry record
      const telemetry = new Telemetry({
        ...telemetryData,
        timestamp: telemetryData.timestamp || new Date()
      });
      
      // Save to MongoDB
      await telemetry.save();
      
      // Update device status
      await Device.findOneAndUpdate(
        { deviceId: telemetryData.deviceId },
        { 
          'status.lastSeen': new Date(),
          'status.online': true,
          'status.batteryLevel': telemetryData.system?.batteryLevel,
          'status.signalStrength': telemetryData.system?.signalStrength,
          'location.coordinates': telemetryData.location?.coordinates,
          'location.altitude': telemetryData.location?.altitude,
          'location.accuracy': telemetryData.location?.accuracy,
          'location.lastUpdated': new Date()
        },
        { new: true }
      );
      
      // Save to time-series database for efficient querying
      await saveTimeseriesData(telemetryData);
      
      // Cache the latest telemetry data
      await cacheLatestTelemetry(telemetryData);
      
      // Check for alerts based on thresholds
      const alerts = await checkAlertThresholds(telemetryData);
      
      // Emit real-time update via Socket.IO
      socketIO.to(`device:${telemetryData.deviceId}`).emit('telemetry_update', {
        ...telemetryData,
        alerts
      });
      
      // Also emit to battery room for dashboard updates
      socketIO.to(`battery:${telemetryData.batteryId}`).emit('battery_update', {
        batteryId: telemetryData.batteryId,
        telemetry: {
          ...telemetryData.battery,
          location: telemetryData.location,
          timestamp: telemetryData.timestamp || new Date()
        }
      });
      
      return res.status(201).json({
        success: true,
        message: 'Telemetry data received',
        alerts: alerts.length > 0 ? alerts : undefined
      });
    } catch (error) {
      logger.error('Error submitting telemetry data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process telemetry data',
        error: error.message
      });
    }
  },
  
  /**
   * Submit batch telemetry data (multiple readings at once)
   */
  async submitBatchTelemetry(req, res) {
    try {
      const { telemetryBatch } = req.body;
      
      if (!Array.isArray(telemetryBatch) || telemetryBatch.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid batch data format'
        });
      }
      
      // Process each telemetry entry
      const telemetryDocs = telemetryBatch.map(entry => ({
        ...entry,
        timestamp: entry.timestamp || new Date()
      }));
      
      // Save all entries to MongoDB
      await Telemetry.insertMany(telemetryDocs);
      
      // Update device status with the most recent entry
      const latestEntry = telemetryBatch.reduce((latest, current) => {
        const latestTime = latest.timestamp ? new Date(latest.timestamp).getTime() : 0;
        const currentTime = current.timestamp ? new Date(current.timestamp).getTime() : 0;
        return currentTime > latestTime ? current : latest;
      }, {});
      
      await Device.findOneAndUpdate(
        { deviceId: latestEntry.deviceId },
        { 
          'status.lastSeen': new Date(),
          'status.online': true,
          'status.batteryLevel': latestEntry.system?.batteryLevel,
          'status.signalStrength': latestEntry.system?.signalStrength,
          'location.coordinates': latestEntry.location?.coordinates,
          'location.altitude': latestEntry.location?.altitude,
          'location.accuracy': latestEntry.location?.accuracy,
          'location.lastUpdated': new Date()
        },
        { new: true }
      );
      
      // Process each entry for time-series DB and alerts
      const processPromises = telemetryBatch.map(async entry => {
        await saveTimeseriesData(entry);
        return checkAlertThresholds(entry);
      });
      
      const alertResults = await Promise.all(processPromises);
      
      // Flatten alerts array and filter out empty arrays
      const allAlerts = alertResults.flat().filter(alert => alert);
      
      // Emit updates for the latest entry
      if (latestEntry.deviceId) {
        socketIO.to(`device:${latestEntry.deviceId}`).emit('telemetry_update', {
          ...latestEntry,
          alerts: allAlerts.filter(a => a.deviceId === latestEntry.deviceId)
        });
        
        if (latestEntry.batteryId) {
          socketIO.to(`battery:${latestEntry.batteryId}`).emit('battery_update', {
            batteryId: latestEntry.batteryId,
            telemetry: {
              ...latestEntry.battery,
              location: latestEntry.location,
              timestamp: latestEntry.timestamp || new Date()
            }
          });
        }
      }
      
      return res.status(201).json({
        success: true,
        message: `Processed ${telemetryBatch.length} telemetry entries`,
        alertCount: allAlerts.length
      });
    } catch (error) {
      logger.error('Error submitting batch telemetry data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process batch telemetry data',
        error: error.message
      });
    }
  },
  
  /**
   * Get telemetry data for a specific device
   */
  async getDeviceTelemetry(req, res) {
    try {
      const { deviceId } = req.params;
      const { limit = 100, skip = 0, startDate, endDate, sort = 'desc' } = req.query;
      
      // Build query
      const query = { deviceId };
      
      // Add date range if provided
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      // Get total count for pagination
      const total = await Telemetry.countDocuments(query);
      
      // Get telemetry data
      const telemetry = await Telemetry.find(query)
        .sort({ timestamp: sort === 'asc' ? 1 : -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));
      
      return res.status(200).json({
        success: true,
        count: telemetry.length,
        total,
        data: telemetry
      });
    } catch (error) {
      logger.error(`Error fetching telemetry for device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve telemetry data',
        error: error.message
      });
    }
  },
  
  /**
   * Get telemetry data for a specific battery
   */
  async getBatteryTelemetry(req, res) {
    try {
      const { batteryId } = req.params;
      const { limit = 100, skip = 0, startDate, endDate, sort = 'desc' } = req.query;
      
      // Build query
      const query = { batteryId };
      
      // Add date range if provided
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      // Get total count for pagination
      const total = await Telemetry.countDocuments(query);
      
      // Get telemetry data
      const telemetry = await Telemetry.find(query)
        .sort({ timestamp: sort === 'asc' ? 1 : -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));
      
      return res.status(200).json({
        success: true,
        count: telemetry.length,
        total,
        data: telemetry
      });
    } catch (error) {
      logger.error(`Error fetching telemetry for battery ${req.params.batteryId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve telemetry data',
        error: error.message
      });
    }
  },
  
  /**
   * Get latest telemetry data for all devices
   */
  async getLatestTelemetry(req, res) {
    try {
      // Get all unique device IDs
      const devices = await Device.find({}, { deviceId: 1, batteryId: 1 });
      
      // For each device, get the latest telemetry
      const latestTelemetryPromises = devices.map(async device => {
        const latest = await Telemetry.findOne({ deviceId: device.deviceId })
          .sort({ timestamp: -1 })
          .limit(1);
        
        return latest;
      });
      
      const latestTelemetry = await Promise.all(latestTelemetryPromises);
      
      // Filter out null values
      const filteredTelemetry = latestTelemetry.filter(item => item !== null);
      
      return res.status(200).json({
        success: true,
        count: filteredTelemetry.length,
        data: filteredTelemetry
      });
    } catch (error) {
      logger.error('Error fetching latest telemetry:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest telemetry data',
        error: error.message
      });
    }
  },
  
  /**
   * Get historical telemetry data with filtering
   */
  async getTelemetryHistory(req, res) {
    try {
      const { 
        deviceIds, 
        batteryIds, 
        startDate, 
        endDate, 
        metrics = ['battery.voltage.total', 'battery.current', 'battery.temperature.average', 'battery.soc'],
        interval = '1h',
        limit = 1000
      } = req.query;
      
      // Build query
      const query = {};
      
      // Add device or battery filters
      if (deviceIds) {
        query.deviceId = { $in: deviceIds.split(',') };
      }
      
      if (batteryIds) {
        query.batteryId = { $in: batteryIds.split(',') };
      }
      
      // Add date range
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      // This is a simplified version - in a real implementation,
      // you would use aggregation to get time-series data at the specified interval
      // For now, we'll just get the raw data
      
      const telemetry = await Telemetry.find(query)
        .sort({ timestamp: 1 })
        .limit(parseInt(limit));
      
      return res.status(200).json({
        success: true,
        count: telemetry.length,
        interval,
        metrics,
        data: telemetry
      });
    } catch (error) {
      logger.error('Error fetching telemetry history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve telemetry history',
        error: error.message
      });
    }
  },
  
  /**
   * Get aggregated telemetry statistics
   */
  async getTelemetryStats(req, res) {
    try {
      const { batteryId, deviceId, period = '24h' } = req.query;
      
      // Calculate the start date based on the period
      let startDate = new Date();
      switch (period) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '6h':
          startDate.setHours(startDate.getHours() - 6);
          break;
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setHours(startDate.getHours() - 24);
      }
      
      // Build query
      const query = {
        timestamp: { $gte: startDate }
      };
      
      if (batteryId) {
        query.batteryId = batteryId;
      }
      
      if (deviceId) {
        query.deviceId = deviceId;
      }
      
      // Perform aggregation to get statistics
      const stats = await Telemetry.aggregate([
        { $match: query },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          avgVoltage: { $avg: '$battery.voltage.total' },
          minVoltage: { $min: '$battery.voltage.total' },
          maxVoltage: { $max: '$battery.voltage.total' },
          avgCurrent: { $avg: '$battery.current' },
          minCurrent: { $min: '$battery.current' },
          maxCurrent: { $max: '$battery.current' },
          avgTemperature: { $avg: '$battery.temperature.average' },
          minTemperature: { $min: '$battery.temperature.average' },
          maxTemperature: { $max: '$battery.temperature.average' },
          avgSoc: { $avg: '$battery.soc' },
          minSoc: { $min: '$battery.soc' },
          maxSoc: { $max: '$battery.soc' },
          firstTimestamp: { $min: '$timestamp' },
          lastTimestamp: { $max: '$timestamp' }
        }}
      ]);
      
      return res.status(200).json({
        success: true,
        period,
        stats: stats.length > 0 ? stats[0] : null
      });
    } catch (error) {
      logger.error('Error fetching telemetry statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve telemetry statistics',
        error: error.message
      });
    }
  }
};

export default telemetryController;
