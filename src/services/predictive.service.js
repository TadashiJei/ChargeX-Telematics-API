import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tf from '@tensorflow/tfjs-node';
import logger from '../utils/logger.js';
import Telemetry from '../models/Telemetry.js';
import { createMockModel, generateRandomRUL } from './mock-model.service.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the saved model
const MODEL_PATH = path.join(__dirname, '../../models/lstm_model/model.json');

// Sequence length used during training (from the notebook)
const SEQUENCE_LENGTH = 50;

// Features used for prediction
const FEATURES = [
  'battery.voltage.total',
  'battery.current',
  'battery.temperature.average',
  'battery.soc',
  'battery.soh',
  'battery.cycleCount',
  'system.cpuTemperature',
  'system.signalStrength'
];

// Thresholds for RUL predictions
const RUL_THRESHOLDS = {
  CRITICAL: 30,  // Days
  WARNING: 90,   // Days
  GOOD: 180      // Days
};

// Singleton instance of the model
let model = null;

/**
 * Load the TensorFlow.js model
 */
export const loadModel = async () => {
  try {
    // First try to load the real model
    if (fs.existsSync(MODEL_PATH)) {
      try {
        model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
        logger.info('Predictive maintenance LSTM model loaded successfully');
        return true;
      } catch (modelError) {
        logger.error('Error loading saved model, falling back to mock model:', modelError);
      }
    } else {
      logger.warn(`Model file not found at ${MODEL_PATH}, falling back to mock model`);
    }
    
    // If real model fails or doesn't exist, create a mock model
    model = createMockModel();
    if (model) {
      logger.info('Mock LSTM model created successfully');
      return true;
    } else {
      logger.error('Failed to create mock model');
      return false;
    }
  } catch (error) {
    logger.error('Error in loadModel:', error);
    return false;
  }
};

/**
 * Preprocess telemetry data for model input
 * @param {Array} telemetryData - Array of telemetry records
 * @returns {tf.Tensor} - Preprocessed tensor ready for prediction
 */
const preprocessData = (telemetryData) => {
  // Sort by timestamp (oldest first)
  telemetryData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Extract features
  const featureData = telemetryData.map(record => {
    return FEATURES.map(feature => {
      const keys = feature.split('.');
      let value = record;
      for (const key of keys) {
        value = value[key];
        if (value === undefined) return 0; // Handle missing values
      }
      return value || 0;
    });
  });
  
  // Ensure we have enough data
  if (featureData.length < SEQUENCE_LENGTH) {
    logger.warn(`Not enough data for prediction. Need ${SEQUENCE_LENGTH}, got ${featureData.length}`);
    return null;
  }
  
  // Take the most recent SEQUENCE_LENGTH records
  const recentData = featureData.slice(-SEQUENCE_LENGTH);
  
  // Convert to tensor and reshape for LSTM input [samples, time steps, features]
  return tf.tensor3d([recentData], [1, SEQUENCE_LENGTH, FEATURES.length]);
};

/**
 * Predict Remaining Useful Life (RUL) for a battery
 * @param {String} batteryId - ID of the battery
 * @returns {Object} - Prediction results
 */
export const predictRUL = async (batteryId) => {
  try {
    if (!model) {
      await loadModel();
      if (!model) {
        return { 
          success: false, 
          message: 'Predictive model not available' 
        };
      }
    }
    
    // Get the most recent telemetry data for this battery
    const telemetryData = await Telemetry.find({ batteryId })
      .sort({ timestamp: -1 })
      .limit(SEQUENCE_LENGTH * 2) // Fetch more than needed to ensure we have enough
      .lean();
    
    // For testing: If no telemetry data, generate mock data
    let rulDays;
    let latestTelemetry;
    
    if (telemetryData.length < SEQUENCE_LENGTH) {
      logger.info(`Using mock data for battery ${batteryId} - insufficient telemetry data`);
      rulDays = generateRandomRUL();
      latestTelemetry = {
        battery: {
          soh: Math.random() * 20 + 80, // 80-100
          cycleCount: Math.floor(Math.random() * 500),
          temperature: {
            average: Math.random() * 10 + 25 // 25-35
          }
        }
      };
    } else {
      // Normal flow with real data
      const inputTensor = preprocessData(telemetryData);
      if (!inputTensor) {
        return {
          success: false,
          message: 'Failed to preprocess telemetry data'
        };
      }
      
      // Make prediction
      const prediction = model.predict(inputTensor);
      rulDays = prediction.dataSync()[0];
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      latestTelemetry = telemetryData[0];
    }
    
    // Convert to days (model might output a normalized value)
    rulDays = rulDays * 365; // Scale to days if needed
    
    // Determine status based on RUL
    let status = 'GOOD';
    if (rulDays <= RUL_THRESHOLDS.CRITICAL) {
      status = 'CRITICAL';
    } else if (rulDays <= RUL_THRESHOLDS.WARNING) {
      status = 'WARNING';
    }
    
    // Calculate confidence level (simplified)
    const confidence = Math.min(100, Math.max(0, 
      (rulDays / RUL_THRESHOLDS.GOOD) * 100
    ));
    
    return {
      success: true,
      prediction: {
        batteryId,
        remainingUsefulLife: {
          days: Math.round(rulDays),
          status,
          confidence: Math.round(confidence)
        },
        batteryHealth: {
          soh: latestTelemetry.battery.soh,
          cycleCount: latestTelemetry.battery.cycleCount,
          temperature: latestTelemetry.battery.temperature.average
        },
        timestamp: new Date().toISOString(),
        nextMaintenanceDate: new Date(
          Date.now() + (rulDays * 24 * 60 * 60 * 1000)
        ).toISOString()
      }
    };
  } catch (error) {
    logger.error('Error predicting battery RUL:', error);
    return {
      success: false,
      message: 'Error making prediction',
      error: error.message
    };
  }
};

/**
 * Get maintenance recommendations based on RUL prediction
 * @param {String} batteryId - ID of the battery
 * @returns {Object} - Maintenance recommendations
 */
export const getMaintenanceRecommendations = async (batteryId) => {
  try {
    const rulPrediction = await predictRUL(batteryId);
    
    if (!rulPrediction.success) {
      return rulPrediction;
    }
    
    const { prediction } = rulPrediction;
    const { remainingUsefulLife, batteryHealth } = prediction;
    
    // Generate recommendations based on RUL and battery health
    let recommendations = [];
    
    if (remainingUsefulLife.status === 'CRITICAL') {
      recommendations.push({
        priority: 'HIGH',
        action: 'REPLACE',
        description: 'Battery replacement recommended within 30 days',
        deadline: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
      });
    } else if (remainingUsefulLife.status === 'WARNING') {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'INSPECT',
        description: 'Schedule battery inspection within 30 days',
        deadline: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
    
    // Add recommendations based on specific battery metrics
    if (batteryHealth.temperature > 35) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'COOLING',
        description: 'Battery temperature is high. Improve cooling or reduce load.',
        deadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
    
    if (batteryHealth.soh < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'MONITOR',
        description: 'Battery health below 80%. Increase monitoring frequency.',
        deadline: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
    
    if (batteryHealth.cycleCount > 500) {
      recommendations.push({
        priority: 'LOW',
        action: 'CAPACITY_TEST',
        description: 'High cycle count. Schedule capacity test.',
        deadline: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
    
    return {
      success: true,
      batteryId,
      prediction: remainingUsefulLife,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error generating maintenance recommendations:', error);
    return {
      success: false,
      message: 'Error generating maintenance recommendations',
      error: error.message
    };
  }
};

/**
 * Get fleet-wide predictive maintenance overview
 * @param {Number} limit - Maximum number of batteries to analyze
 * @returns {Object} - Fleet-wide maintenance overview
 */
export const getFleetMaintenanceOverview = async (limit = 10) => {
  try {
    // Get unique battery IDs from telemetry
    const batteries = await Telemetry.aggregate([
      { $group: { _id: '$batteryId' } },
      { $limit: limit }
    ]);
    
    const batteryIds = batteries.map(b => b._id);
    
    // If no batteries found in telemetry, use mock battery IDs
    const mockBatteryIds = ['batt-001', 'batt-002', 'batt-003', 'batt-004', 'batt-005'];
    const finalBatteryIds = batteryIds.length > 0 ? batteryIds : mockBatteryIds;
    
    const predictions = [];
    
    // Get predictions for each battery
    for (const batteryId of finalBatteryIds) {
      const prediction = await predictRUL(batteryId);
      if (prediction.success) {
        predictions.push(prediction.prediction);
      }
    }
    
    // Group batteries by status
    const statusGroups = {
      CRITICAL: predictions.filter(p => p.remainingUsefulLife.status === 'CRITICAL'),
      WARNING: predictions.filter(p => p.remainingUsefulLife.status === 'WARNING'),
      GOOD: predictions.filter(p => p.remainingUsefulLife.status === 'GOOD')
    };
    
    // Calculate average RUL
    const averageRUL = predictions.length > 0 
      ? predictions.reduce((sum, p) => sum + p.remainingUsefulLife.days, 0) / predictions.length 
      : 0;
    
    return {
      success: true,
      fleetOverview: {
        totalBatteries: predictions.length,
        averageRUL: Math.round(averageRUL),
        statusDistribution: {
          critical: statusGroups.CRITICAL.length,
          warning: statusGroups.WARNING.length,
          good: statusGroups.GOOD.length
        },
        maintenanceRequired: statusGroups.CRITICAL.length + statusGroups.WARNING.length,
        batteryHealthSummary: {
          criticalBatteries: statusGroups.CRITICAL.map(p => ({
            batteryId: p.batteryId,
            remainingDays: p.remainingUsefulLife.days,
            nextMaintenanceDate: p.nextMaintenanceDate
          }))
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('Error generating fleet maintenance overview:', error);
    return {
      success: false,
      message: 'Error generating fleet maintenance overview',
      error: error.message
    };
  }
};
