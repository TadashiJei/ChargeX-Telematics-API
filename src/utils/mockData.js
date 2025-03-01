/**
 * Mock data for development and testing
 */

// Mock devices
export const mockDevices = [
  {
    _id: 'dev-001',
    name: 'Battery Monitor 001',
    type: 'bms',
    status: 'active',
    batteryId: 'batt-001',
    firmware: 'v2.1.5',
    lastSeen: '2025-03-02T00:45:12Z',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Market St, San Francisco, CA'
    },
    config: {
      reportingInterval: 30,
      lowBatteryThreshold: 20,
      highTempThreshold: 30
    },
    createdAt: '2025-02-15T08:00:00Z',
    updatedAt: '2025-03-02T00:45:12Z'
  },
  {
    _id: 'dev-002',
    name: 'Battery Monitor 002',
    type: 'bms',
    status: 'active',
    batteryId: 'batt-002',
    firmware: 'v2.1.5',
    lastSeen: '2025-03-02T00:44:45Z',
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
      address: '456 Market St, San Francisco, CA'
    },
    config: {
      reportingInterval: 30,
      lowBatteryThreshold: 20,
      highTempThreshold: 30
    },
    createdAt: '2025-02-15T08:30:00Z',
    updatedAt: '2025-03-02T00:44:45Z'
  },
  {
    _id: 'dev-003',
    name: 'GPS Tracker 001',
    type: 'gps',
    status: 'active',
    batteryId: 'batt-003',
    firmware: 'v1.8.2',
    lastSeen: '2025-03-02T00:43:22Z',
    location: {
      latitude: 37.7850,
      longitude: -122.4200,
      address: '789 Market St, San Francisco, CA'
    },
    config: {
      reportingInterval: 60,
      geofenceRadius: 500
    },
    createdAt: '2025-02-16T09:00:00Z',
    updatedAt: '2025-03-02T00:43:22Z'
  },
  {
    _id: 'dev-004',
    name: 'Battery Controller 001',
    type: 'controller',
    status: 'active',
    batteryId: 'batt-004',
    firmware: 'v3.0.1',
    lastSeen: '2025-03-02T00:42:18Z',
    location: {
      latitude: 37.7855,
      longitude: -122.4210,
      address: '101 California St, San Francisco, CA'
    },
    config: {
      reportingInterval: 15,
      chargingThreshold: 85,
      dischargingThreshold: 20
    },
    createdAt: '2025-02-17T10:00:00Z',
    updatedAt: '2025-03-02T00:42:18Z'
  },
  {
    _id: 'dev-005',
    name: 'Battery Monitor 003',
    type: 'bms',
    status: 'inactive',
    batteryId: 'batt-005',
    firmware: 'v2.1.4',
    lastSeen: '2025-03-01T12:15:33Z',
    location: {
      latitude: 37.7865,
      longitude: -122.4220,
      address: '202 California St, San Francisco, CA'
    },
    config: {
      reportingInterval: 30,
      lowBatteryThreshold: 20,
      highTempThreshold: 30
    },
    createdAt: '2025-02-18T11:00:00Z',
    updatedAt: '2025-03-01T12:15:33Z'
  }
];

// Mock telemetry data
export const mockTelemetry = {
  'dev-001': [
    {
      timestamp: '2025-03-01T23:00:00Z',
      voltage: 12.7,
      current: 2.4,
      temperature: 28.2,
      soc: 85.3,
      health: 97.2,
      latitude: 37.7749,
      longitude: -122.4194
    },
    {
      timestamp: '2025-03-01T22:30:00Z',
      voltage: 12.65,
      current: 2.3,
      temperature: 28.3,
      soc: 85.0,
      health: 97.2,
      latitude: 37.7749,
      longitude: -122.4194
    }
  ],
  'dev-002': [
    {
      timestamp: '2025-03-01T23:00:00Z',
      voltage: 12.8,
      current: 2.2,
      temperature: 27.8,
      soc: 87.5,
      health: 98.1,
      latitude: 37.7833,
      longitude: -122.4167
    }
  ]
};

// Mock alerts
export const mockAlerts = [
  {
    _id: 'alert-001',
    deviceId: 'dev-001',
    type: 'high_temperature',
    severity: 'warning',
    message: 'Battery temperature exceeds threshold',
    timestamp: '2025-03-01T22:15:00Z',
    status: 'active',
    value: 30.5,
    threshold: 30.0
  },
  {
    _id: 'alert-002',
    deviceId: 'dev-001',
    type: 'low_battery',
    severity: 'info',
    message: 'Battery level below threshold',
    timestamp: '2025-03-01T18:30:00Z',
    status: 'resolved',
    value: 19.8,
    threshold: 20.0,
    resolvedAt: '2025-03-01T20:45:00Z'
  },
  {
    _id: 'alert-003',
    deviceId: 'dev-003',
    type: 'geofence_violation',
    severity: 'critical',
    message: 'Device left authorized area',
    timestamp: '2025-03-01T14:22:00Z',
    status: 'active',
    location: {
      latitude: 37.7950,
      longitude: -122.4300
    }
  }
];

// Mock batteries
export const mockBatteries = [
  {
    _id: 'batt-001',
    serialNumber: 'BT-2025-001',
    model: 'LiFePO4-100Ah',
    capacity: 100,
    manufacturer: 'ChargeX',
    manufactureDate: '2025-01-15',
    status: 'active',
    health: 97.2,
    lastCharged: '2025-03-01T18:30:00Z'
  },
  {
    _id: 'batt-002',
    serialNumber: 'BT-2025-002',
    model: 'LiFePO4-100Ah',
    capacity: 100,
    manufacturer: 'ChargeX',
    manufactureDate: '2025-01-16',
    status: 'active',
    health: 98.1,
    lastCharged: '2025-03-01T19:45:00Z'
  },
  {
    _id: 'batt-003',
    serialNumber: 'BT-2025-003',
    model: 'LiFePO4-80Ah',
    capacity: 80,
    manufacturer: 'ChargeX',
    manufactureDate: '2025-01-17',
    status: 'active',
    health: 96.8,
    lastCharged: '2025-03-01T20:15:00Z'
  },
  {
    _id: 'batt-004',
    serialNumber: 'BT-2025-004',
    model: 'LiFePO4-120Ah',
    capacity: 120,
    manufacturer: 'ChargeX',
    manufactureDate: '2025-01-18',
    status: 'active',
    health: 99.3,
    lastCharged: '2025-03-01T21:30:00Z'
  },
  {
    _id: 'batt-005',
    serialNumber: 'BT-2025-005',
    model: 'LiFePO4-100Ah',
    capacity: 100,
    manufacturer: 'ChargeX',
    manufactureDate: '2025-01-19',
    status: 'inactive',
    health: 95.7,
    lastCharged: '2025-03-01T12:00:00Z'
  }
];
