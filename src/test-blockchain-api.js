import fetch from 'node-fetch';
import logger from './utils/logger.js';

// Base URL for API
const API_BASE_URL = 'http://localhost:3000/api/v1/blockchain';

// Test device data
const testDevice = {
  _id: 'test-device-002',
  deviceType: 'battery-monitor',
  batteryId: 'test-battery-002',
  serialNumber: 'SN98765432',
  firmwareVersion: '1.0.0'
};

// Test telemetry data
const testTelemetry = {
  deviceId: 'test-device-002',
  batteryId: 'test-battery-002',
  timestamp: Date.now(),
  voltage: 49.5,
  current: 3.2,
  temperature: 26.7,
  stateOfCharge: 92.1,
  stateOfHealth: 97.8,
  latitude: 37.7833,
  longitude: -122.4167
};

// Mock auth token (in a real app, you would get this from a login endpoint)
const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwicm9sZSI6ImFkbWluIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Function to test blockchain API endpoints
async function testBlockchainAPI() {
  logger.info('Starting blockchain API tests...');
  
  try {
    // Test 1: Register a device on the blockchain
    logger.info('Test 1: Registering device via API...');
    const registerResponse = await fetch(`${API_BASE_URL}/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: JSON.stringify(testDevice)
    });
    
    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      logger.info('✅ Device registration API call successful!');
      logger.info('Response:', registerResult);
    } else {
      logger.error('❌ Device registration API call failed!');
      logger.error('Error:', registerResult);
    }
    
    // Test 2: Log telemetry data on the blockchain
    logger.info('\nTest 2: Logging telemetry data via API...');
    const telemetryResponse = await fetch(`${API_BASE_URL}/log-telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: JSON.stringify(testTelemetry)
    });
    
    const telemetryResult = await telemetryResponse.json();
    
    if (telemetryResponse.ok) {
      logger.info('✅ Telemetry logging API call successful!');
      logger.info('Response:', telemetryResult);
    } else {
      logger.error('❌ Telemetry logging API call failed!');
      logger.error('Error:', telemetryResult);
    }
    
    // Test 3: Retrieve device information from the blockchain
    logger.info('\nTest 3: Retrieving device information via API...');
    const deviceInfoResponse = await fetch(`${API_BASE_URL}/device-info/${testDevice._id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });
    
    const deviceInfoResult = await deviceInfoResponse.json();
    
    if (deviceInfoResponse.ok) {
      logger.info('✅ Device information retrieval API call successful!');
      logger.info('Response:', deviceInfoResult);
    } else {
      logger.error('❌ Device information retrieval API call failed!');
      logger.error('Error:', deviceInfoResult);
    }
    
    // Test 4: Retrieve telemetry log from the blockchain
    logger.info('\nTest 4: Retrieving telemetry log via API...');
    const telemetryLogResponse = await fetch(`${API_BASE_URL}/telemetry-log/${testDevice._id}/0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });
    
    const telemetryLogResult = await telemetryLogResponse.json();
    
    if (telemetryLogResponse.ok) {
      logger.info('✅ Telemetry log retrieval API call successful!');
      logger.info('Response:', telemetryLogResult);
    } else {
      logger.error('❌ Telemetry log retrieval API call failed!');
      logger.error('Error:', telemetryLogResult);
    }
    
    logger.info('\nBlockchain API tests completed!');
    
  } catch (error) {
    logger.error('Error during blockchain API tests:', error);
  }
}

// Run the tests
testBlockchainAPI();
