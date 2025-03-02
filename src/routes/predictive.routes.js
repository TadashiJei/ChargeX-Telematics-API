import express from 'express';
import { authenticate as authMiddleware } from '../middleware/auth.middleware.js';
import predictiveController from '../controllers/predictive.controller.js';
import * as predictiveService from '../services/predictive.service.js';

const router = express.Router();

/**
 * @route GET /predictive/health
 * @description Health check for predictive maintenance service
 * @access Public
 */
router.get('/health', predictiveController.healthCheck);

/**
 * @route GET /predictive/battery/:batteryId/prediction
 * @description Get RUL prediction for a battery
 */
router.get('/battery/:batteryId/prediction', 
  authMiddleware, 
  predictiveController.getPrediction
);

/**
 * @route GET /predictive/battery/:batteryId/recommendations
 * @description Get maintenance recommendations for a battery
 */
router.get('/battery/:batteryId/recommendations', 
  authMiddleware, 
  predictiveController.getRecommendations
);

/**
 * @route GET /predictive/fleet/overview
 * @description Get fleet-wide predictive maintenance overview
 */
router.get('/fleet/overview', 
  authMiddleware, 
  predictiveController.getFleetOverview
);

/**
 * Development test routes (no authentication required)
 */
if (process.env.NODE_ENV !== 'production') {
  /**
   * @route GET /predictive/test/battery/:batteryId/prediction
   * @access Public (Development only)
   */
  router.get('/test/battery/:batteryId/prediction', 
    predictiveController.getPrediction
  );
  
  /**
   * @route GET /predictive/test/battery/:batteryId/recommendations
   * @access Public (Development only)
   */
  router.get('/test/battery/:batteryId/recommendations', 
    predictiveController.getRecommendations
  );
  
  /**
   * @route GET /predictive/test/fleet/overview
   * @access Public (Development only)
   */
  router.get('/test/fleet/overview', 
    predictiveController.getFleetOverview
  );
}

export default router;
