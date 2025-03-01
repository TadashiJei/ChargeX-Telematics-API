import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Web3 from 'web3';

// Load environment variables
dotenv.config();

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:3000/v1';

// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
  provider: process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:8545',
  contractAddress: process.env.CONTRACT_ADDRESS,
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY
};

// Test configuration
const CONFIG = {
  deviceCount: 3,
  telemetryCount: 5,
  verificationCount: 3
};

// Storage
const devices = [];
const telemetryHashes = [];

// Initialize Web3
let web3;
try {
  web3 = new Web3(BLOCKCHAIN_CONFIG.provider);
  console.log(`Connected to blockchain at ${BLOCKCHAIN_CONFIG.provider}`);
} catch (error) {
  console.error(`Failed to connect to blockchain: ${error.message}`);
  process.exit(1);
}

// Simple ABI for device registry contract (adjust based on your actual contract)
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "deviceId", "type": "string" },
      { "internalType": "string", "name": "deviceType", "type": "string" },
      { "internalType": "string", "name": "metadata", "type": "string" }
    ],
    "name": "registerDevice",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "deviceId", "type": "string" },
      { "internalType": "string", "name": "dataHash", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "logTelemetry",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "deviceId", "type": "string" }],
    "name": "getDeviceInfo",
    "outputs": [
      { "internalType": "string", "name": "deviceType", "type": "string" },
      { "internalType": "string", "name": "metadata", "type": "string" },
      { "internalType": "uint256", "name": "registrationTime", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "deviceId", "type": "string" },
      { "internalType": "string", "name": "dataHash", "type": "string" }
    ],
    "name": "verifyTelemetry",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize contract
let contract;
if (BLOCKCHAIN_CONFIG.contractAddress) {
  try {
    contract = new web3.eth.Contract(CONTRACT_ABI, BLOCKCHAIN_CONFIG.contractAddress);
    console.log(`Connected to contract at ${BLOCKCHAIN_CONFIG.contractAddress}`);
  } catch (error) {
    console.error(`Failed to connect to contract: ${error.message}`);
    process.exit(1);
  }
}

// Create devices
const createDevices = async () => {
  console.log(`Creating ${CONFIG.deviceCount} devices with blockchain registration...`);
  
  for (let i = 0; i < CONFIG.deviceCount; i++) {
    const deviceId = `blockchain_${uuidv4().substring(0, 8)}`;
    const batteryId = `blockchain_battery_${uuidv4().substring(0, 8)}`;
    
    const device = {
      deviceId,
      type: 'blockchain_device',
      name: `Blockchain Test Device ${i}`,
      batteryId,
      firmware: {
        version: '1.0.0',
        lastUpdated: new Date()
      },
      blockchain: {
        enabled: true,
        network: 'test'
      },
      config: {
        telemetryInterval: 30,
        blockchain: {
          logFrequency: 1, // Log every telemetry point
          verificationEnabled: true
        }
      }
    };
    
    try {
      // Register device through API
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
          token: response.data.token,
          blockchainTx: response.data.blockchainTx
        });
        
        console.log(`Device registered: ${deviceId}`);
        
        if (response.data.blockchainTx) {
          console.log(`Blockchain transaction: ${response.data.blockchainTx}`);
        }
      }
    } catch (error) {
      console.error(`Failed to register device ${deviceId}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  console.log(`Created ${devices.length} devices with blockchain registration`);
};

// Generate telemetry for a device
const generateTelemetry = (device) => {
  return {
    deviceId: device.deviceId,
    batteryId: device.batteryId,
    timestamp: new Date(),
    battery: {
      voltage: {
        total: 12.6,
        cells: [3.15, 3.15, 3.15, 3.15]
      },
      current: 2.5,
      temperature: {
        average: 25,
        cells: [24, 25, 26, 25]
      },
      soc: 85,
      health: 98,
      cycles: 25
    },
    system: {
      batteryLevel: 90,
      signalStrength: 85,
      temperature: 30,
      cpuLoad: 15,
      memoryUsage: 35,
      uptime: 7200
    },
    location: {
      coordinates: [103.8198, 1.3521],
      altitude: 15,
      speed: 0,
      heading: 90,
      accuracy: 5
    },
    blockchain: {
      log: true
    }
  };
};

// Send telemetry for all devices
const sendTelemetry = async () => {
  console.log(`Sending ${CONFIG.telemetryCount} telemetry points per device with blockchain logging...`);
  
  for (const device of devices) {
    for (let i = 0; i < CONFIG.telemetryCount; i++) {
      try {
        const telemetry = generateTelemetry(device);
        
        const response = await axios.post(`${API_URL}/telemetry`, telemetry, {
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Token': device.token
          }
        });
        
        if (response.data.success) {
          console.log(`Telemetry sent for ${device.deviceId} (${i + 1}/${CONFIG.telemetryCount})`);
          
          if (response.data.blockchainTx) {
            console.log(`Blockchain transaction: ${response.data.blockchainTx}`);
            telemetryHashes.push({
              deviceId: device.deviceId,
              hash: response.data.dataHash,
              tx: response.data.blockchainTx
            });
          }
        }
      } catch (error) {
        console.error(`Failed to send telemetry for ${device.deviceId}:`, 
          error.response?.data?.message || error.message);
      }
    }
  }
  
  console.log(`Sent telemetry with ${telemetryHashes.length} blockchain entries`);
};

// Verify telemetry on blockchain
const verifyTelemetry = async () => {
  console.log(`Verifying ${CONFIG.verificationCount} telemetry entries on blockchain...`);
  
  // Select random entries to verify
  const samplesToVerify = [];
  for (let i = 0; i < Math.min(CONFIG.verificationCount, telemetryHashes.length); i++) {
    const randomIndex = Math.floor(Math.random() * telemetryHashes.length);
    samplesToVerify.push(telemetryHashes[randomIndex]);
  }
  
  for (const sample of samplesToVerify) {
    try {
      // Verify through API
      const response = await axios.get(
        `${API_URL}/blockchain/verify?deviceId=${sample.deviceId}&dataHash=${sample.hash}`,
        {
          headers: {
            'Authorization': 'Bearer test_admin_token'
          }
        }
      );
      
      if (response.data.verified) {
        console.log(`✅ Verified telemetry for ${sample.deviceId} (hash: ${sample.hash})`);
        console.log(`  Transaction: ${sample.tx}`);
        console.log(`  Block: ${response.data.blockNumber}`);
        console.log(`  Timestamp: ${new Date(response.data.timestamp * 1000).toISOString()}`);
      } else {
        console.log(`❌ Failed to verify telemetry for ${sample.deviceId} (hash: ${sample.hash})`);
      }
    } catch (error) {
      console.error(`Error verifying telemetry:`, 
        error.response?.data?.message || error.message);
    }
  }
};

// Get blockchain device info
const getBlockchainDeviceInfo = async () => {
  console.log(`Getting blockchain info for ${devices.length} devices...`);
  
  for (const device of devices) {
    try {
      const response = await axios.get(
        `${API_URL}/blockchain/device/${device.deviceId}`,
        {
          headers: {
            'Authorization': 'Bearer test_admin_token'
          }
        }
      );
      
      if (response.data.found) {
        console.log(`Device ${device.deviceId} blockchain info:`);
        console.log(`  Type: ${response.data.deviceType}`);
        console.log(`  Registration Time: ${new Date(response.data.registrationTime * 1000).toISOString()}`);
        console.log(`  Active: ${response.data.isActive}`);
        console.log(`  Telemetry Count: ${response.data.telemetryCount}`);
      } else {
        console.log(`Device ${device.deviceId} not found on blockchain`);
      }
    } catch (error) {
      console.error(`Error getting blockchain device info:`, 
        error.response?.data?.message || error.message);
    }
  }
};

// Clean up devices
const cleanupDevices = async () => {
  console.log(`Cleaning up ${devices.length} blockchain test devices...`);
  
  for (const device of devices) {
    try {
      const response = await axios.delete(`${API_URL}/devices/${device.deviceId}`, {
        headers: {
          'Authorization': 'Bearer test_admin_token'
        }
      });
      
      if (response.data.success) {
        console.log(`Device deleted: ${device.deviceId}`);
        
        if (response.data.blockchainTx) {
          console.log(`Blockchain deactivation transaction: ${response.data.blockchainTx}`);
        }
      }
    } catch (error) {
      console.error(`Failed to delete device ${device.deviceId}:`, 
        error.response?.data?.message || error.message);
    }
  }
  
  console.log(`Cleaned up ${devices.length} devices`);
};

// Direct blockchain interaction (for verification)
const directBlockchainVerification = async () => {
  if (!contract || telemetryHashes.length === 0) {
    console.log('Skipping direct blockchain verification (no contract or telemetry hashes)');
    return;
  }
  
  console.log('Performing direct blockchain verification...');
  
  // Select a random telemetry hash to verify
  const randomSample = telemetryHashes[Math.floor(Math.random() * telemetryHashes.length)];
  
  try {
    // Call the contract directly
    const result = await contract.methods.verifyTelemetry(
      randomSample.deviceId,
      randomSample.hash
    ).call();
    
    console.log(`Direct blockchain verification for ${randomSample.deviceId} (hash: ${randomSample.hash}):`);
    console.log(`  Result: ${result ? '✅ Verified' : '❌ Not verified'}`);
  } catch (error) {
    console.error('Error in direct blockchain verification:', error.message);
  }
};

// Run blockchain test
const runBlockchainTest = async () => {
  console.log('Starting blockchain integration test...');
  
  try {
    // Create devices with blockchain registration
    await createDevices();
    
    if (devices.length === 0) {
      console.error('No devices created, exiting test');
      return;
    }
    
    // Send telemetry with blockchain logging
    await sendTelemetry();
    
    // Wait for blockchain transactions to be mined
    console.log('Waiting for blockchain transactions to be mined...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify telemetry on blockchain
    await verifyTelemetry();
    
    // Get blockchain device info
    await getBlockchainDeviceInfo();
    
    // Direct blockchain verification
    await directBlockchainVerification();
    
    // Clean up
    await cleanupDevices();
    
    console.log('Blockchain integration test completed');
  } catch (error) {
    console.error('Blockchain test error:', error.message);
  }
};

// Run the blockchain test
runBlockchainTest();
