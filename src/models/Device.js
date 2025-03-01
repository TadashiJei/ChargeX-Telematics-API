import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['BMS', 'GPS', 'CONTROLLER', 'GATEWAY'],
    required: true
  },
  batteryId: {
    type: String,
    required: true,
    index: true
  },
  model: {
    type: String,
    required: true
  },
  firmware: {
    version: String,
    lastUpdated: Date
  },
  hardware: {
    version: String,
    serialNumber: String,
    manufacturer: String
  },
  communication: {
    primary: {
      type: String,
      enum: ['WIFI', 'CELLULAR', 'BLUETOOTH', 'LORA'],
      required: true
    },
    secondary: {
      type: String,
      enum: ['WIFI', 'CELLULAR', 'BLUETOOTH', 'LORA', 'NONE'],
      default: 'NONE'
    },
    imei: String,
    simCardNumber: String,
    macAddress: String
  },
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    altitude: Number,
    accuracy: Number,
    lastUpdated: Date
  },
  status: {
    online: {
      type: Boolean,
      default: false
    },
    lastSeen: Date,
    batteryLevel: Number,
    signalStrength: Number,
    mode: {
      type: String,
      enum: ['NORMAL', 'LOW_POWER', 'MAINTENANCE', 'ALERT'],
      default: 'NORMAL'
    }
  },
  config: {
    reportingInterval: {
      type: Number,
      default: 300, // seconds
      min: 10,
      max: 86400
    },
    alertThresholds: {
      temperature: {
        min: Number,
        max: Number
      },
      voltage: {
        min: Number,
        max: Number
      },
      current: {
        min: Number,
        max: Number
      },
      soc: {
        min: Number
      }
    },
    geofence: {
      enabled: {
        type: Boolean,
        default: false
      },
      radius: Number, // meters
      center: {
        type: [Number], // [longitude, latitude]
      },
      polygons: [[Number]] // Array of [longitude, latitude] pairs
    }
  },
  blockchain: {
    walletAddress: String,
    contractAddress: String,
    tokenId: String,
    lastTransaction: {
      hash: String,
      timestamp: Date,
      type: String
    }
  },
  tags: [String],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for efficient queries
deviceSchema.index({ 'status.online': 1 });
deviceSchema.index({ 'status.lastSeen': 1 });
deviceSchema.index({ 'config.geofence.enabled': 1 });
deviceSchema.index({ tags: 1 });

// Instance methods
deviceSchema.methods.isOnline = function() {
  const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
  if (!this.status.lastSeen) return false;
  
  const timeSinceLastSeen = Date.now() - this.status.lastSeen.getTime();
  return timeSinceLastSeen < OFFLINE_THRESHOLD_MS;
};

deviceSchema.methods.updateLocation = function(longitude, latitude, altitude = null, accuracy = null) {
  this.location.coordinates = [longitude, latitude];
  if (altitude !== null) this.location.altitude = altitude;
  if (accuracy !== null) this.location.accuracy = accuracy;
  this.location.lastUpdated = new Date();
};

deviceSchema.methods.isWithinGeofence = function() {
  if (!this.config.geofence.enabled || !this.config.geofence.center || !this.location.coordinates) {
    return true; // No geofence or no location, assume within bounds
  }
  
  // Simple circular geofence check
  if (this.config.geofence.radius) {
    const [deviceLong, deviceLat] = this.location.coordinates;
    const [fenceLong, fenceLat] = this.config.geofence.center;
    const radius = this.config.geofence.radius;
    
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth radius in meters
    const φ1 = deviceLat * Math.PI / 180;
    const φ2 = fenceLat * Math.PI / 180;
    const Δφ = (fenceLat - deviceLat) * Math.PI / 180;
    const Δλ = (fenceLong - deviceLong) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radius;
  }
  
  // For polygon geofence, we would need a more complex algorithm
  // This is a placeholder for future implementation
  return true;
};

// Static methods
deviceSchema.statics.findByBatteryId = function(batteryId) {
  return this.find({ batteryId });
};

deviceSchema.statics.findOnlineDevices = function() {
  const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
  const cutoffTime = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
  
  return this.find({
    'status.lastSeen': { $gte: cutoffTime }
  });
};

const Device = mongoose.model('Device', deviceSchema);

export default Device;
