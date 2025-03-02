/**
 * ChargeX Telematics - Energy Trading Controller
 * 
 * This controller handles API requests for peer-to-peer energy trading.
 */

import energyTradingService from '../services/energy-trading.service.js';

/**
 * Create a new energy offer
 */
export const createOffer = async (req, res) => {
  try {
    const offerData = req.body;
    
    // Validate required fields
    if (!offerData.sellerId || !offerData.batteryId || !offerData.energyAmount || !offerData.pricePerKwh || !offerData.location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const offer = await energyTradingService.createOffer(offerData);
    
    return res.status(201).json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error creating energy offer:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating energy offer'
    });
  }
};

/**
 * Get all energy offers with optional filtering
 */
export const getOffers = async (req, res) => {
  try {
    const filters = req.query;
    
    // Convert numeric filters
    if (filters.minEnergy) filters.minEnergy = parseFloat(filters.minEnergy);
    if (filters.maxPrice) filters.maxPrice = parseFloat(filters.maxPrice);
    if (filters.maxDistance) filters.maxDistance = parseFloat(filters.maxDistance);
    
    // Parse location if provided
    if (filters.latitude && filters.longitude) {
      filters.location = {
        latitude: parseFloat(filters.latitude),
        longitude: parseFloat(filters.longitude)
      };
    }
    
    const offers = await energyTradingService.getOffers(filters);
    
    return res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    console.error('Error getting energy offers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting energy offers'
    });
  }
};

/**
 * Get a specific energy offer by ID
 */
export const getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;
    
    const offer = await energyTradingService.getOfferById(offerId);
    
    return res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error getting energy offer:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting energy offer'
    });
  }
};

/**
 * Update an energy offer
 */
export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const updateData = req.body;
    
    const updatedOffer = await energyTradingService.updateOffer(offerId, updateData);
    
    return res.status(200).json({
      success: true,
      data: updatedOffer
    });
  } catch (error) {
    console.error('Error updating energy offer:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating energy offer'
    });
  }
};

/**
 * Delete an energy offer
 */
export const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    
    await energyTradingService.deleteOffer(offerId);
    
    return res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting energy offer:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting energy offer'
    });
  }
};

/**
 * Create a new energy trade (purchase offer)
 */
export const createTrade = async (req, res) => {
  try {
    const tradeData = req.body;
    
    // Validate required fields
    if (!tradeData.offerId || !tradeData.buyerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const trade = await energyTradingService.createTrade(tradeData);
    
    return res.status(201).json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Error creating energy trade:', error);
    
    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating energy trade'
    });
  }
};

/**
 * Get all energy trades with optional filtering
 */
export const getTrades = async (req, res) => {
  try {
    const filters = req.query;
    
    const trades = await energyTradingService.getTrades(filters);
    
    return res.status(200).json({
      success: true,
      count: trades.length,
      data: trades
    });
  } catch (error) {
    console.error('Error getting energy trades:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting energy trades'
    });
  }
};

/**
 * Get a specific energy trade by ID
 */
export const getTradeById = async (req, res) => {
  try {
    const { tradeId } = req.params;
    
    const trade = await energyTradingService.getTradeById(tradeId);
    
    return res.status(200).json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Error getting energy trade:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting energy trade'
    });
  }
};

/**
 * Update trade status (accept, reject, complete)
 */
export const updateTradeStatus = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { status, ...updateData } = req.body;
    
    // Validate status
    if (!status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: accepted, rejected, completed'
      });
    }
    
    const updatedTrade = await energyTradingService.updateTradeStatus(tradeId, status, updateData);
    
    return res.status(200).json({
      success: true,
      data: updatedTrade
    });
  } catch (error) {
    console.error('Error updating trade status:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating trade status'
    });
  }
};

/**
 * Get all transactions with optional filtering
 */
export const getTransactions = async (req, res) => {
  try {
    const filters = req.query;
    
    const transactions = await energyTradingService.getTransactions(filters);
    
    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting transactions'
    });
  }
};

/**
 * Get energy trading statistics
 */
export const getStatistics = async (req, res) => {
  try {
    const statistics = await energyTradingService.getStatistics();
    
    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting energy trading statistics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting energy trading statistics'
    });
  }
};
