/**
 * MQTT Service for handling device communication
 */
import mqtt from 'mqtt';
import logger from '../utils/logger.js';

let mqttClient = null;

/**
 * Initialize MQTT client connection
 */
export const initMqttClient = () => {
  // Skip MQTT initialization if disabled in environment
  if (process.env.MQTT_ENABLED !== 'true') {
    logger.info('MQTT client disabled by configuration');
    return null;
  }

  try {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const options = {
      clientId: `chargex_telematics_${Math.random().toString(16).substring(2, 8)}`,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clean: true,
      reconnectPeriod: 5000
    };

    logger.info(`Connecting to MQTT broker at ${brokerUrl}`);
    mqttClient = mqtt.connect(brokerUrl, options);

    mqttClient.on('connect', () => {
      logger.info('Connected to MQTT broker');
      
      // Subscribe to device topics
      const topics = [
        'devices/+/telemetry',
        'devices/+/status',
        'devices/+/command/response'
      ];
      
      topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
          if (err) {
            logger.error(`Failed to subscribe to ${topic}:`, err);
          } else {
            logger.info(`Subscribed to ${topic}`);
          }
        });
      });
    });

    mqttClient.on('message', (topic, message) => {
      logger.debug(`Received message on ${topic}`);
      
      try {
        const payload = JSON.parse(message.toString());
        
        // Process based on topic pattern
        if (topic.match(/devices\/(.+)\/telemetry/)) {
          const deviceId = topic.split('/')[1];
          processTelemetry(deviceId, payload);
        } else if (topic.match(/devices\/(.+)\/status/)) {
          const deviceId = topic.split('/')[1];
          processStatus(deviceId, payload);
        } else if (topic.match(/devices\/(.+)\/command\/response/)) {
          const deviceId = topic.split('/')[1];
          processCommandResponse(deviceId, payload);
        }
      } catch (error) {
        logger.error('Error processing MQTT message:', error);
      }
    });

    mqttClient.on('error', (error) => {
      logger.error('MQTT client error:', error);
    });

    mqttClient.on('offline', () => {
      logger.warn('MQTT client offline');
    });

    mqttClient.on('reconnect', () => {
      logger.info('MQTT client reconnecting');
    });

    return mqttClient;
  } catch (error) {
    logger.error('Failed to initialize MQTT client:', error);
    return null;
  }
};

/**
 * Process telemetry data received via MQTT
 * @param {string} deviceId - Device ID
 * @param {object} data - Telemetry data
 */
const processTelemetry = (deviceId, data) => {
  logger.debug(`Processing telemetry for device ${deviceId}`);
  // In a real implementation, this would forward to the telemetry controller
};

/**
 * Process status update received via MQTT
 * @param {string} deviceId - Device ID
 * @param {object} data - Status data
 */
const processStatus = (deviceId, data) => {
  logger.debug(`Processing status for device ${deviceId}`);
  // In a real implementation, this would update device status
};

/**
 * Process command response received via MQTT
 * @param {string} deviceId - Device ID
 * @param {object} data - Command response data
 */
const processCommandResponse = (deviceId, data) => {
  logger.debug(`Processing command response for device ${deviceId}`);
  // In a real implementation, this would update command status
};

/**
 * Publish message to MQTT topic
 * @param {string} topic - Topic to publish to
 * @param {object} message - Message to publish
 * @returns {boolean} - Success status
 */
export const publishMessage = (topic, message) => {
  if (!mqttClient || !mqttClient.connected) {
    logger.error('Cannot publish message: MQTT client not connected');
    return false;
  }

  try {
    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    mqttClient.publish(topic, payload);
    logger.debug(`Published message to ${topic}`);
    return true;
  } catch (error) {
    logger.error(`Error publishing to ${topic}:`, error);
    return false;
  }
};

/**
 * Send command to device via MQTT
 * @param {string} deviceId - Device ID
 * @param {object} command - Command object
 * @returns {boolean} - Success status
 */
export const sendDeviceCommand = (deviceId, command) => {
  const topic = `devices/${deviceId}/command`;
  return publishMessage(topic, command);
};

export default {
  initMqttClient,
  publishMessage,
  sendDeviceCommand
};
