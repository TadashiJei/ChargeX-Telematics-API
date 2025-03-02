import dotenv from 'dotenv';
import { 
  registerDeviceOnBlockchain, 
  logTelemetryOnBlockchain, 
  getDeviceInfoFromBlockchain,
  getTelemetryLogFromBlockchain 
} from './services/blockchain.service.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Test device data
const testDevice = {
  _id: 'test-device-001',
  deviceType: 'battery-monitor',
  batteryId: 'test-battery-001',
  serialNumber: 'SN12345678',
  firmwareVersion: '1.0.0'
};

// Test telemetry data
const testTelemetry = {
  deviceId: 'test-device-001',
  batteryId: 'test-battery-001',
  timestamp: Date.now(),
  voltage: 48.2,
  current: 2.5,
  temperature: 25.3,
  stateOfCharge: 87.5,
  stateOfHealth: 95.2,
  latitude: 37.7749,
  longitude: -122.4194
};

// Function to run blockchain tests
async function runBlockchainTests() {
  logger.info('Starting blockchain integration tests...');
  
  // Check if blockchain integration is enabled
  if (process.env.BLOCKCHAIN_ENABLED !== 'true') {
    logger.warn('Blockchain integration is disabled. Set BLOCKCHAIN_ENABLED=true in .env to run tests.');
    process.exit(1);
  }
  
  try {
    // Test 1: Register a device on the blockchain
    logger.info('Test 1: Registering device on blockchain...');
    const registrationResult = await registerDeviceOnBlockchain(testDevice);
    
    if (registrationResult) {
      logger.info('✅ Device registration successful!');
      logger.info(`Transaction hash: ${registrationResult.transactionHash}`);
    } else {
      logger.error('❌ Device registration failed!');
    }
    
    // Test 2: Log telemetry data on the blockchain
    logger.info('\nTest 2: Logging telemetry data on blockchain...');
    const telemetryResult = await logTelemetryOnBlockchain(testTelemetry);
    
    if (telemetryResult) {
      logger.info('✅ Telemetry logging successful!');
      logger.info(`Transaction hash: ${telemetryResult.transactionHash}`);
    } else {
      logger.error('❌ Telemetry logging failed!');
    }
    
    // Test 3: Retrieve device information from the blockchain
    logger.info('\nTest 3: Retrieving device information from blockchain...');
    const deviceInfo = await getDeviceInfoFromBlockchain(testDevice._id);
    
    if (deviceInfo) {
      logger.info('✅ Device information retrieval successful!');
      logger.info('Device Info:', deviceInfo);
    } else {
      logger.error('❌ Device information retrieval failed!');
    }
    
    // Test 4: Retrieve telemetry log from the blockchain
    logger.info('\nTest 4: Retrieving telemetry log from blockchain...');
    const telemetryLog = await getTelemetryLogFromBlockchain(testDevice._id, 0);
    
    if (telemetryLog) {
      logger.info('✅ Telemetry log retrieval successful!');
      logger.info('Telemetry Log:', telemetryLog);
    } else {
      logger.error('❌ Telemetry log retrieval failed!');
    }
    
    logger.info('\nBlockchain integration tests completed!');
    
  } catch (error) {
    logger.error('Error during blockchain tests:', error);
  }
}

// Run the tests
runBlockchainTests();
