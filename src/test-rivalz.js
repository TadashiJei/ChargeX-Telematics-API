/**
 * ChargeX Telematics - Rivalz.ai RAG Integration Test
 * 
 * This script tests the Rivalz.ai integration by creating a knowledge base
 * from telemetry data, querying it, and cleaning up.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rivalzService from './services/rivalz.service.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Set environment variables for testing if not already set
process.env.RIVALZ_ENABLED = process.env.RIVALZ_ENABLED || 'true';
process.env.RIVALZ_SECRET_TOKEN = process.env.RIVALZ_SECRET_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY3YmM4OTZkNWUwZGQzNTYzMjU5NDcwMCIsImF1dGhUeXBlIjoiZGFzaGJvYXJkIiwiaWF0IjoxNzQwODkwODEyLCJleHAiOjE3NzI0NDg0MTJ9.SmFxrm3IQ24azDa09rD0z4AMFFgqb-mj-7hutLiY8pQ';

// Mock telemetry data for testing
const mockTelemetryData = [
  {
    timestamp: new Date().toISOString(),
    deviceId: 'test-device-001',
    batteryLevel: 85,
    temperature: 28.5,
    voltage: 3.9,
    current: 0.2,
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    status: 'active'
  },
  {
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    deviceId: 'test-device-001',
    batteryLevel: 90,
    temperature: 27.2,
    voltage: 4.0,
    current: 0.1,
    location: {
      latitude: 37.7748,
      longitude: -122.4193
    },
    status: 'active'
  },
  {
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    deviceId: 'test-device-001',
    batteryLevel: 95,
    temperature: 26.8,
    voltage: 4.1,
    current: 0.05,
    location: {
      latitude: 37.7747,
      longitude: -122.4192
    },
    status: 'active'
  }
];

// Test queries
const testQueries = [
  'What was the battery level over time?',
  'How did the temperature change?',
  'What is the current location of the device?'
];

// Run the test
async function runTest() {
  try {
    console.log('\n======================================');
    console.log('ChargeX Telematics - Rivalz.ai RAG Integration Test');
    console.log('======================================\n');
    
    console.log('Using Rivalz service...');
    
    // Generate PDF from telemetry data
    console.log('\nGenerating PDF from telemetry data...');
    const pdfPath = await rivalzService.generatePDF(mockTelemetryData, 'test-device-001');
    console.log(`PDF generated: ${pdfPath}`);
    
    // Upload PDF to storage
    console.log('\nUploading PDF to Rivalz.ai decentralized storage...');
    const fileId = await rivalzService.uploadFile(pdfPath, 'test-device-001');
    console.log(`File uploaded with ID: ${fileId}`);
    
    // Create knowledge base
    console.log('\nCreating knowledge base...');
    const knowledgeBase = await rivalzService.createKnowledgeBase(fileId, 'test-device-001');
    console.log(`Knowledge base created with ID: ${knowledgeBase.id}`);
    
    // Query knowledge base
    console.log('\nQuerying knowledge base...');
    let conversationId = null;
    
    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      const queryResponse = await rivalzService.queryKnowledgeBase(
        knowledgeBase.id,
        query,
        conversationId
      );
      
      console.log(`Response: "${queryResponse.answer}"`);
      
      // Save conversation ID for follow-up queries
      conversationId = queryResponse.conversationId;
    }
    
    // Clean up
    console.log('\nCleaning up...');
    
    // Delete knowledge base
    console.log('Deleting knowledge base...');
    await rivalzService.deleteKnowledgeBase(knowledgeBase.id);
    
    // Delete file
    console.log('Deleting file...');
    await rivalzService.deleteFile(fileId);
    
    // Clean up temporary PDF file
    console.log('Cleaning up temporary file...');
    rivalzService.cleanupTempFile(pdfPath);
    
    console.log('\n======================================');
    console.log('Rivalz.ai RAG Integration Test Completed');
    console.log('======================================');
  } catch (error) {
    console.error(error);
    console.log('\n======================================');
    console.log('Rivalz.ai RAG Integration Test Completed');
    console.log('======================================');
  }
}

// Run the test
runTest();
