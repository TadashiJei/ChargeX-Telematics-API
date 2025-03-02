# Rivalz.ai Decentralized Storage Integration

This document outlines the integration of Rivalz.ai's decentralized storage solution with the ChargeX Telematics system.

## Overview

The ChargeX Telematics system now integrates with Rivalz.ai's decentralized storage for telemetry data management. This integration provides:

1. **Distributed P2P Network**: Eliminates single points of failure and enhances data availability
2. **Vector Storage Optimization**: Specialized for efficient storage and retrieval of complex data types
3. **Enhanced Data Ownership**: Users retain complete control over their data
4. **Global Accessibility**: Data can be accessed from anywhere in the world
5. **Cost-Effective Solution**: Lower storage costs compared to traditional cloud solutions

## Configuration

To enable the Rivalz.ai integration, configure the following environment variables:

```
RIVALZ_ENABLED=true
RIVALZ_SECRET_TOKEN=your_rivalz_secret_token
```

You can copy these from the `.env.example` file and add them to your `.env` file.

## Implementation Details

### Current Implementation Status

The current implementation uses simulated responses for testing purposes until the Rivalz.ai API endpoints are finalized. This allows development and testing to continue while the API integration is being completed.

### Features

The Rivalz.ai integration provides the following features:

1. **PDF Generation**: Convert telemetry data to PDF format for storage
2. **Decentralized Storage**: Upload files to Rivalz.ai's decentralized storage network
3. **Knowledge Base Creation**: Create AI-powered knowledge bases from stored documents
4. **Natural Language Querying**: Query telemetry data using natural language
5. **Conversation Tracking**: Support for follow-up questions with conversation context

### API Endpoints

The integration uses the following Rivalz.ai API endpoints (currently simulated):

- `/storage/upload`: Upload files to decentralized storage
- `/knowledge-bases`: Create and manage knowledge bases
- `/query`: Query knowledge bases with natural language
- `/knowledge-bases/{id}`: Delete knowledge bases
- `/storage/{id}`: Delete files from storage

## Usage Examples

### Processing Telemetry Data

```javascript
// Import the service
import rivalzService from './services/rivalz.service.js';

// Process telemetry data
const result = await rivalzService.processTelemetryData(telemetryData, deviceId);
console.log(`Knowledge base created with ID: ${result.knowledgeBaseId}`);
```

### Querying Telemetry Data

```javascript
// Import the service
import rivalzService from './services/rivalz.service.js';

// Query a knowledge base
const response = await rivalzService.queryKnowledgeBase(
  knowledgeBaseId,
  'What was the battery level over the last 24 hours?'
);
console.log(`Answer: ${response.answer}`);

// Follow-up question using the same conversation
const followUpResponse = await rivalzService.queryKnowledgeBase(
  knowledgeBaseId,
  'And what about the temperature?',
  response.conversationId
);
console.log(`Follow-up answer: ${followUpResponse.answer}`);
```

## Testing

A test script is provided at `src/test-rivalz.js` to demonstrate the integration. Run it with:

```
node src/test-rivalz.js
```

The test script:
1. Generates a PDF from mock telemetry data
2. Uploads it to the simulated Rivalz.ai decentralized storage
3. Creates a knowledge base
4. Performs multiple queries
5. Cleans up by deleting the knowledge base and file

## Future Enhancements

1. **Complete API Integration**: Finalize integration with actual Rivalz.ai API endpoints
2. **Enhanced Error Handling**: Implement more robust error handling and retry mechanisms
3. **Batch Processing**: Support for processing multiple telemetry datasets in batch
4. **Advanced Querying**: Support for more complex queries and data visualization
5. **Real-time Updates**: Real-time updates to knowledge bases as new telemetry data arrives
