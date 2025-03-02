import logger from './logger.js';

/**
 * Mock blockchain provider for testing purposes
 * This simulates blockchain functionality without requiring an actual blockchain connection
 */
class MockBlockchainProvider {
  constructor() {
    this.devices = new Map();
    this.telemetryLogs = new Map();
    this.transactionCount = 0;
    logger.info('Mock blockchain provider initialized');
  }

  /**
   * Generate a mock transaction hash
   * @returns {string} Mock transaction hash
   */
  generateTransactionHash() {
    this.transactionCount++;
    const timestamp = Date.now();
    const randomPart = Math.random().toString(16).substring(2, 10);
    return `0x${timestamp.toString(16)}${randomPart}${this.transactionCount.toString(16).padStart(8, '0')}`;
  }

  /**
   * Register a device on the mock blockchain
   * @param {Object} device - Device object
   * @returns {Object} Transaction result
   */
  registerDevice(device) {
    try {
      if (!device || !device._id) {
        throw new Error('Invalid device data');
      }

      const deviceId = device._id;
      const registrationTime = Date.now();
      
      // Store device in the mock blockchain
      this.devices.set(deviceId, {
        id: this.devices.size + 1,
        deviceId,
        deviceType: device.deviceType || 'unknown',
        batteryId: device.batteryId || 'unknown',
        registrationTime
      });
      
      logger.info(`Device ${deviceId} registered on mock blockchain`);
      
      // Return mock transaction result
      return {
        transactionHash: this.generateTransactionHash(),
        blockNumber: 1000000 + this.transactionCount,
        status: true
      };
    } catch (error) {
      logger.error('Error registering device on mock blockchain:', error);
      throw error;
    }
  }

  /**
   * Log telemetry data on the mock blockchain
   * @param {Object} telemetryData - Telemetry data
   * @returns {Object} Transaction result
   */
  logTelemetry(telemetryData) {
    try {
      if (!telemetryData || !telemetryData.deviceId) {
        throw new Error('Invalid telemetry data');
      }

      const deviceId = telemetryData.deviceId;
      const timestamp = telemetryData.timestamp || Date.now();
      
      // Generate a mock data hash
      const dataHash = Buffer.from(JSON.stringify(telemetryData)).toString('base64');
      
      // Initialize telemetry logs for device if not exists
      if (!this.telemetryLogs.has(deviceId)) {
        this.telemetryLogs.set(deviceId, []);
      }
      
      // Add telemetry log
      const telemetryLog = {
        index: this.telemetryLogs.get(deviceId).length,
        batteryId: telemetryData.batteryId || 'unknown',
        dataHash,
        timestamp,
        data: telemetryData // Store the actual data for testing purposes
      };
      
      this.telemetryLogs.get(deviceId).push(telemetryLog);
      
      logger.info(`Telemetry data logged on mock blockchain for device ${deviceId}`);
      
      // Return mock transaction result
      return {
        transactionHash: this.generateTransactionHash(),
        blockNumber: 1000000 + this.transactionCount,
        status: true
      };
    } catch (error) {
      logger.error('Error logging telemetry on mock blockchain:', error);
      throw error;
    }
  }

  /**
   * Get device information from the mock blockchain
   * @param {string} deviceId - Device ID
   * @returns {Object} Device information
   */
  getDeviceInfo(deviceId) {
    try {
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      const device = this.devices.get(deviceId);
      
      if (!device) {
        logger.warn(`Device ${deviceId} not found on mock blockchain`);
        return null;
      }
      
      logger.info(`Retrieved device info for ${deviceId} from mock blockchain`);
      
      return device;
    } catch (error) {
      logger.error('Error getting device info from mock blockchain:', error);
      throw error;
    }
  }

  /**
   * Get telemetry log from the mock blockchain
   * @param {string} deviceId - Device ID
   * @param {number} index - Log index
   * @returns {Object} Telemetry log
   */
  getTelemetryLog(deviceId, index) {
    try {
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      if (isNaN(index)) {
        throw new Error('Valid index is required');
      }
      
      const deviceLogs = this.telemetryLogs.get(deviceId);
      
      if (!deviceLogs || deviceLogs.length <= index) {
        logger.warn(`Telemetry log at index ${index} not found for device ${deviceId}`);
        return null;
      }
      
      const telemetryLog = deviceLogs[index];
      
      logger.info(`Retrieved telemetry log at index ${index} for device ${deviceId}`);
      
      return telemetryLog;
    } catch (error) {
      logger.error('Error getting telemetry log from mock blockchain:', error);
      throw error;
    }
  }
}

// Create singleton instance
const mockBlockchainProvider = new MockBlockchainProvider();

export default mockBlockchainProvider;
