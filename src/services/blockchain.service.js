import Web3 from 'web3';
import logger from '../utils/logger.js';
import mockBlockchainProvider from '../utils/mock-blockchain.js';

// Initialize Web3 with provider from environment variable
const web3 = new Web3(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545');

// Flag to determine if we're using the mock provider
const useMockProvider = process.env.USE_MOCK_BLOCKCHAIN === 'true' || !process.env.BLOCKCHAIN_PROVIDER_URL;

// Contract ABIs (would be loaded from JSON files in production)
const deviceRegistryABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "deviceId", "type": "string" },
      { "internalType": "string", "name": "deviceType", "type": "string" },
      { "internalType": "string", "name": "batteryId", "type": "string" }
    ],
    "name": "registerDevice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "deviceId", "type": "string" }],
    "name": "getDeviceInfo",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "deviceType", "type": "string" },
      { "internalType": "string", "name": "batteryId", "type": "string" },
      { "internalType": "uint256", "name": "registrationTime", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const telemetryLogABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "deviceId", "type": "string" },
      { "internalType": "string", "name": "batteryId", "type": "string" },
      { "internalType": "string", "name": "dataHash", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "logTelemetry",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "deviceId", "type": "string" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "getTelemetryLog",
    "outputs": [
      { "internalType": "string", "name": "batteryId", "type": "string" },
      { "internalType": "string", "name": "dataHash", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses from environment variables
const deviceRegistryAddress = process.env.DEVICE_REGISTRY_CONTRACT_ADDRESS;
const telemetryLogAddress = process.env.TELEMETRY_LOG_CONTRACT_ADDRESS;

// Initialize contract instances if addresses are provided
let deviceRegistryContract = null;
let telemetryLogContract = null;

if (deviceRegistryAddress && !useMockProvider) {
  deviceRegistryContract = new web3.eth.Contract(deviceRegistryABI, deviceRegistryAddress);
}

if (telemetryLogAddress && !useMockProvider) {
  telemetryLogContract = new web3.eth.Contract(telemetryLogABI, telemetryLogAddress);
}

// Account to use for transactions (from environment variable)
const accountAddress = process.env.BLOCKCHAIN_ACCOUNT_ADDRESS;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

/**
 * Register a device on the blockchain
 * @param {Object} device - Device object
 * @returns {Promise<Object>} Transaction result
 */
export const registerDeviceOnBlockchain = async (device) => {
  try {
    // Check if blockchain integration is enabled
    if (!process.env.BLOCKCHAIN_ENABLED || process.env.BLOCKCHAIN_ENABLED !== 'true') {
      logger.info('Blockchain integration is disabled');
      return null;
    }
    
    // Use mock provider if configured or if real blockchain is not available
    if (useMockProvider) {
      logger.info('Using mock blockchain provider for device registration');
      return mockBlockchainProvider.registerDevice(device);
    }
    
    // Check if contract is initialized
    if (!deviceRegistryContract) {
      logger.error('Device registry contract not initialized');
      return null;
    }
    
    // Check if account address is configured
    if (!accountAddress) {
      logger.error('Blockchain account address not configured');
      return null;
    }
    
    // Prepare contract method call
    const data = deviceRegistryContract.methods.registerDevice(
      device._id,
      device.deviceType || 'unknown',
      device.batteryId || 'unknown'
    ).encodeABI();
    
    // Send transaction
    const result = await sendTransaction(deviceRegistryAddress, data);
    
    logger.info(`Device ${device._id} registered on blockchain, tx: ${result.transactionHash}`);
    
    return result;
  } catch (error) {
    logger.error(`Error registering device on blockchain:`, error);
    return null;
  }
};

/**
 * Log telemetry data on the blockchain
 * @param {Object} telemetryData - Telemetry data
 * @returns {Promise<Object>} Transaction result
 */
export const logTelemetryOnBlockchain = async (telemetryData) => {
  try {
    // Check if blockchain integration is enabled
    if (!process.env.BLOCKCHAIN_ENABLED || process.env.BLOCKCHAIN_ENABLED !== 'true') {
      logger.info('Blockchain integration is disabled');
      return null;
    }
    
    // Use mock provider if configured or if real blockchain is not available
    if (useMockProvider) {
      logger.info('Using mock blockchain provider for telemetry logging');
      return mockBlockchainProvider.logTelemetry(telemetryData);
    }
    
    // Check if contract is initialized
    if (!telemetryLogContract) {
      logger.error('Telemetry log contract not initialized');
      return null;
    }
    
    // Check if account address is configured
    if (!accountAddress) {
      logger.error('Blockchain account address not configured');
      return null;
    }
    
    // Create a hash of the telemetry data
    const dataHash = Buffer.from(JSON.stringify(telemetryData)).toString('base64');
    
    // Prepare contract method call
    const data = telemetryLogContract.methods.logTelemetry(
      telemetryData.deviceId,
      telemetryData.batteryId || 'unknown',
      dataHash,
      telemetryData.timestamp || Math.floor(Date.now() / 1000)
    ).encodeABI();
    
    // Send transaction
    const result = await sendTransaction(telemetryLogAddress, data);
    
    logger.info(`Telemetry data logged on blockchain, tx: ${result.transactionHash}`);
    
    return result;
  } catch (error) {
    logger.error(`Error logging telemetry on blockchain:`, error);
    return null;
  }
};

/**
 * Get device information from the blockchain
 * @param {String} deviceId - Device ID
 * @returns {Promise<Object>} Device information
 */
export const getDeviceInfoFromBlockchain = async (deviceId) => {
  try {
    // Check if blockchain integration is enabled
    if (!process.env.BLOCKCHAIN_ENABLED || process.env.BLOCKCHAIN_ENABLED !== 'true') {
      logger.info('Blockchain integration is disabled');
      return null;
    }
    
    // Use mock provider if configured or if real blockchain is not available
    if (useMockProvider) {
      logger.info('Using mock blockchain provider for device info retrieval');
      return mockBlockchainProvider.getDeviceInfo(deviceId);
    }
    
    // Check if contract is initialized
    if (!deviceRegistryContract) {
      logger.error('Device registry contract not initialized');
      return null;
    }
    
    // Call contract method
    const result = await deviceRegistryContract.methods.getDeviceInfo(deviceId).call();
    
    return {
      id: parseInt(result.id),
      deviceId,
      deviceType: result.deviceType,
      batteryId: result.batteryId,
      registrationTime: parseInt(result.registrationTime) * 1000 // Convert to milliseconds
    };
  } catch (error) {
    logger.error(`Error getting device info from blockchain:`, error);
    return null;
  }
};

/**
 * Get telemetry log from the blockchain
 * @param {String} deviceId - Device ID
 * @param {Number} index - Log index
 * @returns {Promise<Object>} Telemetry log
 */
export const getTelemetryLogFromBlockchain = async (deviceId, index) => {
  try {
    // Check if blockchain integration is enabled
    if (!process.env.BLOCKCHAIN_ENABLED || process.env.BLOCKCHAIN_ENABLED !== 'true') {
      logger.info('Blockchain integration is disabled');
      return null;
    }
    
    // Use mock provider if configured or if real blockchain is not available
    if (useMockProvider) {
      logger.info('Using mock blockchain provider for telemetry log retrieval');
      return mockBlockchainProvider.getTelemetryLog(deviceId, index);
    }
    
    // Check if contract is initialized
    if (!telemetryLogContract) {
      logger.error('Telemetry log contract not initialized');
      return null;
    }
    
    // Call contract method
    const result = await telemetryLogContract.methods.getTelemetryLog(deviceId, index).call();
    
    return {
      batteryId: result.batteryId,
      dataHash: result.dataHash,
      timestamp: parseInt(result.timestamp) * 1000 // Convert to milliseconds
    };
  } catch (error) {
    logger.error(`Error getting telemetry log from blockchain:`, error);
    return null;
  }
};

/**
 * Send a transaction to the blockchain
 * @param {String} to - Contract address
 * @param {String} data - Transaction data
 * @returns {Promise<Object>} Transaction receipt
 */
async function sendTransaction(to, data) {
  try {
    // Get current gas price
    const gasPrice = await web3.eth.getGasPrice();
    
    // Estimate gas for the transaction
    const gasLimit = await web3.eth.estimateGas({
      from: accountAddress,
      to,
      data
    });
    
    // Get the current nonce for the account
    const nonce = await web3.eth.getTransactionCount(accountAddress);
    
    // Create transaction object
    const txObject = {
      nonce: web3.utils.toHex(nonce),
      gasPrice: web3.utils.toHex(gasPrice),
      gasLimit: web3.utils.toHex(gasLimit),
      to,
      data,
      from: accountAddress
    };
    
    // Sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
    
    // Send the transaction
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    return receipt;
  } catch (error) {
    logger.error('Error sending blockchain transaction:', error);
    throw new Error('Failed to send blockchain transaction');
  }
}

/**
 * Initialize blockchain event listeners
 */
export const initBlockchainListener = () => {
  if (process.env.ENABLE_BLOCKCHAIN !== 'true') {
    logger.info('Blockchain integration is disabled');
    return;
  }
  
  try {
    // Use mock provider if configured or if real blockchain is not available
    if (useMockProvider) {
      logger.info('Using mock blockchain provider - event listeners not applicable');
      return;
    }
    
    logger.info('Initializing blockchain event listeners...');
    
    // Example: Listen for device registration events
    if (deviceRegistryContract) {
      deviceRegistryContract.events.DeviceRegistered({})
        .on('data', (event) => {
          logger.info(`Device registered event received: ${JSON.stringify(event.returnValues)}`);
        })
        .on('error', (error) => {
          logger.error('Error in blockchain subscription:', error);
        });
    }
    
    // Example: Listen for telemetry log events
    if (telemetryLogContract) {
      telemetryLogContract.events.TelemetryLogged({})
        .on('data', (event) => {
          logger.info(`Telemetry logged event received: ${JSON.stringify(event.returnValues)}`);
        })
        .on('error', (error) => {
          logger.error('Blockchain subscription error:', error);
        });
    }
    
    logger.info('Blockchain event listeners initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize blockchain listeners:', error);
  }
};

export default {
  registerDeviceOnBlockchain,
  logTelemetryOnBlockchain,
  getDeviceInfoFromBlockchain,
  getTelemetryLogFromBlockchain,
  initBlockchainListener
};
