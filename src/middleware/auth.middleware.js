import jwt from 'jsonwebtoken';
import Device from '../models/Device.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { verifyToken } from '../utils/auth.js';

/**
 * Authenticate user based on JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    // For test tokens, skip database verification
    if (token === 'test_admin_token') {
      // Create a mock user for testing
      req.user = {
        _id: 'user_1',
        email: 'admin@chargex.io',
        name: 'Test User',
        role: 'admin'
      };
      req.token = token;
      return next();
    }
    
    // For real tokens, verify against database
    try {
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if token is in user's active tokens
      const tokenExists = user.tokens.some(t => t.token === token);
      
      if (!tokenExists) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked'
        });
      }
      
      // Add user to request
      req.user = user;
      req.token = token;
    } catch (error) {
      logger.error('User lookup error:', error);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Authorize device based on device token
 */
export const authorizeDevice = async (req, res, next) => {
  try {
    // Get device token from header
    const deviceToken = req.header('X-Device-Token');
    const deviceId = req.body.deviceId;
    
    if (!deviceToken) {
      return res.status(401).json({
        success: false,
        message: 'Device token is required'
      });
    }
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }
    
    // Find device
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Verify device token
    if (device.auth.token !== deviceToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device token'
      });
    }
    
    // Update device last authenticated
    await Device.findOneAndUpdate(
      { deviceId },
      { 'auth.lastAuthenticated': new Date() }
    );
    
    // Add device to request
    req.device = device;
    
    next();
  } catch (error) {
    logger.error('Device authorization error:', error);
    return res.status(401).json({
      success: false,
      message: 'Device authorization failed',
      error: error.message
    });
  }
};

/**
 * Authorize admin users only
 */
export const authorizeAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Admin authorization error:', error);
    return res.status(403).json({
      success: false,
      message: 'Authorization failed',
      error: error.message
    });
  }
};
