/**
 * ChargeX Telematics - Blockchain Integration Test Runner
 * 
 * This script runs all blockchain integration tests in sequence and reports results.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const testScripts = [
  { name: 'Blockchain Service Tests', script: 'test-blockchain.js' },
  { name: 'Mock Blockchain Tests', script: 'test-blockchain-mock.js' },
  { name: 'Blockchain API Tests', script: 'test-blockchain-api.js' }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Results storage
const results = {
  passed: 0,
  failed: 0,
  total: testScripts.length,
  details: []
};

/**
 * Run a test script and return a promise that resolves with the test results
 * @param {Object} test - Test configuration object
 * @returns {Promise} - Promise that resolves with test results
 */
function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.bright}${colors.blue}Running: ${test.name}${colors.reset}`);
    console.log(`${colors.dim}Script: ${test.script}${colors.reset}`);
    console.log(`${colors.yellow}----------------------------------------${colors.reset}`);

    // Set environment variables for testing
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      BLOCKCHAIN_ENABLED: 'true',
      USE_MOCK_BLOCKCHAIN: 'true'
    };

    // Spawn the test process
    const testProcess = spawn('node', [path.join(__dirname, 'src', test.script)], { 
      env,
      stdio: 'inherit'
    });

    // Handle process completion
    testProcess.on('close', (code) => {
      const success = code === 0;
      const result = {
        name: test.name,
        script: test.script,
        success,
        exitCode: code
      };

      if (success) {
        results.passed++;
        console.log(`\n${colors.green}✓ ${test.name} passed${colors.reset}`);
      } else {
        results.failed++;
        console.log(`\n${colors.red}✗ ${test.name} failed with exit code ${code}${colors.reset}`);
      }

      results.details.push(result);
      resolve(result);
    });

    // Handle process errors
    testProcess.on('error', (err) => {
      const result = {
        name: test.name,
        script: test.script,
        success: false,
        error: err.message
      };

      results.failed++;
      console.log(`\n${colors.red}✗ ${test.name} failed with error: ${err.message}${colors.reset}`);
      
      results.details.push(result);
      resolve(result);
    });
  });
}

/**
 * Print the final test report
 */
function printReport() {
  console.log(`\n${colors.bright}${colors.blue}Blockchain Integration Test Report${colors.reset}`);
  console.log(`${colors.yellow}========================================${colors.reset}`);
  
  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  console.log(`\n${colors.bright}Details:${colors.reset}`);
  results.details.forEach((result, index) => {
    const statusColor = result.success ? colors.green : colors.red;
    const statusSymbol = result.success ? '✓' : '✗';
    
    console.log(`${index + 1}. ${statusColor}${statusSymbol} ${result.name}${colors.reset}`);
    console.log(`   Script: ${result.script}`);
    
    if (!result.success) {
      if (result.exitCode !== undefined) {
        console.log(`   ${colors.red}Exit Code: ${result.exitCode}${colors.reset}`);
      }
      if (result.error) {
        console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
      }
    }
  });
  
  // Overall status
  if (results.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}All tests passed successfully!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}Some tests failed. Please check the details above.${colors.reset}`);
  }
}

/**
 * Start the blockchain test server
 * @returns {Promise} - Promise that resolves with the server process
 */
function startTestServer() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.bright}${colors.blue}Starting Blockchain Test Server${colors.reset}`);
    console.log(`${colors.yellow}----------------------------------------${colors.reset}`);

    // Set environment variables for the server
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      BLOCKCHAIN_ENABLED: 'true',
      USE_MOCK_BLOCKCHAIN: 'true'
    };

    // Spawn the server process
    const serverProcess = spawn('node', [path.join(__dirname, 'src', 'test-blockchain-server.js')], { 
      env,
      stdio: 'pipe'
    });

    // Capture server output
    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
      serverOutput += data.toString();
      console.log(data.toString().trim());
      
      // If server is ready, resolve the promise
      if (data.toString().includes('Blockchain test server running')) {
        resolve(serverProcess);
      }
    });

    // Handle server errors
    serverProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}${data.toString().trim()}${colors.reset}`);
    });

    // Set a timeout to resolve if the server doesn't indicate it's ready
    setTimeout(() => {
      if (serverOutput.includes('Blockchain test server running')) {
        resolve(serverProcess);
      } else {
        serverProcess.kill();
        reject(new Error('Server failed to start within the timeout period'));
      }
    }, 5000);

    // Handle server process errors
    serverProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}ChargeX Telematics - Blockchain Integration Tests${colors.reset}`);
  console.log(`${colors.yellow}=====================================================${colors.reset}`);
  
  try {
    // Run each test in sequence
    for (const test of testScripts) {
      await runTest(test);
    }
    
    // Start the test server for manual UI testing
    console.log(`\n${colors.bright}${colors.blue}All automated tests completed.${colors.reset}`);
    console.log(`\n${colors.bright}Would you like to start the blockchain test server for UI testing? (y/n)${colors.reset}`);
    
    // This is a simple way to get user input in Node.js
    process.stdin.once('data', async (data) => {
      const input = data.toString().trim().toLowerCase();
      
      if (input === 'y' || input === 'yes') {
        try {
          const serverProcess = await startTestServer();
          
          console.log(`\n${colors.green}${colors.bright}Server started successfully!${colors.reset}`);
          console.log(`${colors.cyan}Open http://localhost:3001/blockchain-test.html in your browser to test the blockchain UI.${colors.reset}`);
          console.log(`${colors.yellow}Press Ctrl+C to stop the server and exit.${colors.reset}`);
          
          // Handle server process termination
          serverProcess.on('close', (code) => {
            console.log(`\n${colors.dim}Server process exited with code ${code}${colors.reset}`);
            printReport();
            process.exit(0);
          });
        } catch (err) {
          console.error(`${colors.red}Failed to start test server: ${err.message}${colors.reset}`);
          printReport();
          process.exit(1);
        }
      } else {
        printReport();
        process.exit(0);
      }
    });
  } catch (err) {
    console.error(`${colors.red}Error running tests: ${err.message}${colors.reset}`);
    printReport();
    process.exit(1);
  }
}

// Run all tests
runAllTests();
