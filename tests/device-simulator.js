import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:3000/v1';

// Simulator configuration
const CONFIG = {
  deviceCount: 3,
  telemetryInterval: 5000, // 5 seconds
  runTime: 60000, // 1 minute
  batteryDrainRate: 0.05, // % per telemetry
  movementRadius: 0.001, // ~100m in degrees
  baseLocation: [103.8198, 1.3521] // Singapore coordinates
};

// Device storage
const devices = [];

// Generate random value within range
const randomInRange = (min, max) => {
  return min + Math.random() * (max - min);
};

// Generate random movement
const randomMovement = () => {
  return (Math.random() - 0.5) * 2 * CONFIG.movementRadius;
};

// Create devices
const createDevices = async () => {
  console.log(`🔧 Creating ${CONFIG.deviceCount} simulated devices...`);
  
  const deviceTypes = ['bms', 'gps', 'controller'];
  
  for (let i = 0; i < CONFIG.deviceCount; i++) {
    const deviceType = deviceTypes[i % deviceTypes.length];
    const deviceId = `sim_${deviceType}_${uuidv4().substring(0, 8)}`;
    const batteryId = `sim_battery_${uuidv4().substring(0, 8)}`;
    
    const device = {
      deviceId,
      type: deviceType,
      name: `Simulated ${deviceType.toUpperCase()} Device`,
      batteryId,
      firmware: {
        version: '1.0.0',
        lastUpdated: new Date()
      },
      config: {
        telemetryInterval: CONFIG.telemetryInterval / 1000,
        geofence: {
          enabled: true,
          radius: 500,
          center: [...CONFIG.baseLocation]
        },
        alerts: {
          voltage: {
            min: 10.0,
            max: 14.0
          },
          temperature: {
            min: 0,
            max: 45,
            criticalMax: 60
          },
          soc: {
            min: 20,
            criticalMin: 10
          }
        }
      },
      // Runtime state (not sent to server)
      state: {
        batteryLevel: 100,
        soc: 100,
        voltage: 12.6,
        current: 0,
        temperature: 25,
        location: [...CONFIG.baseLocation],
        lastTelemetry: null
      }
    };
    
    try {
      // Register device
      const response = await axios.post(`${API_URL}/devices`, device, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_admin_token'
        }
      });
      
      if (response.data.success) {
        // Save device with token
        devices.push({
          ...device,
          token: response.data.token
        });
        
        console.log(`✅ Device registered: ${deviceId} (${deviceType})`);
      }
    } catch (error) {
      console.error(`❌ Failed to register device ${deviceId}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  console.log(`✅ Created ${devices.length} devices successfully`);
};

// Generate telemetry for a device
const generateTelemetry = (device) => {
  // Update device state
  device.state.batteryLevel = Math.max(0, device.state.batteryLevel - CONFIG.batteryDrainRate);
  device.state.soc = Math.max(0, device.state.soc - CONFIG.batteryDrainRate * 1.5);
  device.state.voltage = 10 + (device.state.soc / 100) * 4; // 10-14V range based on SOC
  device.state.current = randomInRange(-5, 5);
  device.state.temperature = randomInRange(20, 35);
  
  // Random movement
  device.state.location = [
    device.state.location[0] + randomMovement(),
    device.state.location[1] + randomMovement()
  ];
  
  // Generate telemetry data
  return {
    deviceId: device.deviceId,
    batteryId: device.batteryId,
    timestamp: new Date(),
    battery: {
      voltage: {
        total: device.state.voltage,
        cells: Array(4).fill(0).map(() => device.state.voltage / 4 + randomInRange(-0.1, 0.1))
      },
      current: device.state.current,
      temperature: {
        average: device.state.temperature,
        cells: Array(4).fill(0).map(() => device.state.temperature + randomInRange(-2, 2))
      },
      soc: device.state.soc,
      health: randomInRange(95, 100),
      cycles: Math.floor(randomInRange(10, 50))
    },
    system: {
      batteryLevel: device.state.batteryLevel,
      signalStrength: randomInRange(70, 100),
      temperature: device.state.temperature + randomInRange(-5, 5),
      cpuLoad: randomInRange(10, 30),
      memoryUsage: randomInRange(20, 50),
      uptime: Math.floor(randomInRange(3600, 86400))
    },
    location: {
      coordinates: device.state.location,
      altitude: randomInRange(10, 30),
      speed: randomInRange(0, 5),
      heading: randomInRange(0, 359),
      accuracy: randomInRange(3, 10)
    }
  };
};

// Send telemetry for all devices
const sendTelemetry = async () => {
  console.log(`📊 Sending telemetry for ${devices.length} devices...`);
  
  const promises = devices.map(async (device) => {
    try {
      const telemetry = generateTelemetry(device);
      device.state.lastTelemetry = telemetry;
      
      const response = await axios.post(`${API_URL}/telemetry`, telemetry, {
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': device.token
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Telemetry sent for ${device.deviceId}`);
        
        // Check for alerts
        if (response.data.alerts && response.data.alerts.length > 0) {
          console.log(`⚠️ ${response.data.alerts.length} alerts generated for ${device.deviceId}`);
        }
        
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to send telemetry for ${device.deviceId}:`, 
        error.response?.data?.message || error.message);
      return false;
    }
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(Boolean).length;
  
  console.log(`📊 Telemetry sent for ${successCount}/${devices.length} devices`);
};

// Check device status
const checkDeviceStatus = async () => {
  console.log(`🔍 Checking status for ${devices.length} devices...`);
  
  const promises = devices.map(async (device) => {
    try {
      const response = await axios.get(`${API_URL}/devices/${device.deviceId}/status`, {
        headers: {
          'X-Device-Token': device.token
        }
      });
      
      if (response.data.status === 'active') {
        console.log(`✅ Device ${device.deviceId} is active`);
        
        // Check for pending commands
        if (response.data.pendingCommands && response.data.pendingCommands.length > 0) {
          console.log(`📡 ${response.data.pendingCommands.length} pending commands for ${device.deviceId}`);
          
          // Process commands (in a real device, you would execute the commands)
          response.data.pendingCommands.forEach(cmd => {
            console.log(`⚙️ Command received: ${cmd.command} (${cmd.commandId})`);
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to check status for ${device.deviceId}:`, 
        error.response?.data?.message || error.message);
      return false;
    }
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(Boolean).length;
  
  console.log(`🔍 Status checked for ${successCount}/${devices.length} devices`);
};

// Clean up devices
const cleanupDevices = async () => {
  console.log(`🧹 Cleaning up ${devices.length} simulated devices...`);
  
  const promises = devices.map(async (device) => {
    try {
      const response = await axios.delete(`${API_URL}/devices/${device.deviceId}`, {
        headers: {
          'Authorization': 'Bearer test_admin_token'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Device deleted: ${device.deviceId}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to delete device ${device.deviceId}:`, 
        error.response?.data?.message || error.message);
      return false;
    }
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(Boolean).length;
  
  console.log(`🧹 Cleaned up ${successCount}/${devices.length} devices`);
};

// Run simulator
const runSimulator = async () => {
  console.log('🚀 Starting device simulator...');
  
  try {
    // Create devices
    await createDevices();
    
    if (devices.length === 0) {
      console.error('❌ No devices created, exiting simulator');
      return;
    }
    
    // Set up telemetry interval
    const interval = setInterval(async () => {
      await sendTelemetry();
      await checkDeviceStatus();
    }, CONFIG.telemetryInterval);
    
    // Set timeout to stop simulator
    setTimeout(async () => {
      clearInterval(interval);
      console.log(`⏱️ Simulator run time (${CONFIG.runTime / 1000}s) completed`);
      
      // Clean up
      await cleanupDevices();
      
      console.log('👋 Simulator finished');
    }, CONFIG.runTime);
    
    console.log(`⏱️ Simulator will run for ${CONFIG.runTime / 1000} seconds`);
    console.log(`📊 Sending telemetry every ${CONFIG.telemetryInterval / 1000} seconds`);
  } catch (error) {
    console.error('❌ Simulator error:', error.message);
  }
};

// Run the simulator
runSimulator();
