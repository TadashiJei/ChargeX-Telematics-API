#!/bin/bash

# ChargeX Telematics - Blockchain Integration Tests Runner
# This script sets up the environment and runs the blockchain integration tests

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}   ChargeX Telematics - Blockchain Integration Tests   ${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Check if .env.blockchain-test exists
if [ ! -f .env.blockchain-test ]; then
  echo -e "${YELLOW}Creating .env.blockchain-test file...${NC}"
  cat > .env.blockchain-test << EOL
# Blockchain test environment variables
NODE_ENV=test
BLOCKCHAIN_ENABLED=true
USE_MOCK_BLOCKCHAIN=true
BLOCKCHAIN_PROVIDER_URL=http://localhost:8545
DEVICE_REGISTRY_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
TELEMETRY_LOG_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
BLOCKCHAIN_ACCOUNT_ADDRESS=0x0000000000000000000000000000000000000000
BLOCKCHAIN_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000000
EOL
  echo -e "${GREEN}Created .env.blockchain-test file${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. Please run npm install manually.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Dependencies installed successfully${NC}"
fi

# Run the tests
echo -e "${YELLOW}Running blockchain integration tests...${NC}"
node run-blockchain-tests.js

# Exit with the same code as the tests
exit $?
