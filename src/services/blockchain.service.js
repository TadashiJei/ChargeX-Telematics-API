import Web3 from 'web3';
import logger from '../utils/logger.js';

// Initialize Web3 with provider from environment variable
const web3 = new Web3(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545');

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

if (deviceRegistryAddress) {
  deviceRegistryContract = new web3.eth.Contract(deviceRegistryABI, deviceRegistryAddress);
}

if (telemetryLogAddress) {
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
    
    // Check if contract is initialized
    if (!deviceRegistryContract) {
      logger.error('Device registry contract not initialized');
      return null;
    }
    
    // Check if account is available
    if (!accountAddress) {
      logger.error('Blockchain account address not configured');
      return null;
    }
    
    // Prepare transaction
    const { deviceId, type, batteryId } = device;
    
    // Create transaction data
    const data = deviceRegistryContract.methods.registerDevice(
      deviceId,
      type,
      batteryId || ''
    ).encodeABI();
    
    // Send transaction
    const result = await sendTransaction(deviceRegistryAddress, data);
    
    logger.info(`Device ${deviceId} registered on blockchain, tx: ${result.transactionHash}`);
    
    return {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      timestamp: new Date()
    };
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
    
    // Check if contract is initialized
    if (!telemetryLogContract) {
      logger.error('Telemetry log contract not initialized');
      return null;
    }
    
    // Check if account is available
    if (!accountAddress) {
      logger.error('Blockchain account address not configured');
      return null;
    }
    
    // Prepare transaction
    const { deviceId, batteryId, timestamp } = telemetryData;
    
    // Create data hash (in a real implementation, this would be a hash of the telemetry data)
    const dataHash = web3.utils.sha3(JSON.stringify(telemetryData));
    
    // Create transaction data
    const data = telemetryLogContract.methods.logTelemetry(
      deviceId,
      batteryId || '',
      dataHash,
      Math.floor(new Date(timestamp || Date.now()).getTime() / 1000)
    ).encodeABI();
    
    // Send transaction
    const result = await sendTransaction(telemetryLogAddress, data);
    
    logger.info(`Telemetry data logged on blockchain, tx: ${result.transactionHash}`);
    
    return {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      dataHash,
      timestamp: new Date()
    };
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
    
    // Check if contract is initialized
    if (!deviceRegistryContract) {
      logger.error('Device registry contract not initialized');
      return null;
    }
    
    // Call contract method
    const result = await deviceRegistryContract.methods.getDeviceInfo(deviceId).call();
    
    return {
      id: result.id,
      deviceType: result.deviceType,
      batteryId: result.batteryId,
      registrationTime: new Date(result.registrationTime * 1000)
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
      timestamp: new Date(result.timestamp * 1000)
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
const sendTransaction = async (to, data) => {
  try {
    // Check if private key is available for signing
    if (privateKey) {
      // Create and sign transaction
      const tx = {
        from: accountAddress,
        to,
        data,
        gas: 500000,
        gasPrice: await web3.eth.getGasPrice()
      };
      
      // Sign transaction
      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
      
      // Send signed transaction
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      return receipt;
    } else {
      // Use unlocked account (for development)
      const receipt = await web3.eth.sendTransaction({
        from: accountAddress,
        to,
        data,
        gas: 500000
      });
      
      return receipt;
    }
  } catch (error) {
    logger.error('Error sending blockchain transaction:', error);
    throw new Error('Failed to send blockchain transaction');
  }
};

/**
 * Initialize blockchain event listeners
 */
export const initBlockchainListener = () => {
  if (process.env.ENABLE_BLOCKCHAIN !== 'true') {
    logger.info('Blockchain integration is disabled');
    return null;
  }

  try {
    logger.info('Initializing blockchain event listeners...');
    
    // Subscribe to new block headers
    const subscription = web3.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
      if (error) {
        logger.error('Error in blockchain subscription:', error);
        return;
      }
      
      logger.debug(`New block received: ${blockHeader.number}`);
    });
    
    // Handle subscription errors
    subscription.on('error', error => {
      logger.error('Blockchain subscription error:', error);
    });
    
    logger.info('Blockchain event listeners initialized successfully');
    return subscription;
  } catch (error) {
    logger.error('Failed to initialize blockchain listeners:', error);
    return null;
  }
};

export default {
  registerDeviceOnBlockchain,
  logTelemetryOnBlockchain,
  getDeviceInfoFromBlockchain,
  getTelemetryLogFromBlockchain,
  sendTransaction,
  initBlockchainListener
};
