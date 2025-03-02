/**
 * ChargeX Telematics - Rivalz.ai RAG Integration Routes
 * 
 * This file defines the API routes for the Rivalz.ai integration.
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as rivalzController from '../controllers/rivalz.controller.js';

const router = express.Router();

// Create a knowledge base from device telemetry data
router.post('/device/:deviceId/knowledge-base', authenticate, rivalzController.createDeviceKnowledgeBase);

// Get the status of a knowledge base
router.get('/knowledge-base/:knowledgeBaseId', authenticate, rivalzController.getKnowledgeBaseStatus);

// Query a knowledge base
router.post('/knowledge-base/:knowledgeBaseId/query', authenticate, rivalzController.queryKnowledgeBase);

// Get all conversations for a knowledge base
router.get('/knowledge-base/:knowledgeBaseId/conversations', authenticate, rivalzController.getConversations);

export default router;
k