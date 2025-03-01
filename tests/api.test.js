import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:3000/v1';

// Test device data
const testDevice = {
  deviceId: `test_device_${uuidv4().substring(0, 8)}`,
  type: 'bms',
  name: 'Test BMS Device',
  batteryId: `test_battery_${uuidv4().substring(0, 8)}`,
  firmware: {
    version: '1.0.0',
    lastUpdated: new Date()
  },
  config: {
    telemetryInterval: 60,
    geofence: {
      enabled: true,
      radius: 500,
      center: [103.8198, 1.3521] // Singapore coordinates
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
  }
};

// Test telemetry data
const generateTelemetry = (deviceId, batteryId) => ({
  deviceId,
  batteryId,
  timestamp: new Date(),
  battery: {
    voltage: {
      total: 12.6,
      cells: [3.2, 3.1, 3.2, 3.1]
    },
    current: 2.5,
    temperature: {
      average: 25.5,
      cells: [25.2, 25.8, 25.3, 25.7]
    },
    soc: 85,
    health: 98,
    cycles: 12
  },
  system: {
    batteryLevel: 95,
    signalStrength: 87,
    temperature: 28.5,
    cpuLoad: 15,
    memoryUsage: 32,
    uptime: 3600
  },
  location: {
    coordinates: [103.8198, 1.3521], // Singapore coordinates
    altitude: 15,
    speed: 0,
    heading: 0,
    accuracy: 5
  }
});

// Test functions
const runTests = async () => {
  let deviceToken = null;
  
  console.log('🧪 Starting API Tests');
  
  try {
    // Test 1: Register a new device
    console.log('\n📝 Test 1: Register a new device');
    const registerResponse = await axios.post(`${API_URL}/devices`, testDevice, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_admin_token' // This would be a real token in production
      }
    });
    
    console.log(`✅ Device registered: ${registerResponse.data.success}`);
    console.log(`📱 Device ID: ${registerResponse.data.data.deviceId}`);
    deviceToken = registerResponse.data.token;
    console.log(`🔑 Device Token: ${deviceToken}`);
    
    // Test 2: Submit telemetry data
    console.log('\n📊 Test 2: Submit telemetry data');
    const telemetryData = generateTelemetry(testDevice.deviceId, testDevice.batteryId);
    const telemetryResponse = await axios.post(`${API_URL}/telemetry`, telemetryData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken
      }
    });
    
    console.log(`✅ Telemetry submitted: ${telemetryResponse.data.success}`);
    if (telemetryResponse.data.alerts && telemetryResponse.data.alerts.length > 0) {
      console.log(`⚠️ Alerts generated: ${telemetryResponse.data.alerts.length}`);
    }
    
    // Test 3: Get device information
    console.log('\n🔍 Test 3: Get device information');
    const deviceResponse = await axios.get(`${API_URL}/devices/${testDevice.deviceId}`, {
      headers: {
        'Authorization': 'Bearer test_admin_token'
      }
    });
    
    console.log(`✅ Device retrieved: ${deviceResponse.data.success}`);
    console.log(`📱 Device type: ${deviceResponse.data.data.type}`);
    console.log(`🔋 Battery ID: ${deviceResponse.data.data.batteryId}`);
    
    // Test 4: Get latest telemetry
    console.log('\n📈 Test 4: Get latest telemetry');
    const latestTelemetryResponse = await axios.get(`${API_URL}/telemetry/latest`, {
      headers: {
        'Authorization': 'Bearer test_admin_token'
      }
    });
    
    console.log(`✅ Latest telemetry retrieved: ${latestTelemetryResponse.data.success}`);
    console.log(`📊 Telemetry count: ${latestTelemetryResponse.data.count}`);
    
    // Test 5: Submit batch telemetry
    console.log('\n📊 Test 5: Submit batch telemetry');
    const batchData = {
      telemetryBatch: [
        generateTelemetry(testDevice.deviceId, testDevice.batteryId),
        generateTelemetry(testDevice.deviceId, testDevice.batteryId),
        generateTelemetry(testDevice.deviceId, testDevice.batteryId)
      ]
    };
    
    const batchResponse = await axios.post(`${API_URL}/telemetry/batch`, batchData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken
      }
    });
    
    console.log(`✅ Batch telemetry submitted: ${batchResponse.data.success}`);
    console.log(`📊 Processed entries: ${batchResponse.data.message}`);
    
    // Test 6: Get device status (device checking in)
    console.log('\n🔌 Test 6: Get device status');
    const statusResponse = await axios.get(`${API_URL}/devices/${testDevice.deviceId}/status`, {
      headers: {
        'X-Device-Token': deviceToken
      }
    });
    
    console.log(`✅ Device status: ${statusResponse.data.status}`);
    console.log(`⚙️ Config retrieved: ${Object.keys(statusResponse.data.config).length > 0 ? 'Yes' : 'No'}`);
    
    // Test 7: Update device config
    console.log('\n⚙️ Test 7: Update device config');
    const updatedConfig = {
      config: {
        ...testDevice.config,
        telemetryInterval: 30, // Change interval from 60 to 30 seconds
        geofence: {
          ...testDevice.config.geofence,
          radius: 1000 // Change radius from 500 to 1000 meters
        }
      }
    };
    
    const configResponse = await axios.put(`${API_URL}/devices/${testDevice.deviceId}/config`, updatedConfig, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_admin_token'
      }
    });
    
    console.log(`✅ Config updated: ${configResponse.data.success}`);
    console.log(`⏱️ New telemetry interval: ${configResponse.data.data.telemetryInterval}`);
    console.log(`🔘 New geofence radius: ${configResponse.data.data.geofence.radius}`);
    
    // Test 8: Send command to device
    console.log('\n📡 Test 8: Send command to device');
    const command = {
      command: 'restart',
      parameters: {
        delay: 5,
        reason: 'test'
      }
    };
    
    const commandResponse = await axios.post(`${API_URL}/devices/${testDevice.deviceId}/command`, command, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_admin_token'
      }
    });
    
    console.log(`✅ Command sent: ${commandResponse.data.success}`);
    console.log(`🆔 Command ID: ${commandResponse.data.commandId}`);
    
    // Test 9: Get telemetry history
    console.log('\n📜 Test 9: Get telemetry history');
    const historyResponse = await axios.get(`${API_URL}/telemetry/history?deviceIds=${testDevice.deviceId}&interval=1m`, {
      headers: {
        'Authorization': 'Bearer test_admin_token'
      }
    });
    
    console.log(`✅ History retrieved: ${historyResponse.data.success}`);
    console.log(`📊 Data points: ${historyResponse.data.count}`);
    
    // Test 10: Delete test device
    console.log('\n🗑️ Test 10: Delete test device');
    const deleteResponse = await axios.delete(`${API_URL}/devices/${testDevice.deviceId}`, {
      headers: {
        'Authorization': 'Bearer test_admin_token'
      }
    });
    
    console.log(`✅ Device deleted: ${deleteResponse.data.success}`);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

// Run tests
runTests();
