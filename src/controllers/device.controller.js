import Device from '../models/Device.js';
import logger from '../utils/logger.js';
import { socketIO } from '../server.js';
import { generateDeviceToken } from '../utils/auth.js';
import { cacheDeviceConfig } from '../services/cache.service.js';
import { registerDeviceOnBlockchain } from '../services/blockchain.service.js';
import { mockDevices, mockTelemetry, mockAlerts, mockBatteries } from '../utils/mockData.js';

const deviceController = {
  /**
   * Get all devices with optional filtering
   */
  async getAllDevices(req, res) {
    try {
      const { 
        type, 
        status, 
        batteryId, 
        limit = 100, 
        skip = 0,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        // Filter mock devices based on query parameters
        let filteredDevices = [...mockDevices];
        
        if (type) {
          filteredDevices = filteredDevices.filter(device => device.type === type);
        }
        
        if (status) {
          filteredDevices = filteredDevices.filter(device => device.status === status);
        }
        
        if (batteryId) {
          filteredDevices = filteredDevices.filter(device => device.batteryId === batteryId);
        }
        
        // Sort devices
        filteredDevices.sort((a, b) => {
          if (order === 'desc') {
            return a[sort] > b[sort] ? -1 : 1;
          } else {
            return a[sort] > b[sort] ? 1 : -1;
          }
        });
        
        // Apply pagination
        const paginatedDevices = filteredDevices.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
        
        return res.status(200).json({
          success: true,
          count: paginatedDevices.length,
          total: filteredDevices.length,
          data: paginatedDevices
        });
      } else {
        // Build query for database
        const query = {};
        
        if (type) {
          query.type = type;
        }
        
        if (status) {
          query['status.state'] = status;
        }
        
        if (batteryId) {
          query.batteryId = batteryId;
        }
        
        // Get total count for pagination
        const total = await Device.countDocuments(query);
        
        // Get devices
        const devices = await Device.find(query)
          .sort({ [sort]: order === 'asc' ? 1 : -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit));
        
        return res.status(200).json({
          success: true,
          count: devices.length,
          total,
          data: devices
        });
      }
    } catch (error) {
      logger.error('Error fetching devices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve devices',
        error: error.message
      });
    }
  },
  
  /**
   * Get a specific device by ID
   */
  async getDeviceById(req, res) {
    try {
      const { deviceId } = req.params;
      
      // Use mock data for development
      if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true') {
        const device = mockDevices.find(device => device._id === deviceId);
        
        if (!device) {
          return res.status(404).json({
            success: false,
            message: 'Device not found'
          });
        }
        
        // Get telemetry data for the device if available
        const telemetry = mockTelemetry[deviceId] || [];
        
        // Get alerts for the device
        const alerts = mockAlerts.filter(alert => alert.deviceId === deviceId);
        
        return res.status(200).json({
          success: true,
          data: {
            ...device,
            telemetry: telemetry.length > 0 ? telemetry[0] : null,
            alerts: {
              count: alerts.length,
              active: alerts.filter(a => a.status === 'active').length
            }
          }
        });
      } else {
        const device = await Device.findOne({ deviceId });
        
        if (!device) {
          return res.status(404).json({
            success: false,
            message: 'Device not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: device
        });
      }
    } catch (error) {
      logger.error(`Error fetching device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve device',
        error: error.message
      });
    }
  },
  
  /**
   * Register a new device
   */
  async registerDevice(req, res) {
    try {
      const deviceData = req.body;
      
      // Check if device already exists
      const existingDevice = await Device.findOne({ deviceId: deviceData.deviceId });
      
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          message: 'Device already exists'
        });
      }
      
      // Generate device token for authentication
      const deviceToken = generateDeviceToken(deviceData.deviceId);
      
      // Create new device
      const device = new Device({
        ...deviceData,
        auth: {
          token: deviceToken,
          lastAuthenticated: null
        },
        status: {
          state: 'registered',
          online: false,
          lastSeen: null,
          batteryLevel: deviceData.status?.batteryLevel || null,
          signalStrength: deviceData.status?.signalStrength || null
        }
      });
      
      // Save device to database
      await device.save();
      
      // Register device on blockchain if enabled
      let blockchainRegistration = null;
      if (process.env.BLOCKCHAIN_ENABLED === 'true') {
        blockchainRegistration = await registerDeviceOnBlockchain(device);
      }
      
      // Cache device configuration
      await cacheDeviceConfig(device.deviceId, device.config);
      
      // Emit device registration event
      socketIO.emit('device_registered', {
        deviceId: device.deviceId,
        type: device.type,
        batteryId: device.batteryId,
        timestamp: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: {
          ...device.toObject(),
          blockchainRegistration
        },
        token: deviceToken
      });
    } catch (error) {
      logger.error('Error registering device:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to register device',
        error: error.message
      });
    }
  },
  
  /**
   * Update a device
   */
  async updateDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const updateData = req.body;
      
      // Find device
      const device = await Device.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      // Remove sensitive fields from update data
      delete updateData.auth;
      
      // Update device
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId },
        { $set: updateData },
        { new: true }
      );
      
      // Update device config in cache if config was updated
      if (updateData.config) {
        await cacheDeviceConfig(deviceId, updateData.config);
      }
      
      // Emit device update event
      socketIO.to(`device:${deviceId}`).emit('device_updated', {
        deviceId,
        timestamp: new Date(),
        changes: Object.keys(updateData)
      });
      
      return res.status(200).json({
        success: true,
        message: 'Device updated successfully',
        data: updatedDevice
      });
    } catch (error) {
      logger.error(`Error updating device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update device',
        error: error.message
      });
    }
  },
  
  /**
   * Delete a device
   */
  async deleteDevice(req, res) {
    try {
      const { deviceId } = req.params;
      
      // Find and delete device
      const device = await Device.findOneAndDelete({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      // Emit device deletion event
      socketIO.emit('device_deleted', {
        deviceId,
        timestamp: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete device',
        error: error.message
      });
    }
  },
  
  /**
   * Get all devices associated with a battery
   */
  async getDevicesByBatteryId(req, res) {
    try {
      const { batteryId } = req.params;
      
      const devices = await Device.find({ batteryId });
      
      return res.status(200).json({
        success: true,
        count: devices.length,
        data: devices
      });
    } catch (error) {
      logger.error(`Error fetching devices for battery ${req.params.batteryId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve devices for battery',
        error: error.message
      });
    }
  },
  
  /**
   * Send a command to a device
   */
  async sendDeviceCommand(req, res) {
    try {
      const { deviceId } = req.params;
      const { command, parameters } = req.body;
      
      // Find device
      const device = await Device.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      // Check if device is online
      if (!device.status.online) {
        return res.status(400).json({
          success: false,
          message: 'Device is offline'
        });
      }
      
      // Generate command ID
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Store command in device history
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          $push: { 
            'commandHistory': {
              commandId,
              command,
              parameters,
              status: 'pending',
              sentAt: new Date(),
              sentBy: req.user.id
            } 
          } 
        }
      );
      
      // Emit command to device via Socket.IO
      socketIO.to(`device:${deviceId}`).emit('device_command', {
        commandId,
        deviceId,
        command,
        parameters,
        timestamp: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Command sent to device',
        commandId
      });
    } catch (error) {
      logger.error(`Error sending command to device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send command to device',
        error: error.message
      });
    }
  },
  
  /**
   * Get device configuration
   */
  async getDeviceConfig(req, res) {
    try {
      const { deviceId } = req.params;
      
      // Find device
      const device = await Device.findOne({ deviceId }, { config: 1 });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: device.config
      });
    } catch (error) {
      logger.error(`Error fetching config for device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve device configuration',
        error: error.message
      });
    }
  },
  
  /**
   * Update device configuration
   */
  async updateDeviceConfig(req, res) {
    try {
      const { deviceId } = req.params;
      const { config } = req.body;
      
      // Find device
      const device = await Device.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      // Update device config
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId },
        { $set: { config } },
        { new: true }
      );
      
      // Update device config in cache
      await cacheDeviceConfig(deviceId, config);
      
      // Emit config update event
      socketIO.to(`device:${deviceId}`).emit('config_updated', {
        deviceId,
        timestamp: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Device configuration updated',
        data: updatedDevice.config
      });
    } catch (error) {
      logger.error(`Error updating config for device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update device configuration',
        error: error.message
      });
    }
  },
  
  /**
   * Get device status (for IoT devices to check in)
   */
  async getDeviceStatus(req, res) {
    try {
      const { deviceId } = req.params;
      const deviceToken = req.headers['x-device-token'];
      
      // Find device
      const device = await Device.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      // Verify device token
      if (device.auth.token !== deviceToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid device token'
        });
      }
      
      // Update device last seen
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          'status.lastSeen': new Date(),
          'status.online': true,
          'auth.lastAuthenticated': new Date()
        }
      );
      
      // Get pending commands for device
      const pendingCommands = device.commandHistory
        .filter(cmd => cmd.status === 'pending')
        .map(cmd => ({
          commandId: cmd.commandId,
          command: cmd.command,
          parameters: cmd.parameters,
          sentAt: cmd.sentAt
        }));
      
      return res.status(200).json({
        success: true,
        deviceId,
        status: 'active',
        config: device.config,
        pendingCommands: pendingCommands.length > 0 ? pendingCommands : undefined,
        serverTime: new Date()
      });
    } catch (error) {
      logger.error(`Error getting status for device ${req.params.deviceId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get device status',
        error: error.message
      });
    }
  }
};

export default deviceController;
