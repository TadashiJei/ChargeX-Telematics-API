# ChargeX Telematics Blockchain Integration

## Overview

The ChargeX Telematics system integrates with blockchain technology to provide secure, immutable storage of device registration and telemetry data. This document provides comprehensive information about the blockchain integration, including architecture, configuration, API endpoints, and testing procedures.

## Architecture

The blockchain integration architecture consists of the following components:

### 1. Blockchain Service

The blockchain service (`blockchain.service.js`) provides the core functionality for interacting with the blockchain:

- Initialization of blockchain connection
- Smart contract interaction
- Transaction management
- Data formatting and parsing

### 2. Smart Contracts

Two smart contracts are used for the blockchain integration:

1. **Device Registry Contract**: Stores device registration information
   - Device ID
   - Device type
   - Associated battery ID
   - Registration timestamp
   - Additional metadata

2. **Telemetry Log Contract**: Stores telemetry data
   - Device ID
   - Timestamp
   - Data hash
   - Additional metadata

### 3. Mock Blockchain Provider

For testing and development, a mock blockchain provider (`mock-blockchain.js`) is implemented:

- Simulates blockchain interactions
- Stores data in memory
- Generates mock transaction hashes
- Provides consistent data retrieval

### 4. API Endpoints

The blockchain functionality is exposed through RESTful API endpoints:

- Device registration
- Telemetry logging
- Device information retrieval
- Telemetry log retrieval

## Configuration

The blockchain integration can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `BLOCKCHAIN_ENABLED` | Enable/disable blockchain integration | `false` |
| `USE_MOCK_BLOCKCHAIN` | Use mock blockchain provider | `false` |
| `BLOCKCHAIN_PROVIDER_URL` | URL of the blockchain provider | `http://localhost:8545` |
| `DEVICE_REGISTRY_CONTRACT_ADDRESS` | Address of the device registry contract | - |
| `TELEMETRY_LOG_CONTRACT_ADDRESS` | Address of the telemetry log contract | - |
| `BLOCKCHAIN_ACCOUNT_ADDRESS` | Address of the account to use for transactions | - |
| `BLOCKCHAIN_PRIVATE_KEY` | Private key for signing transactions | - |

## API Endpoints

### Device Registration

Register a device on the blockchain.

**Endpoint**: `POST /api/v1/blockchain/register-device`

**Authentication**: Required

**Authorization**: Admin role required

**Request Body**:
```json
{
  "deviceId": "device-123",
  "deviceType": "battery-monitor",
  "batteryId": "battery-456",
  "metadata": {
    "manufacturer": "ChargeX",
    "model": "CM-100"
  }
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "deviceId": "device-123"
}
```

### Telemetry Logging

Log telemetry data on the blockchain.

**Endpoint**: `POST /api/v1/blockchain/log-telemetry`

**Authentication**: Required

**Request Body**:
```json
{
  "deviceId": "device-123",
  "timestamp": 1646237022000,
  "data": {
    "batteryLevel": 85,
    "temperature": 25.5,
    "voltage": 12.6,
    "current": 2.1,
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "deviceId": "device-123",
  "dataHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

### Device Information Retrieval

Retrieve device information from the blockchain.

**Endpoint**: `GET /api/v1/blockchain/device-info/:deviceId`

**Authentication**: Required

**Parameters**:
- `deviceId`: ID of the device to retrieve information for

**Response**:
```json
{
  "deviceId": "device-123",
  "deviceType": "battery-monitor",
  "batteryId": "battery-456",
  "registrationTimestamp": 1646236800000,
  "metadata": {
    "manufacturer": "ChargeX",
    "model": "CM-100"
  }
}
```

### Telemetry Log Retrieval

Retrieve telemetry log from the blockchain.

**Endpoint**: `GET /api/v1/blockchain/telemetry-log/:deviceId/:index`

**Authentication**: Required

**Parameters**:
- `deviceId`: ID of the device to retrieve telemetry log for
- `index`: Index of the telemetry log to retrieve

**Response**:
```json
{
  "deviceId": "device-123",
  "timestamp": 1646237022000,
  "dataHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "data": {
    "batteryLevel": 85,
    "temperature": 25.5,
    "voltage": 12.6,
    "current": 2.1,
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

## Testing

### Test Scripts

The blockchain integration includes several test scripts:

1. **`test-blockchain.js`**: Tests blockchain service functions directly
2. **`test-blockchain-mock.js`**: Tests mock blockchain provider
3. **`test-blockchain-api.js`**: Tests blockchain API endpoints
4. **`test-blockchain-server.js`**: Lightweight test server for UI testing

### Running Tests

To run all blockchain tests, use the provided script:

```bash
./run-blockchain-tests.sh
```

This script will:
1. Create a `.env.blockchain-test` file if it doesn't exist
2. Install dependencies if needed
3. Run all blockchain tests in sequence
4. Optionally start the test server for UI testing

### Test UI

A test UI is provided at `/blockchain-test.html` for manual testing of blockchain functionality:

- Device registration
- Telemetry logging
- Device information retrieval
- Telemetry log retrieval

## Implementation Details

### Blockchain Service

The blockchain service (`blockchain.service.js`) is implemented as follows:

```javascript
class BlockchainService {
  constructor() {
    this.initialized = false;
    this.web3 = null;
    this.deviceRegistryContract = null;
    this.telemetryLogContract = null;
    this.account = null;
  }

  async initialize() {
    // Initialize blockchain connection
    // Load smart contracts
    // Set up account
  }

  async registerDeviceOnBlockchain(device) {
    // Register device on blockchain
    // Return transaction receipt
  }

  async logTelemetryOnBlockchain(telemetryData) {
    // Hash telemetry data
    // Log on blockchain
    // Return transaction receipt
  }

  async getDeviceInfoFromBlockchain(deviceId) {
    // Retrieve device info from blockchain
    // Format and return
  }

  async getTelemetryLogFromBlockchain(deviceId, index) {
    // Retrieve telemetry log from blockchain
    // Format and return
  }
}
```

### Mock Blockchain Provider

The mock blockchain provider (`mock-blockchain.js`) is implemented as follows:

```javascript
class MockBlockchainProvider {
  constructor() {
    this.devices = new Map();
    this.telemetryLogs = new Map();
  }

  async registerDevice(device) {
    // Store device in memory
    // Generate mock transaction hash
    // Return receipt
  }

  async logTelemetry(telemetryData) {
    // Hash telemetry data
    // Store in memory
    // Generate mock transaction hash
    // Return receipt
  }

  async getDeviceInfo(deviceId) {
    // Retrieve device from memory
    // Format and return
  }

  async getTelemetryLog(deviceId, index) {
    // Retrieve telemetry log from memory
    // Format and return
  }
}
```

## Production Deployment

For production deployment, follow these steps:

1. **Smart Contract Deployment**:
   - Deploy smart contracts to a test network
   - Validate contract functionality
   - Deploy to mainnet when ready

2. **Configuration Update**:
   - Update environment variables with production values
   - Configure real blockchain provider URL
   - Set up proper key management for transaction signing

3. **Monitoring and Maintenance**:
   - Implement monitoring for blockchain transactions
   - Set up alerts for failed transactions
   - Implement periodic validation of blockchain data integrity

## Security Considerations

When deploying the blockchain integration to production, consider the following security aspects:

1. **Private Key Management**:
   - Use a secure key management solution
   - Never store private keys in code or unencrypted configuration files
   - Consider using a hardware security module (HSM) for key storage

2. **Transaction Signing**:
   - Implement proper transaction signing procedures
   - Consider using multi-signature wallets for critical operations
   - Implement transaction approval workflows for high-value operations

3. **Smart Contract Security**:
   - Conduct thorough security audits of smart contracts
   - Implement access control mechanisms
   - Consider using upgradeable smart contracts

4. **Gas Management**:
   - Implement proper gas price estimation
   - Set up monitoring for gas costs
   - Implement retry mechanisms for failed transactions

## Conclusion

The blockchain integration provides a secure and immutable way to store device registration and telemetry data in the ChargeX Telematics system. The implementation is flexible, allowing for both testing with a mock provider and production use with a real blockchain.

For any questions or issues, please contact the ChargeX development team.
