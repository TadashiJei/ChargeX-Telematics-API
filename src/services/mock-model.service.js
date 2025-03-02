import * as tf from '@tensorflow/tfjs-node';
import logger from '../utils/logger.js';

/**
 * Create a simple mock LSTM model for testing
 * @returns {tf.LayersModel} - A simple LSTM model
 */
export const createMockModel = () => {
  try {
    // Create a sequential model
    const model = tf.sequential();
    
    // Add an LSTM layer
    model.add(tf.layers.lstm({
      inputShape: [50, 8],  // 50 time steps, 8 features
      units: 100,
      returnSequences: true
    }));
    
    // Add a dropout layer
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Add another LSTM layer
    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false
    }));
    
    // Add another dropout layer
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Add a dense output layer
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    logger.info('Mock LSTM model created successfully');
    return model;
  } catch (error) {
    logger.error('Error creating mock LSTM model:', error);
    return null;
  }
};

/**
 * Generate a random RUL prediction
 * @returns {Number} - Random RUL value between 30 and 365 days
 */
export const generateRandomRUL = () => {
  return Math.floor(Math.random() * (365 - 30 + 1)) + 30;
};
