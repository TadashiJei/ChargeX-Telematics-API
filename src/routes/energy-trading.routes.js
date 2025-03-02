/**
 * ChargeX Telematics - Energy Trading Routes
 * 
 * This module defines the API routes for peer-to-peer energy trading.
 */

import express from 'express';
import * as energyTradingController from '../controllers/energy-trading.controller.js';

const router = express.Router();

// Offer routes
router.post('/offers', energyTradingController.createOffer);
router.get('/offers', energyTradingController.getOffers);
router.get('/offers/:offerId', energyTradingController.getOfferById);
router.put('/offers/:offerId', energyTradingController.updateOffer);
router.delete('/offers/:offerId', energyTradingController.deleteOffer);

// Trade routes
router.post('/trades', energyTradingController.createTrade);
router.get('/trades', energyTradingController.getTrades);
router.get('/trades/:tradeId', energyTradingController.getTradeById);
router.put('/trades/:tradeId/status', energyTradingController.updateTradeStatus);

// Transaction routes
router.get('/transactions', energyTradingController.getTransactions);

// Statistics route
router.get('/statistics', energyTradingController.getStatistics);

export default router;
