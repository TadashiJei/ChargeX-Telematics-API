import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  // Alert type (e.g., battery_voltage_low, battery_temperature_high, geofence_violation)
  type: {
    type: String,
    required: true,
    index: true
  },
  
  // Alert severity (info, warning, critical)
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  },
  
  // Alert status (active, resolved, acknowledged)
  status: {
    type: String,
    enum: ['active', 'resolved', 'acknowledged'],
    default: 'active',
    index: true
  },
  
  // Device ID that generated the alert
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  
  // Battery ID associated with the alert (if applicable)
  batteryId: {
    type: String,
    index: true
  },
  
  // Alert message
  message: {
    type: String,
    required: true
  },
  
  // Additional alert data (specific to alert type)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Number of times this alert has occurred
  occurrences: {
    type: Number,
    default: 1
  },
  
  // Alert creation timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Last occurrence timestamp
  lastOccurrence: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Alert resolution timestamp (if resolved)
  resolvedAt: {
    type: Date,
    default: null
  },
  
  // User ID who resolved the alert (if resolved)
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Resolution notes (if resolved)
  resolution: {
    type: String,
    default: null
  },
  
  // User ID who acknowledged the alert (if acknowledged)
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Acknowledgement timestamp (if acknowledged)
  acknowledgedAt: {
    type: Date,
    default: null
  },
  
  // Alert category (for grouping and filtering)
  category: {
    type: String,
    enum: ['battery', 'device', 'location', 'system', 'security', 'other'],
    default: 'other',
    index: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
alertSchema.index({ deviceId: 1, type: 1, status: 1 });
alertSchema.index({ batteryId: 1, status: 1 });
alertSchema.index({ createdAt: 1, severity: 1 });

// Virtual for alert age
alertSchema.virtual('age').get(function() {
  return new Date() - this.createdAt;
});

// Method to acknowledge an alert
alertSchema.methods.acknowledge = async function(userId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  return this.save();
};

// Method to resolve an alert
alertSchema.methods.resolve = async function(userId, resolution) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  this.resolution = resolution || 'Resolved without notes';
  return this.save();
};

// Method to check if alert is active
alertSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to check if alert is critical
alertSchema.methods.isCritical = function() {
  return this.severity === 'critical';
};

// Static method to find active alerts for a device
alertSchema.statics.findActiveForDevice = function(deviceId) {
  return this.find({
    deviceId,
    status: 'active'
  }).sort({ severity: -1, createdAt: -1 });
};

// Static method to find active alerts for a battery
alertSchema.statics.findActiveForBattery = function(batteryId) {
  return this.find({
    batteryId,
    status: 'active'
  }).sort({ severity: -1, createdAt: -1 });
};

// Static method to find critical alerts
alertSchema.statics.findCritical = function() {
  return this.find({
    severity: 'critical',
    status: 'active'
  }).sort({ createdAt: -1 });
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
