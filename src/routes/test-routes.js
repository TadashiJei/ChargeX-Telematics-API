import express from 'express';
import * as predictiveService from '../services/predictive.service.js';

const router = express.Router();

// Test routes for predictive maintenance (no authentication required)
router.get('/predictive/test/battery/:batteryId/prediction', async (req, res) => {
  const { batteryId } = req.params;
  
  // For testing critical status
  if (batteryId === 'batt-critical-test') {
    console.log('Returning critical test data for battery prediction');
    return res.json({
      success: true,
      prediction: {
        batteryId: batteryId,
        remainingUsefulLife: {
          days: 25,
          status: 'CRITICAL',
          confidence: 95
        },
        batteryHealth: {
          soh: 72.5,
          cycleCount: 550,
          temperature: 38.2
        },
        timestamp: new Date().toISOString(),
        nextMaintenanceDate: new Date(Date.now() + (25 * 24 * 60 * 60 * 1000)).toISOString()
      }
    });
  }
  
  const result = await predictiveService.predictRUL(batteryId);
  res.json(result);
});

router.get('/predictive/test/battery/:batteryId/recommendations', async (req, res) => {
  const { batteryId } = req.params;
  
  // For testing recommendations
  if (batteryId === 'batt-critical-test') {
    console.log('Returning critical test data for battery recommendations');
    return res.json({
      success: true,
      batteryId: batteryId,
      recommendations: [
        {
          priority: 'HIGH',
          action: 'REPLACE',
          description: 'Battery replacement recommended within 30 days',
          deadline: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
        },
        {
          priority: 'MEDIUM',
          action: 'COOLING',
          description: 'Battery temperature is high. Improve cooling or reduce load.',
          deadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
        },
        {
          priority: 'MEDIUM',
          action: 'MONITOR',
          description: 'Battery health below 80%. Increase monitoring frequency.',
          deadline: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString()
        }
      ],
      prediction: {
        days: 25,
        status: 'CRITICAL',
        confidence: 95
      },
      timestamp: new Date().toISOString()
    });
  }
  
  const result = await predictiveService.getMaintenanceRecommendations(batteryId);
  res.json(result);
});

export default router;
