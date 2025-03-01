/**
 * Global error handling middleware
 */
import logger from '../utils/logger.js';

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      code: err.code || 'INTERNAL_ERROR'
    }
  };
  
  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
