/**
 * ChargeX Telematics - Energy Trading Test
 * 
 * This script tests the energy trading functionality by creating offers,
 * making trades, and verifying transactions.
 */

import dotenv from 'dotenv';
import energyTradingService from './services/energy-trading.service.js';

// Load environment variables
dotenv.config();

// Set environment variables for testing if not already set
process.env.ENABLE_ENERGY_TRADING = process.env.ENABLE_ENERGY_TRADING || 'true';
process.env.TESTING_ENERGY_TRADING = 'true';

// Mock data for testing
const mockSeller = {
  id: 'user-001',
  name: 'Alice',
  batteryId: 'battery-001'
};

const mockBuyer = {
  id: 'user-002',
  name: 'Bob',
  batteryId: 'battery-002'
};

// Run the test
async function runTest() {
  try {
    console.log('\n======================================');
    console.log('ChargeX Telematics - Energy Trading Test');
    console.log('======================================\n');
    
    console.log('Using Energy Trading service...');
    
    // Step 1: Create an energy offer
    console.log('\nStep 1: Creating energy offer...');
    const offerData = {
      sellerId: mockSeller.id,
      batteryId: mockSeller.batteryId,
      energyAmount: 5.0, // kWh
      pricePerKwh: 0.15, // $0.15 per kWh
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      availableTo: new Date(Date.now() + 86400000).toISOString() // Available for 24 hours
    };
    
    const offer = await energyTradingService.createOffer(offerData);
    console.log(`Offer created with ID: ${offer.id}`);
    console.log(`Energy amount: ${offer.energyAmount} kWh at $${offer.pricePerKwh} per kWh`);
    console.log(`Total value: $${(offer.energyAmount * offer.pricePerKwh).toFixed(2)}`);
    
    // Step 2: Get all active offers
    console.log('\nStep 2: Getting active offers...');
    const activeOffers = await energyTradingService.getOffers({ status: 'active' });
    console.log(`Found ${activeOffers.length} active offers`);
    
    // Step 3: Create a trade (purchase offer)
    console.log('\nStep 3: Creating trade (purchasing energy)...');
    const tradeData = {
      offerId: offer.id,
      buyerId: mockBuyer.id,
      energyAmount: 2.0 // Purchase 2 kWh of the 5 kWh offered
    };
    
    const trade = await energyTradingService.createTrade(tradeData);
    console.log(`Trade created with ID: ${trade.id}`);
    console.log(`Energy amount: ${trade.energyAmount} kWh at $${trade.pricePerKwh} per kWh`);
    console.log(`Total price: $${trade.totalPrice.toFixed(2)}`);
    
    // Step 4: Accept the trade
    console.log('\nStep 4: Accepting trade...');
    const acceptedTrade = await energyTradingService.updateTradeStatus(trade.id, 'accepted');
    console.log(`Trade ${acceptedTrade.id} status updated to: ${acceptedTrade.status}`);
    
    // Step 5: Check the offer status (should be active with reduced energy amount)
    console.log('\nStep 5: Checking updated offer...');
    const updatedOffer = await energyTradingService.getOfferById(offer.id);
    console.log(`Updated offer status: ${updatedOffer.status}`);
    console.log(`Remaining energy: ${updatedOffer.energyAmount} kWh`);
    
    // Step 6: Create another trade for the remaining energy
    console.log('\nStep 6: Creating another trade for remaining energy...');
    const secondTradeData = {
      offerId: offer.id,
      buyerId: mockBuyer.id,
      energyAmount: updatedOffer.energyAmount // Purchase all remaining energy
    };
    
    const secondTrade = await energyTradingService.createTrade(secondTradeData);
    console.log(`Second trade created with ID: ${secondTrade.id}`);
    console.log(`Energy amount: ${secondTrade.energyAmount} kWh at $${secondTrade.pricePerKwh} per kWh`);
    console.log(`Total price: $${secondTrade.totalPrice.toFixed(2)}`);
    
    // Step 7: Accept the second trade
    console.log('\nStep 7: Accepting second trade...');
    const acceptedSecondTrade = await energyTradingService.updateTradeStatus(secondTrade.id, 'accepted');
    console.log(`Trade ${acceptedSecondTrade.id} status updated to: ${acceptedSecondTrade.status}`);
    
    // Step 8: Check the offer status again (should be sold out)
    console.log('\nStep 8: Checking offer status after second trade...');
    try {
      const finalOffer = await energyTradingService.getOfferById(offer.id);
      console.log(`Final offer status: ${finalOffer.status}`);
    } catch (error) {
      console.log(`Offer status: ${error.message}`);
    }
    
    // Step 9: Get all transactions
    console.log('\nStep 9: Getting all transactions...');
    const transactions = await energyTradingService.getTransactions();
    console.log(`Found ${transactions.length} transactions`);
    transactions.forEach((tx, index) => {
      console.log(`Transaction ${index + 1}: ${tx.energyAmount} kWh for $${tx.totalPrice.toFixed(2)}`);
    });
    
    // Step 10: Get energy trading statistics
    console.log('\nStep 10: Getting energy trading statistics...');
    const statistics = await energyTradingService.getStatistics();
    console.log('Energy Trading Statistics:');
    console.log(`- Active Offers: ${statistics.activeOffers}`);
    console.log(`- Total Offers: ${statistics.totalOffers}`);
    console.log(`- Total Energy Traded: ${statistics.totalEnergyTraded} kWh`);
    console.log(`- Total Value Traded: $${statistics.totalValueTraded.toFixed(2)}`);
    console.log(`- Completed Trades: ${statistics.completedTrades}`);
    console.log(`- Pending Trades: ${statistics.pendingTrades}`);
    console.log(`- Transaction Count: ${statistics.transactionCount}`);
    
    console.log('\n======================================');
    console.log('Energy Trading Test Completed');
    console.log('======================================');
  } catch (error) {
    console.error('Error during energy trading test:', error);
    console.log('\n======================================');
    console.log('Energy Trading Test Failed');
    console.log('======================================');
  }
}

// Run the test
runTest();
