# ChargeX Telematics API Testing Tools

This directory contains a set of testing tools for the ChargeX Telematics API. These tools are designed to help validate the functionality, performance, and reliability of the API.

## Available Test Scripts

### 1. API Tests (`api.test.js`)

Comprehensive test suite that validates all major API endpoints and functionality.

```bash
npm test
```

### 2. Device Simulator (`device-simulator.js`)

Simulates multiple IoT devices sending telemetry data to the API. Useful for testing real-time data processing and device management.

```bash
node tests/device-simulator.js
```

Features:
- Creates multiple simulated devices of different types
- Sends realistic telemetry data at configurable intervals
- Checks for and processes commands from the server
- Automatically cleans up after completion

Configuration options (in the script):
- `deviceCount`: Number of devices to simulate
- `telemetryInterval`: Time between telemetry updates
- `runTime`: Total duration to run the simulator
- `batteryDrainRate`: Rate at which battery levels decrease

### 3. Load Testing (`load-test.js`)

Tests the API's performance under high load conditions.

```bash
node tests/load-test.js
```

Features:
- Creates a large number of test devices
- Sends high volumes of telemetry data in batches
- Measures throughput and response times
- Provides detailed performance metrics

Configuration options (in the script):
- `deviceCount`: Number of devices to create
- `telemetryPerDevice`: Number of telemetry points per device
- `concurrentRequests`: Number of concurrent API requests
- `batchSize`: Size of device creation batches
- `telemetryBatchSize`: Size of telemetry batches

### 4. Blockchain Integration Tests (`blockchain-test.js`)

Tests the blockchain integration features of the API.

```bash
node tests/blockchain-test.js
```

Features:
- Tests device registration on blockchain
- Tests telemetry data logging on blockchain
- Verifies data integrity through blockchain
- Tests blockchain data retrieval

Requirements:
- Requires a running blockchain node (local or testnet)
- Requires the blockchain integration to be enabled in the API

## Environment Configuration

All test scripts use the following environment variables:

- `API_URL`: Base URL of the API (default: `http://localhost:3000/v1`)
- `BLOCKCHAIN_PROVIDER`: URL of the blockchain provider (for blockchain tests)
- `CONTRACT_ADDRESS`: Address of the deployed smart contract (for blockchain tests)
- `ADMIN_PRIVATE_KEY`: Admin private key for blockchain transactions (for blockchain tests)

You can set these in a `.env` file in the project root.

## Test Data

The test scripts generate realistic test data for:

- Device configurations
- Battery telemetry (voltage, current, temperature, state of charge)
- System metrics (battery level, signal strength, CPU load)
- Location data (coordinates, altitude, speed)

## Best Practices

1. Run the API in a test environment before running these tests
2. Start with the basic API tests before moving to simulators or load tests
3. For load testing, start with small numbers and gradually increase
4. Monitor server performance during load tests
5. Clean up test data after running tests

## Extending the Tests

Each test script is modular and can be extended to test additional functionality:

- Add new device types in the device simulator
- Add new telemetry metrics
- Create additional test scenarios
- Customize load testing parameters

## Troubleshooting

If you encounter issues:

1. Check that the API server is running
2. Verify environment variables are correctly set
3. Check network connectivity
4. For blockchain tests, ensure the blockchain node is accessible
5. Review API logs for errors

## Contributing

When adding new tests:

1. Follow the existing patterns for consistency
2. Include proper error handling
3. Add documentation for any new configuration options
4. Test thoroughly before committing
