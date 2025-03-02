import { 
  predictRUL, 
  getMaintenanceRecommendations, 
  getFleetMaintenanceOverview 
} from '../services/predictive.service.js';
import logger from '../utils/logger.js';

/**
 * Controller for predictive maintenance features
 */
class PredictiveController {
  /**
   * Get RUL (Remaining Useful Life) prediction for a battery
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPrediction(req, res) {
    try {
      const { batteryId } = req.params;
      
      if (!batteryId) {
        return res.status(400).json({
          success: false,
          message: 'Battery ID is required'
        });
      }
      
      const prediction = await predictRUL(batteryId);
      
      if (!prediction.success) {
        return res.status(404).json(prediction);
      }
      
      return res.status(200).json(prediction);
    } catch (error) {
      logger.error('Error in getPrediction controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while getting prediction',
        error: error.message
      });
    }
  }
  
  /**
   * Get maintenance recommendations for a battery
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRecommendations(req, res) {
    try {
      const { batteryId } = req.params;
      
      if (!batteryId) {
        return res.status(400).json({
          success: false,
          message: 'Battery ID is required'
        });
      }
      
      const recommendations = await getMaintenanceRecommendations(batteryId);
      
      if (!recommendations.success) {
        return res.status(404).json(recommendations);
      }
      
      return res.status(200).json(recommendations);
    } catch (error) {
      logger.error('Error in getRecommendations controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while getting maintenance recommendations',
        error: error.message
      });
    }
  }
  
  /**
   * Get fleet-wide maintenance overview
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFleetOverview(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      
      const overview = await getFleetMaintenanceOverview(limit);
      
      if (!overview.success) {
        return res.status(500).json(overview);
      }
      
      return res.status(200).json(overview);
    } catch (error) {
      logger.error('Error in getFleetOverview controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while getting fleet maintenance overview',
        error: error.message
      });
    }
  }
  
  /**
   * Get health check for predictive maintenance service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  healthCheck(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Predictive maintenance service is running',
      timestamp: new Date().toISOString()
    });
  }
}

export default new PredictiveController();
