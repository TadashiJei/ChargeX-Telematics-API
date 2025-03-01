import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:3000/v1';

// Load test configuration
const CONFIG = {
  deviceCount: 50,
  batchSize: 10,
  concurrentRequests: 5,
  telemetryPerDevice: 100,
  telemetryBatchSize: 20,
  baseLocation: [103.8198, 1.3521] // Singapore coordinates
};

// Tracking variables
const stats = {
  devicesCreated: 0,
  devicesFailed: 0,
  telemetrySent: 0,
  telemetryFailed: 0,
  requestsCompleted: 0,
  startTime: null,
  endTime: null
};

// Device storage
const devices = [];

// Generate random value within range
const randomInRange = (min, max) => {
  return min + Math.random() * (max - min);
};

// Generate random movement
const randomMovement = () => {
  return (Math.random() - 0.5) * 2 * 0.01; // ~1km in degrees
};

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create a batch of devices
const createDeviceBatch = async (batchIndex) => {
  const batchDevices = [];
  const deviceTypes = ['bms', 'gps', 'controller'];
  const startIdx = batchIndex * CONFIG.batchSize;
  const endIdx = Math.min(startIdx + CONFIG.batchSize, CONFIG.deviceCount);
  
  console.log(`Creating devices batch ${batchIndex + 1} (${startIdx} to ${endIdx - 1})...`);
  
  for (let i = startIdx; i < endIdx; i++) {
    const deviceType = deviceTypes[i % deviceTypes.length];
    const deviceId = `load_${deviceType}_${uuidv4().substring(0, 8)}`;
    const batteryId = `load_battery_${uuidv4().substring(0, 8)}`;
    
    const device = {
      deviceId,
      type: deviceType,
      name: `Load Test ${deviceType.toUpperCase()} Device ${i}`,
      batteryId,
      firmware: {
        version: '1.0.0',
        lastUpdated: new Date()
      },
      config: {
        telemetryInterval: 30,
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
        location: [
          CONFIG.baseLocation[0] + randomMovement(),
          CONFIG.baseLocation[1] + randomMovement()
        ],
        lastTelemetry: null
      }
    };
    
    batchDevices.push(device);
  }
  
  // Register devices in parallel
  const promises = batchDevices.map(async (device) => {
    try {
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
        
        stats.devicesCreated++;
        return true;
      }
    } catch (error) {
      console.error(`Failed to register device ${device.deviceId}:`, 
        error.response?.data?.message || error.message);
      stats.devicesFailed++;
      return false;
    }
  });
  
  await Promise.all(promises);
  console.log(`Batch ${batchIndex + 1} complete: ${stats.devicesCreated} devices created so far`);
};

// Generate telemetry for a device
const generateTelemetry = (device, timestamp) => {
  // Update device state
  const batteryLevel = Math.max(0, device.state.batteryLevel - randomInRange(0, 1));
  const soc = Math.max(0, device.state.soc - randomInRange(0, 1.5));
  const voltage = 10 + (soc / 100) * 4; // 10-14V range based on SOC
  const current = randomInRange(-5, 5);
  const temperature = randomInRange(20, 35);
  
  // Random movement
  const location = [
    device.state.location[0] + randomMovement(),
    device.state.location[1] + randomMovement()
  ];
  
  // Generate telemetry data
  return {
    deviceId: device.deviceId,
    batteryId: device.batteryId,
    timestamp: timestamp || new Date(),
    battery: {
      voltage: {
        total: voltage,
        cells: Array(4).fill(0).map(() => voltage / 4 + randomInRange(-0.1, 0.1))
      },
      current: current,
      temperature: {
        average: temperature,
        cells: Array(4).fill(0).map(() => temperature + randomInRange(-2, 2))
      },
      soc: soc,
      health: randomInRange(95, 100),
      cycles: Math.floor(randomInRange(10, 50))
    },
    system: {
      batteryLevel: batteryLevel,
      signalStrength: randomInRange(70, 100),
      temperature: temperature + randomInRange(-5, 5),
      cpuLoad: randomInRange(10, 30),
      memoryUsage: randomInRange(20, 50),
      uptime: Math.floor(randomInRange(3600, 86400))
    },
    location: {
      coordinates: location,
      altitude: randomInRange(10, 30),
      speed: randomInRange(0, 5),
      heading: randomInRange(0, 359),
      accuracy: randomInRange(3, 10)
    }
  };
};

// Generate telemetry batch for a device
const generateTelemetryBatch = (device) => {
  const telemetryBatch = [];
  const now = new Date();
  
  for (let i = 0; i < CONFIG.telemetryBatchSize; i++) {
    // Generate timestamp with increasing time (10 seconds apart)
    const timestamp = new Date(now.getTime() - (CONFIG.telemetryBatchSize - i) * 10000);
    telemetryBatch.push(generateTelemetry(device, timestamp));
  }
  
  return telemetryBatch;
};

// Send telemetry batches for devices
const sendTelemetryBatches = async () => {
  console.log(`Sending telemetry for ${devices.length} devices (${CONFIG.telemetryPerDevice} per device)...`);
  
  // Calculate total batches needed
  const totalBatches = Math.ceil(devices.length * CONFIG.telemetryPerDevice / CONFIG.telemetryBatchSize);
  let batchesCompleted = 0;
  
  // Process in chunks of concurrent requests
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    const batchesPerDevice = Math.ceil(CONFIG.telemetryPerDevice / CONFIG.telemetryBatchSize);
    
    // Process batches for this device
    for (let j = 0; j < batchesPerDevice; j += CONFIG.concurrentRequests) {
      const batchPromises = [];
      
      // Create concurrent batch requests
      for (let k = 0; k < CONFIG.concurrentRequests && j + k < batchesPerDevice; k++) {
        const telemetryBatch = generateTelemetryBatch(device);
        
        batchPromises.push((async () => {
          try {
            const response = await axios.post(`${API_URL}/telemetry/batch`, {
              deviceId: device.deviceId,
              telemetry: telemetryBatch
            }, {
              headers: {
                'Content-Type': 'application/json',
                'X-Device-Token': device.token
              }
            });
            
            if (response.data.success) {
              stats.telemetrySent += telemetryBatch.length;
              batchesCompleted++;
              
              if (batchesCompleted % 10 === 0 || batchesCompleted === totalBatches) {
                const progress = (batchesCompleted / totalBatches * 100).toFixed(1);
                console.log(`Progress: ${progress}% (${batchesCompleted}/${totalBatches} batches, ${stats.telemetrySent} telemetry points)`);
              }
              
              return true;
            }
          } catch (error) {
            console.error(`Failed to send telemetry batch for ${device.deviceId}:`, 
              error.response?.data?.message || error.message);
            stats.telemetryFailed += telemetryBatch.length;
            return false;
          }
        })());
      }
      
      // Wait for all concurrent requests to complete
      await Promise.all(batchPromises);
      stats.requestsCompleted += batchPromises.length;
      
      // Add a small delay to prevent overwhelming the server
      await sleep(100);
    }
  }
  
  console.log(`Telemetry sending complete: ${stats.telemetrySent} points sent, ${stats.telemetryFailed} failed`);
};

// Clean up devices
const cleanupDevices = async () => {
  console.log(`Cleaning up ${devices.length} load test devices...`);
  
  let deleted = 0;
  
  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < devices.length; i += CONFIG.concurrentRequests) {
    const batchPromises = [];
    
    for (let j = 0; j < CONFIG.concurrentRequests && i + j < devices.length; j++) {
      const device = devices[i + j];
      
      batchPromises.push((async () => {
        try {
          const response = await axios.delete(`${API_URL}/devices/${device.deviceId}`, {
            headers: {
              'Authorization': 'Bearer test_admin_token'
            }
          });
          
          if (response.data.success) {
            deleted++;
            
            if (deleted % 10 === 0 || deleted === devices.length) {
              console.log(`Deleted ${deleted}/${devices.length} devices`);
            }
            
            return true;
          }
        } catch (error) {
          console.error(`Failed to delete device ${device.deviceId}:`, 
            error.response?.data?.message || error.message);
          return false;
        }
      })());
    }
    
    await Promise.all(batchPromises);
    
    // Add a small delay to prevent overwhelming the server
    await sleep(100);
  }
  
  console.log(`Cleanup complete: ${deleted}/${devices.length} devices deleted`);
};

// Print test results
const printResults = () => {
  const duration = (stats.endTime - stats.startTime) / 1000;
  const throughput = stats.telemetrySent / duration;
  
  console.log('\n=== LOAD TEST RESULTS ===');
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Devices: ${stats.devicesCreated} created, ${stats.devicesFailed} failed`);
  console.log(`Telemetry: ${stats.telemetrySent} points sent, ${stats.telemetryFailed} failed`);
  console.log(`Requests: ${stats.requestsCompleted} completed`);
  console.log(`Throughput: ${throughput.toFixed(2)} telemetry points/second`);
  console.log('========================\n');
};

// Run load test
const runLoadTest = async () => {
  console.log('Starting load test...');
  console.log(`Configuration: ${CONFIG.deviceCount} devices, ${CONFIG.telemetryPerDevice} telemetry points per device`);
  console.log(`Total telemetry points: ${CONFIG.deviceCount * CONFIG.telemetryPerDevice}`);
  
  stats.startTime = Date.now();
  
  try {
    // Create devices in batches
    const batches = Math.ceil(CONFIG.deviceCount / CONFIG.batchSize);
    for (let i = 0; i < batches; i++) {
      await createDeviceBatch(i);
    }
    
    console.log(`Device creation complete: ${stats.devicesCreated} devices created, ${stats.devicesFailed} failed`);
    
    if (devices.length === 0) {
      console.error('No devices created, exiting load test');
      return;
    }
    
    // Send telemetry
    await sendTelemetryBatches();
    
    // Clean up
    await cleanupDevices();
    
    stats.endTime = Date.now();
    
    // Print results
    printResults();
    
    console.log('Load test complete');
  } catch (error) {
    console.error('Load test error:', error.message);
    stats.endTime = Date.now();
    printResults();
  }
};

// Run the load test
runLoadTest();
