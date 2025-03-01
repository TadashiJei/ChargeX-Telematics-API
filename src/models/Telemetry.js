import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  batteryId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  battery: {
    voltage: {
      total: Number,
      cells: [Number], // Array of individual cell voltages
    },
    current: Number, // Positive for charging, negative for discharging
    temperature: {
      average: Number,
      cells: [Number], // Array of temperature readings from different sensors
      ambient: Number,
    },
    soc: Number, // State of Charge (0-100%)
    soh: Number, // State of Health (0-100%)
    cycleCount: Number,
    chargingStatus: {
      type: String,
      enum: ['CHARGING', 'DISCHARGING', 'IDLE', 'FULL', 'ERROR'],
    },
    timeRemaining: Number, // Estimated time in minutes until full charge or empty
  },
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    altitude: Number,
    speed: Number, // in km/h
    heading: Number, // in degrees, 0-359
    accuracy: Number, // in meters
  },
  system: {
    cpuTemperature: Number,
    signalStrength: Number, // in dBm
    batteryLevel: Number, // Device's own battery level (0-100%)
    memoryUsage: Number, // in percentage
    uptime: Number, // in seconds
  },
  alerts: [{
    type: {
      type: String,
      enum: ['TEMPERATURE', 'VOLTAGE', 'CURRENT', 'SOC', 'GEOFENCE', 'CONNECTIVITY', 'SYSTEM'],
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
    },
    message: String,
    value: Number,
    threshold: Number,
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index for efficient time-series queries
telemetrySchema.index({ deviceId: 1, timestamp: -1 });
telemetrySchema.index({ batteryId: 1, timestamp: -1 });

// TTL index to automatically delete old telemetry data after 30 days
telemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

export default Telemetry;
