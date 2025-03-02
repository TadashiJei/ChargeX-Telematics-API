/**
 * ChargeX Telematics - Energy Trading Service
 * 
 * This service provides functionality for peer-to-peer energy trading between
 * battery owners, allowing them to sell excess energy or purchase energy when needed.
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Mock data storage (replace with database in production)
const DATA_DIR = path.join(__dirname, '../../data');
const OFFERS_FILE = path.join(DATA_DIR, 'energy-offers.json');
const TRADES_FILE = path.join(DATA_DIR, 'energy-trades.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'energy-transactions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
function initializeDataFiles() {
  if (!fs.existsSync(OFFERS_FILE)) {
    fs.writeFileSync(OFFERS_FILE, JSON.stringify([]));
  }
  
  if (!fs.existsSync(TRADES_FILE)) {
    fs.writeFileSync(TRADES_FILE, JSON.stringify([]));
  }
  
  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([]));
  }
}

// Helper functions for data operations
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading data from ${filePath}:`, error);
    return [];
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing data to ${filePath}:`, error);
    return false;
  }
}

class EnergyTradingService {
  constructor() {
    this.enabled = process.env.ENABLE_ENERGY_TRADING === 'true';
    
    // Initialize data files
    initializeDataFiles();
    
    console.log('Energy Trading Service initialized');
  }
  
  /**
   * Check if energy trading is enabled
   * @returns {boolean} - True if enabled
   */
  isEnabled() {
    return this.enabled || process.env.TESTING_ENERGY_TRADING === 'true';
  }
  
  /**
   * Create a new energy offer
   * @param {Object} offerData - Data for the new offer
   * @returns {Object} - Created offer
   */
  async createOffer(offerData) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const offers = readData(OFFERS_FILE);
      
      const newOffer = {
        id: uuidv4(),
        sellerId: offerData.sellerId,
        batteryId: offerData.batteryId,
        energyAmount: offerData.energyAmount, // in kWh
        pricePerKwh: offerData.pricePerKwh,
        location: offerData.location,
        availableFrom: offerData.availableFrom || new Date().toISOString(),
        availableTo: offerData.availableTo,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      offers.push(newOffer);
      writeData(OFFERS_FILE, offers);
      
      return newOffer;
    } catch (error) {
      console.error('Error creating energy offer:', error);
      throw error;
    }
  }
  
  /**
   * Get all energy offers
   * @param {Object} filters - Optional filters for offers
   * @returns {Array} - List of offers matching filters
   */
  async getOffers(filters = {}) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      let offers = readData(OFFERS_FILE);
      
      // Apply filters
      if (filters.status) {
        offers = offers.filter(offer => offer.status === filters.status);
      }
      
      if (filters.sellerId) {
        offers = offers.filter(offer => offer.sellerId === filters.sellerId);
      }
      
      if (filters.minEnergy) {
        offers = offers.filter(offer => offer.energyAmount >= filters.minEnergy);
      }
      
      if (filters.maxPrice) {
        offers = offers.filter(offer => offer.pricePerKwh <= filters.maxPrice);
      }
      
      if (filters.location && filters.maxDistance) {
        // Filter by distance from location
        offers = offers.filter(offer => {
          const distance = this.calculateDistance(
            filters.location.latitude,
            filters.location.longitude,
            offer.location.latitude,
            offer.location.longitude
          );
          return distance <= filters.maxDistance;
        });
      }
      
      return offers;
    } catch (error) {
      console.error('Error getting energy offers:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific energy offer by ID
   * @param {String} offerId - ID of the offer to retrieve
   * @returns {Object} - Offer data
   */
  async getOfferById(offerId) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const offers = readData(OFFERS_FILE);
      const offer = offers.find(o => o.id === offerId);
      
      if (!offer) {
        throw new Error(`Offer with ID ${offerId} not found`);
      }
      
      return offer;
    } catch (error) {
      console.error('Error getting energy offer:', error);
      throw error;
    }
  }
  
  /**
   * Update an energy offer
   * @param {String} offerId - ID of the offer to update
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated offer
   */
  async updateOffer(offerId, updateData) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const offers = readData(OFFERS_FILE);
      const offerIndex = offers.findIndex(o => o.id === offerId);
      
      if (offerIndex === -1) {
        throw new Error(`Offer with ID ${offerId} not found`);
      }
      
      // Update offer
      const updatedOffer = {
        ...offers[offerIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      offers[offerIndex] = updatedOffer;
      writeData(OFFERS_FILE, offers);
      
      return updatedOffer;
    } catch (error) {
      console.error('Error updating energy offer:', error);
      throw error;
    }
  }
  
  /**
   * Delete an energy offer
   * @param {String} offerId - ID of the offer to delete
   * @returns {Boolean} - Success status
   */
  async deleteOffer(offerId) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const offers = readData(OFFERS_FILE);
      const filteredOffers = offers.filter(o => o.id !== offerId);
      
      if (filteredOffers.length === offers.length) {
        throw new Error(`Offer with ID ${offerId} not found`);
      }
      
      writeData(OFFERS_FILE, filteredOffers);
      
      return true;
    } catch (error) {
      console.error('Error deleting energy offer:', error);
      throw error;
    }
  }
  
  /**
   * Create a new energy trade (purchase offer)
   * @param {Object} tradeData - Data for the new trade
   * @returns {Object} - Created trade
   */
  async createTrade(tradeData) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      // Verify that the offer exists and is active
      const offer = await this.getOfferById(tradeData.offerId);
      
      if (offer.status !== 'active') {
        throw new Error(`Offer with ID ${tradeData.offerId} is not active`);
      }
      
      // Create the trade
      const trades = readData(TRADES_FILE);
      
      const newTrade = {
        id: uuidv4(),
        offerId: tradeData.offerId,
        buyerId: tradeData.buyerId,
        sellerId: offer.sellerId,
        energyAmount: tradeData.energyAmount || offer.energyAmount,
        pricePerKwh: offer.pricePerKwh,
        totalPrice: (tradeData.energyAmount || offer.energyAmount) * offer.pricePerKwh,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      trades.push(newTrade);
      writeData(TRADES_FILE, trades);
      
      // Update offer status to 'pending' if the entire amount is being purchased
      if (newTrade.energyAmount === offer.energyAmount) {
        await this.updateOffer(offer.id, { status: 'pending' });
      }
      
      return newTrade;
    } catch (error) {
      console.error('Error creating energy trade:', error);
      throw error;
    }
  }
  
  /**
   * Get all energy trades
   * @param {Object} filters - Optional filters for trades
   * @returns {Array} - List of trades matching filters
   */
  async getTrades(filters = {}) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      let trades = readData(TRADES_FILE);
      
      // Apply filters
      if (filters.status) {
        trades = trades.filter(trade => trade.status === filters.status);
      }
      
      if (filters.buyerId) {
        trades = trades.filter(trade => trade.buyerId === filters.buyerId);
      }
      
      if (filters.sellerId) {
        trades = trades.filter(trade => trade.sellerId === filters.sellerId);
      }
      
      return trades;
    } catch (error) {
      console.error('Error getting energy trades:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific energy trade by ID
   * @param {String} tradeId - ID of the trade to retrieve
   * @returns {Object} - Trade data
   */
  async getTradeById(tradeId) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const trades = readData(TRADES_FILE);
      const trade = trades.find(t => t.id === tradeId);
      
      if (!trade) {
        throw new Error(`Trade with ID ${tradeId} not found`);
      }
      
      return trade;
    } catch (error) {
      console.error('Error getting energy trade:', error);
      throw error;
    }
  }
  
  /**
   * Update trade status (accept, reject, complete)
   * @param {String} tradeId - ID of the trade to update
   * @param {String} status - New status (accepted, rejected, completed)
   * @param {Object} updateData - Additional data for the update
   * @returns {Object} - Updated trade
   */
  async updateTradeStatus(tradeId, status, updateData = {}) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const trades = readData(TRADES_FILE);
      const tradeIndex = trades.findIndex(t => t.id === tradeId);
      
      if (tradeIndex === -1) {
        throw new Error(`Trade with ID ${tradeId} not found`);
      }
      
      const trade = trades[tradeIndex];
      
      // Update trade status
      const updatedTrade = {
        ...trade,
        ...updateData,
        status,
        updatedAt: new Date().toISOString()
      };
      
      trades[tradeIndex] = updatedTrade;
      writeData(TRADES_FILE, trades);
      
      // Update offer status based on trade status
      const offer = await this.getOfferById(trade.offerId);
      
      if (status === 'accepted') {
        // Update offer status to 'sold' if the entire amount is being purchased
        if (trade.energyAmount === offer.energyAmount) {
          await this.updateOffer(offer.id, { status: 'sold' });
        } else {
          // Update offer with reduced energy amount
          const remainingEnergy = offer.energyAmount - trade.energyAmount;
          await this.updateOffer(offer.id, { 
            energyAmount: remainingEnergy,
            status: 'active'
          });
        }
        
        // Create transaction record
        await this.createTransaction({
          tradeId: trade.id,
          buyerId: trade.buyerId,
          sellerId: trade.sellerId,
          energyAmount: trade.energyAmount,
          pricePerKwh: trade.pricePerKwh,
          totalPrice: trade.totalPrice
        });
      } else if (status === 'rejected') {
        // Reactivate the offer if it was pending
        if (offer.status === 'pending') {
          await this.updateOffer(offer.id, { status: 'active' });
        }
      }
      
      return updatedTrade;
    } catch (error) {
      console.error('Error updating energy trade status:', error);
      throw error;
    }
  }
  
  /**
   * Create a transaction record for a completed trade
   * @param {Object} transactionData - Data for the new transaction
   * @returns {Object} - Created transaction
   */
  async createTransaction(transactionData) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const transactions = readData(TRANSACTIONS_FILE);
      
      const newTransaction = {
        id: uuidv4(),
        tradeId: transactionData.tradeId,
        buyerId: transactionData.buyerId,
        sellerId: transactionData.sellerId,
        energyAmount: transactionData.energyAmount,
        pricePerKwh: transactionData.pricePerKwh,
        totalPrice: transactionData.totalPrice,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
      
      transactions.push(newTransaction);
      writeData(TRANSACTIONS_FILE, transactions);
      
      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction record:', error);
      throw error;
    }
  }
  
  /**
   * Get all transactions
   * @param {Object} filters - Optional filters for transactions
   * @returns {Array} - List of transactions matching filters
   */
  async getTransactions(filters = {}) {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      let transactions = readData(TRANSACTIONS_FILE);
      
      // Apply filters
      if (filters.buyerId) {
        transactions = transactions.filter(tx => tx.buyerId === filters.buyerId);
      }
      
      if (filters.sellerId) {
        transactions = transactions.filter(tx => tx.sellerId === filters.sellerId);
      }
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Number} lat1 - Latitude of first point
   * @param {Number} lon1 - Longitude of first point
   * @param {Number} lat2 - Latitude of second point
   * @param {Number} lon2 - Longitude of second point
   * @returns {Number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  /**
   * Convert degrees to radians
   * @param {Number} deg - Degrees
   * @returns {Number} - Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  /**
   * Get energy trading statistics
   * @returns {Object} - Statistics about energy trading
   */
  async getStatistics() {
    if (!this.isEnabled()) {
      throw new Error('Energy trading is not enabled');
    }
    
    try {
      const offers = readData(OFFERS_FILE);
      const trades = readData(TRADES_FILE);
      const transactions = readData(TRANSACTIONS_FILE);
      
      // Calculate statistics
      const activeOffers = offers.filter(o => o.status === 'active').length;
      const totalOffers = offers.length;
      
      const totalEnergyTraded = transactions.reduce((sum, tx) => sum + tx.energyAmount, 0);
      const totalValueTraded = transactions.reduce((sum, tx) => sum + tx.totalPrice, 0);
      
      const completedTrades = trades.filter(t => t.status === 'completed').length;
      const pendingTrades = trades.filter(t => t.status === 'pending').length;
      
      return {
        activeOffers,
        totalOffers,
        totalEnergyTraded,
        totalValueTraded,
        completedTrades,
        pendingTrades,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error('Error getting energy trading statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const energyTradingService = new EnergyTradingService();

export default energyTradingService;
