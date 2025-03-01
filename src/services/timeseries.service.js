import { InfluxDB, Point } from '@influxdata/influxdb-client';
import logger from '../utils/logger.js';

// Create InfluxDB client
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN
});

// Get write client
const writeApi = influxDB.getWriteApi(
  process.env.INFLUXDB_ORG || 'chargex',
  process.env.INFLUXDB_BUCKET || 'telemetry'
);

// Get query client
const queryApi = influxDB.getQueryApi(
  process.env.INFLUXDB_ORG || 'chargex'
);

/**
 * Save telemetry data to time-series database
 * @param {Object} telemetryData - Telemetry data
 * @returns {Promise<Boolean>} Success status
 */
export const saveTimeseriesData = async (telemetryData) => {
  try {
    const { deviceId, batteryId, timestamp, battery, system, location } = telemetryData;
    
    // Create timestamp
    const time = timestamp ? new Date(timestamp) : new Date();
    
    // Create points for battery metrics
    if (battery) {
      // Battery voltage
      if (battery.voltage) {
        const voltagePoint = new Point('battery_voltage')
          .tag('deviceId', deviceId)
          .tag('batteryId', batteryId)
          .floatField('total', battery.voltage.total || 0);
        
        // Add cell voltages if available
        if (battery.voltage.cells && Array.isArray(battery.voltage.cells)) {
          battery.voltage.cells.forEach((voltage, index) => {
            voltagePoint.floatField(`cell_${index + 1}`, voltage);
          });
        }
        
        voltagePoint.timestamp(time);
        writeApi.writePoint(voltagePoint);
      }
      
      // Battery current
      if (battery.current !== undefined) {
        const currentPoint = new Point('battery_current')
          .tag('deviceId', deviceId)
          .tag('batteryId', batteryId)
          .floatField('current', battery.current)
          .timestamp(time);
        
        writeApi.writePoint(currentPoint);
      }
      
      // Battery temperature
      if (battery.temperature) {
        const temperaturePoint = new Point('battery_temperature')
          .tag('deviceId', deviceId)
          .tag('batteryId', batteryId)
          .floatField('average', battery.temperature.average || 0);
        
        // Add cell temperatures if available
        if (battery.temperature.cells && Array.isArray(battery.temperature.cells)) {
          battery.temperature.cells.forEach((temp, index) => {
            temperaturePoint.floatField(`cell_${index + 1}`, temp);
          });
        }
        
        temperaturePoint.timestamp(time);
        writeApi.writePoint(temperaturePoint);
      }
      
      // Battery SOC
      if (battery.soc !== undefined) {
        const socPoint = new Point('battery_soc')
          .tag('deviceId', deviceId)
          .tag('batteryId', batteryId)
          .floatField('soc', battery.soc)
          .timestamp(time);
        
        writeApi.writePoint(socPoint);
      }
      
      // Battery health
      if (battery.health !== undefined) {
        const healthPoint = new Point('battery_health')
          .tag('deviceId', deviceId)
          .tag('batteryId', batteryId)
          .floatField('health', battery.health)
          .timestamp(time);
        
        writeApi.writePoint(healthPoint);
      }
      
      // Battery cycles
      if (battery.cycles !== undefined) {
        const cyclesPoint = new Point('battery_cycles')
          .tag('deviceId', deviceId)
          .tag('batteryId', batteryId)
          .intField('cycles', battery.cycles)
          .timestamp(time);
        
        writeApi.writePoint(cyclesPoint);
      }
    }
    
    // Create points for system metrics
    if (system) {
      const systemPoint = new Point('system')
        .tag('deviceId', deviceId)
        .tag('batteryId', batteryId);
      
      // Add system metrics
      if (system.batteryLevel !== undefined) {
        systemPoint.floatField('batteryLevel', system.batteryLevel);
      }
      
      if (system.signalStrength !== undefined) {
        systemPoint.floatField('signalStrength', system.signalStrength);
      }
      
      if (system.temperature !== undefined) {
        systemPoint.floatField('temperature', system.temperature);
      }
      
      if (system.cpuLoad !== undefined) {
        systemPoint.floatField('cpuLoad', system.cpuLoad);
      }
      
      if (system.memoryUsage !== undefined) {
        systemPoint.floatField('memoryUsage', system.memoryUsage);
      }
      
      if (system.uptime !== undefined) {
        systemPoint.intField('uptime', system.uptime);
      }
      
      systemPoint.timestamp(time);
      writeApi.writePoint(systemPoint);
    }
    
    // Create point for location
    if (location && location.coordinates) {
      const locationPoint = new Point('location')
        .tag('deviceId', deviceId)
        .tag('batteryId', batteryId)
        .floatField('longitude', location.coordinates[0])
        .floatField('latitude', location.coordinates[1]);
      
      if (location.altitude !== undefined) {
        locationPoint.floatField('altitude', location.altitude);
      }
      
      if (location.speed !== undefined) {
        locationPoint.floatField('speed', location.speed);
      }
      
      if (location.heading !== undefined) {
        locationPoint.floatField('heading', location.heading);
      }
      
      if (location.accuracy !== undefined) {
        locationPoint.floatField('accuracy', location.accuracy);
      }
      
      locationPoint.timestamp(time);
      writeApi.writePoint(locationPoint);
    }
    
    // Flush write buffer
    await writeApi.flush();
    
    return true;
  } catch (error) {
    logger.error('Error saving time-series data:', error);
    return false;
  }
};

/**
 * Query time-series data
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Query results
 */
export const queryTimeseriesData = async (options) => {
  try {
    const {
      measurement,
      deviceId,
      batteryId,
      fields = [],
      startTime,
      endTime,
      aggregation = 'mean',
      interval = '1h'
    } = options;
    
    // Build Flux query
    let query = `from(bucket: "${process.env.INFLUXDB_BUCKET || 'telemetry'}")
      |> range(start: ${startTime || '-24h'}, stop: ${endTime || 'now()'})
      |> filter(fn: (r) => r._measurement == "${measurement}")`;
    
    // Add device filter
    if (deviceId) {
      query += `\n|> filter(fn: (r) => r.deviceId == "${deviceId}")`;
    }
    
    // Add battery filter
    if (batteryId) {
      query += `\n|> filter(fn: (r) => r.batteryId == "${batteryId}")`;
    }
    
    // Add field filter
    if (fields.length > 0) {
      const fieldList = fields.map(field => `r._field == "${field}"`).join(' or ');
      query += `\n|> filter(fn: (r) => ${fieldList})`;
    }
    
    // Add aggregation
    query += `\n|> aggregateWindow(every: ${interval}, fn: ${aggregation}, createEmpty: false)
      |> yield(name: "result")`;
    
    // Execute query
    const results = [];
    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
      results.push(tableMeta.toObject(values));
    }
    
    return results;
  } catch (error) {
    logger.error('Error querying time-series data:', error);
    throw new Error('Failed to query time-series data');
  }
};

/**
 * Get battery voltage history
 * @param {String} batteryId - Battery ID
 * @param {String} startTime - Start time (e.g., '-24h')
 * @param {String} endTime - End time (e.g., 'now()')
 * @param {String} interval - Aggregation interval (e.g., '1h')
 * @returns {Promise<Array>} Voltage history
 */
export const getBatteryVoltageHistory = async (batteryId, startTime = '-24h', endTime = 'now()', interval = '1h') => {
  try {
    return await queryTimeseriesData({
      measurement: 'battery_voltage',
      batteryId,
      fields: ['total'],
      startTime,
      endTime,
      interval
    });
  } catch (error) {
    logger.error(`Error getting voltage history for battery ${batteryId}:`, error);
    throw new Error('Failed to get battery voltage history');
  }
};

/**
 * Get battery temperature history
 * @param {String} batteryId - Battery ID
 * @param {String} startTime - Start time (e.g., '-24h')
 * @param {String} endTime - End time (e.g., 'now()')
 * @param {String} interval - Aggregation interval (e.g., '1h')
 * @returns {Promise<Array>} Temperature history
 */
export const getBatteryTemperatureHistory = async (batteryId, startTime = '-24h', endTime = 'now()', interval = '1h') => {
  try {
    return await queryTimeseriesData({
      measurement: 'battery_temperature',
      batteryId,
      fields: ['average'],
      startTime,
      endTime,
      interval
    });
  } catch (error) {
    logger.error(`Error getting temperature history for battery ${batteryId}:`, error);
    throw new Error('Failed to get battery temperature history');
  }
};

/**
 * Get battery SOC history
 * @param {String} batteryId - Battery ID
 * @param {String} startTime - Start time (e.g., '-24h')
 * @param {String} endTime - End time (e.g., 'now()')
 * @param {String} interval - Aggregation interval (e.g., '1h')
 * @returns {Promise<Array>} SOC history
 */
export const getBatterySocHistory = async (batteryId, startTime = '-24h', endTime = 'now()', interval = '1h') => {
  try {
    return await queryTimeseriesData({
      measurement: 'battery_soc',
      batteryId,
      fields: ['soc'],
      startTime,
      endTime,
      interval
    });
  } catch (error) {
    logger.error(`Error getting SOC history for battery ${batteryId}:`, error);
    throw new Error('Failed to get battery SOC history');
  }
};

/**
 * Get device location history
 * @param {String} deviceId - Device ID
 * @param {String} startTime - Start time (e.g., '-24h')
 * @param {String} endTime - End time (e.g., 'now()')
 * @returns {Promise<Array>} Location history
 */
export const getDeviceLocationHistory = async (deviceId, startTime = '-24h', endTime = 'now()') => {
  try {
    return await queryTimeseriesData({
      measurement: 'location',
      deviceId,
      fields: ['longitude', 'latitude', 'altitude', 'speed', 'heading'],
      startTime,
      endTime,
      // Don't aggregate location data, get raw points
      interval: '0s',
      aggregation: 'last'
    });
  } catch (error) {
    logger.error(`Error getting location history for device ${deviceId}:`, error);
    throw new Error('Failed to get device location history');
  }
};

/**
 * Initialize InfluxDB connection
 */
export const initInfluxDB = () => {
  try {
    logger.info('Initializing InfluxDB connection...');
    
    // Test connection by writing a health check point
    const point = new Point('system_health')
      .tag('service', 'api')
      .floatField('status', 1)
      .timestamp(new Date());
    
    writeApi.writePoint(point);
    writeApi.flush();
    
    logger.info('InfluxDB connection initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize InfluxDB connection:', error);
    return false;
  }
};

export default {
  saveTimeseriesData,
  queryTimeseriesData,
  getBatteryVoltageHistory,
  initInfluxDB,
  getBatteryTemperatureHistory,
  getBatterySocHistory,
  getDeviceLocationHistory
};
