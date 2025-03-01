import express from 'express';
import { authenticate as authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /auth/login
 * @description Authenticate user and get token
 * @access Public
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // For testing purposes, accept any login with proper format
  if (email && password && email.includes('@') && password.length >= 6) {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: 'test_admin_token',
        user: {
          id: 'user_1',
          email: email,
          name: 'Test User',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }
});

/**
 * @route POST /auth/device
 * @description Authenticate device and get token
 * @access Public
 */
router.post('/device', (req, res) => {
  const { deviceId, deviceSecret } = req.body;
  
  // For testing purposes, accept any device login with proper format
  if (deviceId && deviceSecret && deviceSecret.length >= 8) {
    res.json({
      success: true,
      message: 'Device authentication successful',
      data: {
        token: `device_token_${deviceId}`,
        expiresIn: 86400 // 24 hours
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid device credentials',
        code: 'INVALID_DEVICE_CREDENTIALS'
      }
    });
  }
});

/**
 * @route POST /auth/refresh
 * @description Refresh authentication token
 * @access Public (with refresh token)
 */
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: 'new_test_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 86400 // 24 hours
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      }
    });
  }
});

/**
 * @route POST /auth/logout
 * @description Logout user
 * @access Private
 */
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route GET /auth/me
 * @description Get current user info
 * @access Private
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'User info retrieved successfully',
    data: {
      id: 'user_1',
      email: 'admin@chargex.io',
      name: 'Test User',
      role: 'admin',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true
        }
      }
    }
  });
});

export default router;
