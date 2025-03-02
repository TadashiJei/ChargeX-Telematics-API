/**
 * ChargeX Telematics - Rivalz.ai RAG Integration Controller
 * 
 * This controller handles the API endpoints for the Rivalz.ai integration.
 */

import rivalzService from '../services/rivalz.service.js';
import * as telemetryService from '../services/telemetry.service.js';
import * as deviceService from '../services/device.service.js';
import logger from '../utils/logger.js';

/**
 * Create a knowledge base from device telemetry data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createDeviceKnowledgeBase(req, res) {
  try {
    const { deviceId } = req.params;
    const { timeRange } = req.query;
    
    // Validate device ID
    const device = await deviceService.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    // Get telemetry data for the device
    let startTime, endTime;
    
    if (timeRange) {
      // Parse time range (e.g., "24h", "7d", "30d")
      const value = parseInt(timeRange.slice(0, -1));
      const unit = timeRange.slice(-1);
      
      endTime = new Date();
      startTime = new Date();
      
      switch (unit) {
        case 'h':
          startTime.setHours(startTime.getHours() - value);
          break;
        case 'd':
          startTime.setDate(startTime.getDate() - value);
          break;
        case 'm':
          startTime.setMonth(startTime.getMonth() - value);
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid time range format. Use format like "24h", "7d", "30d"' 
          });
      }
    } else {
      // Default to last 24 hours
      endTime = new Date();
      startTime = new Date();
      startTime.setHours(startTime.getHours() - 24);
    }
    
    // Get telemetry data
    const telemetryData = await telemetryService.getTelemetryDataByTimeRange(
      deviceId,
      startTime.getTime(),
      endTime.getTime()
    );
    
    if (telemetryData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No telemetry data found for the specified time range' 
      });
    }
    
    // Create a knowledge base from telemetry data
    const knowledgeBase = await rivalzService.createTelemetryKnowledgeBase(deviceId, telemetryData);
    
    // Return the knowledge base details
    res.status(200).json({
      success: true,
      message: 'Knowledge base created successfully',
      knowledgeBase
    });
  } catch (error) {
    logger.error(`Error creating device knowledge base: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create knowledge base',
      error: error.message
    });
  }
}

/**
 * Get the status of a knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getKnowledgeBaseStatus(req, res) {
  try {
    const { knowledgeBaseId } = req.params;
    
    // Get knowledge base status
    const knowledgeBase = await rivalzService.getKnowledgeBase(knowledgeBaseId);
    
    // Return the knowledge base details
    res.status(200).json({
      success: true,
      knowledgeBase
    });
  } catch (error) {
    logger.error(`Error getting knowledge base status: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get knowledge base status',
      error: error.message
    });
  }
}

/**
 * Query a knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function queryKnowledgeBase(req, res) {
  try {
    const { knowledgeBaseId } = req.params;
    const { question, sessionId } = req.body;
    
    // Validate request body
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }
    
    // Create a chat session
    const chatSession = await rivalzService.createChatSession(knowledgeBaseId, question, sessionId || null);
    
    // Return the chat session details
    res.status(200).json({
      success: true,
      answer: chatSession.answer,
      sessionId: chatSession.sessionId
    });
  } catch (error) {
    logger.error(`Error querying knowledge base: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to query knowledge base',
      error: error.message
    });
  }
}

/**
 * Get all conversations for a knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getConversations(req, res) {
  try {
    const { knowledgeBaseId } = req.params;
    
    // Get conversations
    const conversations = await rivalzService.getConversations(knowledgeBaseId);
    
    // Return the conversations
    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    logger.error(`Error getting conversations: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get conversations',
      error: error.message
    });
  }
}

export { 
  createDeviceKnowledgeBase, 
  getKnowledgeBaseStatus, 
  queryKnowledgeBase, 
  getConversations 
};
