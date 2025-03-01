import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Handle Redis connection events
redis.on('connect', () => {
  logger.info('Connected to Redis server');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

/**
 * Cache device configuration
 * @param {String} deviceId - Device ID
 * @param {Object} config - Device configuration
 * @returns {Promise<Boolean>} Success status
 */
export const cacheDeviceConfig = async (deviceId, config) => {
  try {
    const key = `device:${deviceId}:config`;
    await redis.set(key, JSON.stringify(config));
    
    // Set expiration (24 hours)
    await redis.expire(key, 86400);
    
    return true;
  } catch (error) {
    logger.error(`Error caching device config for ${deviceId}:`, error);
    return false;
  }
};

/**
 * Get cached device configuration
 * @param {String} deviceId - Device ID
 * @returns {Promise<Object|null>} Device configuration or null if not found
 */
export const getCachedDeviceConfig = async (deviceId) => {
  try {
    const key = `device:${deviceId}:config`;
    const config = await redis.get(key);
    
    if (!config) {
      return null;
    }
    
    return JSON.parse(config);
  } catch (error) {
    logger.error(`Error getting cached device config for ${deviceId}:`, error);
    return null;
  }
};

/**
 * Cache latest telemetry data
 * @param {Object} telemetryData - Telemetry data
 * @returns {Promise<Boolean>} Success status
 */
export const cacheLatestTelemetry = async (telemetryData) => {
  try {
    const { deviceId, batteryId } = telemetryData;
    
    // Cache by device ID
    if (deviceId) {
      const deviceKey = `device:${deviceId}:latest_telemetry`;
      await redis.set(deviceKey, JSON.stringify(telemetryData));
      
      // Set expiration (1 hour)
      await redis.expire(deviceKey, 3600);
    }
    
    // Cache by battery ID
    if (batteryId) {
      const batteryKey = `battery:${batteryId}:latest_telemetry`;
      await redis.set(batteryKey, JSON.stringify(telemetryData));
      
      // Set expiration (1 hour)
      await redis.expire(batteryKey, 3600);
    }
    
    return true;
  } catch (error) {
    logger.error('Error caching latest telemetry data:', error);
    return false;
  }
};

/**
 * Get cached latest telemetry data
 * @param {String} id - Device ID or Battery ID
 * @param {String} type - Type of ID ('device' or 'battery')
 * @returns {Promise<Object|null>} Latest telemetry data or null if not found
 */
export const getCachedLatestTelemetry = async (id, type = 'device') => {
  try {
    const key = `${type}:${id}:latest_telemetry`;
    const telemetry = await redis.get(key);
    
    if (!telemetry) {
      return null;
    }
    
    return JSON.parse(telemetry);
  } catch (error) {
    logger.error(`Error getting cached telemetry for ${type} ${id}:`, error);
    return null;
  }
};

/**
 * Cache alert data
 * @param {String} alertId - Alert ID
 * @param {Object} alertData - Alert data
 * @returns {Promise<Boolean>} Success status
 */
export const cacheAlert = async (alertId, alertData) => {
  try {
    const key = `alert:${alertId}`;
    await redis.set(key, JSON.stringify(alertData));
    
    // Set expiration (24 hours)
    await redis.expire(key, 86400);
    
    return true;
  } catch (error) {
    logger.error(`Error caching alert ${alertId}:`, error);
    return false;
  }
};

/**
 * Get cached alert data
 * @param {String} alertId - Alert ID
 * @returns {Promise<Object|null>} Alert data or null if not found
 */
export const getCachedAlert = async (alertId) => {
  try {
    const key = `alert:${alertId}`;
    const alert = await redis.get(key);
    
    if (!alert) {
      return null;
    }
    
    return JSON.parse(alert);
  } catch (error) {
    logger.error(`Error getting cached alert ${alertId}:`, error);
    return null;
  }
};

/**
 * Cache user session data
 * @param {String} sessionId - Session ID
 * @param {Object} sessionData - Session data
 * @param {Number} ttl - Time to live in seconds (default: 1 day)
 * @returns {Promise<Boolean>} Success status
 */
export const cacheSession = async (sessionId, sessionData, ttl = 86400) => {
  try {
    const key = `session:${sessionId}`;
    await redis.set(key, JSON.stringify(sessionData));
    
    // Set expiration
    await redis.expire(key, ttl);
    
    return true;
  } catch (error) {
    logger.error(`Error caching session ${sessionId}:`, error);
    return false;
  }
};

/**
 * Get cached session data
 * @param {String} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null if not found
 */
export const getCachedSession = async (sessionId) => {
  try {
    const key = `session:${sessionId}`;
    const session = await redis.get(key);
    
    if (!session) {
      return null;
    }
    
    return JSON.parse(session);
  } catch (error) {
    logger.error(`Error getting cached session ${sessionId}:`, error);
    return null;
  }
};

/**
 * Delete cached session data
 * @param {String} sessionId - Session ID
 * @returns {Promise<Boolean>} Success status
 */
export const deleteCachedSession = async (sessionId) => {
  try {
    const key = `session:${sessionId}`;
    await redis.del(key);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting cached session ${sessionId}:`, error);
    return false;
  }
};

/**
 * Setup Redis client and verify connection
 * @returns {Object} Redis client instance
 */
export const setupRedisClient = () => {
  try {
    logger.info('Setting up Redis client...');
    
    // Test connection by setting and getting a value
    redis.set('health_check', 'ok', 'EX', 60);
    
    logger.info('Redis client setup successfully');
    return redis;
  } catch (error) {
    logger.error('Failed to setup Redis client:', error);
    return null;
  }
};

// Export Redis client for direct access if needed
export default redis;
