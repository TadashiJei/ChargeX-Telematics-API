/**
 * Scheduler Service for handling scheduled tasks
 */
import cron from 'node-cron';
import logger from '../utils/logger.js';

// Store for all scheduled tasks
const scheduledTasks = {};

/**
 * Initialize scheduled tasks
 */
export const initScheduledTasks = () => {
  logger.info('Initializing scheduled tasks');
  
  // Schedule device status check (every 5 minutes)
  scheduleTask('deviceStatusCheck', '*/5 * * * *', () => {
    logger.info('Running scheduled device status check');
    // In a real implementation, this would check device status
  });
  
  // Schedule telemetry aggregation (hourly)
  scheduleTask('telemetryAggregation', '0 * * * *', () => {
    logger.info('Running scheduled telemetry aggregation');
    // In a real implementation, this would aggregate telemetry data
  });
  
  // Schedule alert cleanup (daily at midnight)
  scheduleTask('alertCleanup', '0 0 * * *', () => {
    logger.info('Running scheduled alert cleanup');
    // In a real implementation, this would clean up old alerts
  });
  
  // Schedule database maintenance (weekly on Sunday at 2 AM)
  scheduleTask('databaseMaintenance', '0 2 * * 0', () => {
    logger.info('Running scheduled database maintenance');
    // In a real implementation, this would perform database maintenance
  });
  
  logger.info('Scheduled tasks initialized');
};

/**
 * Schedule a task
 * @param {string} taskName - Name of the task
 * @param {string} cronExpression - Cron expression for scheduling
 * @param {Function} taskFunction - Function to execute
 * @returns {boolean} - Success status
 */
export const scheduleTask = (taskName, cronExpression, taskFunction) => {
  try {
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression for task ${taskName}: ${cronExpression}`);
      return false;
    }
    
    // Cancel existing task if it exists
    if (scheduledTasks[taskName]) {
      scheduledTasks[taskName].stop();
      logger.debug(`Stopped existing scheduled task: ${taskName}`);
    }
    
    // Schedule new task
    scheduledTasks[taskName] = cron.schedule(cronExpression, async () => {
      try {
        logger.debug(`Executing scheduled task: ${taskName}`);
        await taskFunction();
        logger.debug(`Completed scheduled task: ${taskName}`);
      } catch (error) {
        logger.error(`Error executing scheduled task ${taskName}:`, error);
      }
    });
    
    logger.info(`Scheduled task: ${taskName} (${cronExpression})`);
    return true;
  } catch (error) {
    logger.error(`Error scheduling task ${taskName}:`, error);
    return false;
  }
};

/**
 * Cancel a scheduled task
 * @param {string} taskName - Name of the task to cancel
 * @returns {boolean} - Success status
 */
export const cancelTask = (taskName) => {
  if (!scheduledTasks[taskName]) {
    logger.warn(`Cannot cancel task ${taskName}: Task not found`);
    return false;
  }
  
  try {
    scheduledTasks[taskName].stop();
    delete scheduledTasks[taskName];
    logger.info(`Canceled scheduled task: ${taskName}`);
    return true;
  } catch (error) {
    logger.error(`Error canceling task ${taskName}:`, error);
    return false;
  }
};

/**
 * Get all scheduled tasks
 * @returns {Object} - Object with task names as keys and status as values
 */
export const getScheduledTasks = () => {
  const tasks = {};
  
  for (const [taskName, task] of Object.entries(scheduledTasks)) {
    tasks[taskName] = {
      status: task.getStatus(),
      nextExecution: getNextExecutionTime(task)
    };
  }
  
  return tasks;
};

/**
 * Get next execution time for a task
 * @param {Object} task - Cron task object
 * @returns {Date|null} - Next execution time or null if not available
 */
const getNextExecutionTime = (task) => {
  try {
    return task.nextDate().toDate();
  } catch (error) {
    return null;
  }
};

export default {
  initScheduledTasks,
  scheduleTask,
  cancelTask,
  getScheduledTasks
};
