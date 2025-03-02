/**
 * Predictive Dashboard UI Component
 */

/**
 * Format a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @return {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format duration in days to a human-readable string
 * @param {number} days - Number of days
 * @return {string} Formatted duration
 */
function formatDuration(days) {
  if (!days && days !== 0) return 'N/A';
  
  if (days < 30) {
    return `${days} days`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`;
  } else {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);
    return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
  }
}

class PredictiveDashboard {
  constructor(containerId, apiBaseUrl = '/api/v1/predictive') {
    this.containerId = containerId;
    this.apiBaseUrl = apiBaseUrl;
    this.container = document.getElementById(containerId);
    this.batteries = [];
    this.fleetOverview = null;
    this.selectedBatteryId = null;
    
    if (!this.container) {
      console.error(`Container with ID ${containerId} not found`);
      return;
    }
    
    this.init();
  }
  
  /**
   * Initialize the dashboard
   */
  async init() {
    this.createDashboardStructure();
    this.setupEventListeners();
    await this.loadFleetOverview();
    
    // Add a test critical battery button
    const testBatteryBtn = document.createElement('button');
    testBatteryBtn.className = 'btn btn-warning mb-3';
    testBatteryBtn.innerText = 'Test Critical Battery';
    testBatteryBtn.onclick = () => this.loadBatteryDetails('batt-critical-test');
    
    const dashboardContainer = document.querySelector('#predictive-dashboard');
    dashboardContainer.insertBefore(testBatteryBtn, dashboardContainer.firstChild);
  }
  
  /**
   * Create the dashboard HTML structure
   */
  createDashboardStructure() {
    this.container.innerHTML = `
      <div class="predictive-dashboard">
        <div class="dashboard-header">
          <h2>AI-Powered Predictive Maintenance</h2>
          <div class="dashboard-controls">
            <button id="${this.containerId}-refresh" class="btn btn-primary">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
        
        <div class="dashboard-overview">
          <div class="overview-card">
            <h3>Fleet Health</h3>
            <div id="${this.containerId}-fleet-health" class="overview-content">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <div class="overview-card">
            <h3>Maintenance Required</h3>
            <div id="${this.containerId}-maintenance-required" class="overview-content">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <div class="overview-card">
            <h3>Average RUL</h3>
            <div id="${this.containerId}-average-rul" class="overview-content">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-main">
          <div class="battery-list-container">
            <h3>Batteries</h3>
            <div class="battery-filter">
              <select id="${this.containerId}-status-filter">
                <option value="all">All Statuses</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="GOOD">Good</option>
              </select>
              <input type="text" id="${this.containerId}-search" placeholder="Search batteries...">
            </div>
            <div id="${this.containerId}-battery-list" class="battery-list">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <div class="battery-details-container">
            <h3>Battery Details</h3>
            <div id="${this.containerId}-battery-details" class="battery-details">
              <p class="no-selection">Select a battery to view details</p>
            </div>
          </div>
        </div>
        
        <div class="dashboard-recommendations">
          <h3>Maintenance Recommendations</h3>
          <div id="battery-recommendations" class="recommendations-list">
            <p class="no-selection">Select a battery to view recommendations</p>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById(`${this.containerId}-refresh`);
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshDashboard());
    }
    
    // Status filter
    const statusFilter = document.getElementById(`${this.containerId}-status-filter`);
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterBatteries());
    }
    
    // Search input
    const searchInput = document.getElementById(`${this.containerId}-search`);
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterBatteries());
    }
  }
  
  /**
   * Load fleet overview data
   */
  async loadFleetOverview() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/fleet/overview`);
      const data = await response.json();
      
      if (data.success) {
        this.fleetOverview = data.fleetOverview;
        this.renderFleetOverview();
        this.loadBatteries();
      } else {
        this.showError('Failed to load fleet overview');
      }
    } catch (error) {
      console.error('Error loading fleet overview:', error);
      this.showError('Failed to load fleet overview');
    }
  }
  
  /**
   * Load batteries data
   */
  async loadBatteries() {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use the critical batteries from the fleet overview
      this.batteries = this.fleetOverview.batteryHealthSummary.criticalBatteries.map(battery => ({
        ...battery,
        status: 'CRITICAL'
      }));
      
      // Add some mock batteries with WARNING and GOOD status
      const mockBatteries = [
        { batteryId: 'batt-001', remainingDays: 120, status: 'WARNING', nextMaintenanceDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString() },
        { batteryId: 'batt-002', remainingDays: 95, status: 'WARNING', nextMaintenanceDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString() },
        { batteryId: 'batt-003', remainingDays: 200, status: 'GOOD', nextMaintenanceDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString() },
        { batteryId: 'batt-004', remainingDays: 250, status: 'GOOD', nextMaintenanceDate: new Date(Date.now() + 250 * 24 * 60 * 60 * 1000).toISOString() },
        { batteryId: 'batt-005', remainingDays: 180, status: 'GOOD', nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() }
      ];
      
      this.batteries = [...this.batteries, ...mockBatteries];
      this.renderBatteryList();
    } catch (error) {
      console.error('Error loading batteries:', error);
      this.showError('Failed to load batteries');
    }
  }
  
  /**
   * Load battery details
   * @param {string} batteryId - Battery ID
   */
  loadBatteryDetails(batteryId) {
    // Show loading state
    this.showLoadingState();
    
    // Clear previous selection
    document.querySelectorAll('.battery-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Highlight selected battery
    const batteryItem = document.getElementById(`battery-${batteryId}`);
    if (batteryItem) {
      batteryItem.classList.add('selected');
    }
    
    // Determine if this is the test critical battery
    const isTestCriticalBattery = batteryId === 'batt-critical-test';
    
    // Set the API endpoints based on whether this is the test critical battery
    let predictionUrl, recommendationsUrl;
    
    if (isTestCriticalBattery) {
      predictionUrl = '/api/v1/predictive/test/critical-battery/prediction';
      recommendationsUrl = '/api/v1/predictive/test/critical-battery/recommendations';
    } else {
      predictionUrl = `${this.apiBaseUrl}/battery/${batteryId}/prediction`;
      recommendationsUrl = `${this.apiBaseUrl}/battery/${batteryId}/recommendations`;
    }
    
    // Fetch battery prediction
    fetch(predictionUrl)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.renderBatteryPrediction(data.prediction);
          
          // Fetch recommendations
          return fetch(recommendationsUrl);
        } else {
          throw new Error(data.message || 'Failed to load battery prediction');
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.renderRecommendations(data.recommendations);
        } else {
          throw new Error(data.message || 'Failed to load recommendations');
        }
        
        // Hide loading state
        this.hideLoadingState();
      })
      .catch(error => {
        console.error('Error loading battery details:', error);
        this.showError('Failed to load battery details. Please try again.');
        this.hideLoadingState();
      });
  }
  
  /**
   * Load battery recommendations
   * @param {string} batteryId - Battery ID
   */
  async loadBatteryRecommendations(batteryId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/battery/${batteryId}/recommendations`);
      const data = await response.json();
      
      if (data.success) {
        this.renderRecommendations(data.recommendations || []);
      } else {
        this.showError(`Failed to load recommendations for battery ${batteryId}`);
      }
    } catch (error) {
      console.error(`Error loading recommendations for ${batteryId}:`, error);
      this.showError(`Failed to load recommendations for battery ${batteryId}`);
    }
  }
  
  /**
   * Render fleet overview
   */
  renderFleetOverview() {
    if (!this.fleetOverview) return;
    
    // Render fleet health
    const fleetHealthEl = document.getElementById(`${this.containerId}-fleet-health`);
    if (fleetHealthEl) {
      const { statusDistribution, totalBatteries } = this.fleetOverview;
      
      const criticalPercent = (statusDistribution.critical / totalBatteries) * 100;
      const warningPercent = (statusDistribution.warning / totalBatteries) * 100;
      const goodPercent = (statusDistribution.good / totalBatteries) * 100;
      
      fleetHealthEl.innerHTML = `
        <div class="health-chart">
          <div class="chart-segment critical" style="width: ${criticalPercent}%">
            ${statusDistribution.critical > 0 ? statusDistribution.critical : ''}
          </div>
          <div class="chart-segment warning" style="width: ${warningPercent}%">
            ${statusDistribution.warning > 0 ? statusDistribution.warning : ''}
          </div>
          <div class="chart-segment good" style="width: ${goodPercent}%">
            ${statusDistribution.good > 0 ? statusDistribution.good : ''}
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color critical"></div>
            <span>Critical: ${statusDistribution.critical}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color warning"></div>
            <span>Warning: ${statusDistribution.warning}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color good"></div>
            <span>Good: ${statusDistribution.good}</span>
          </div>
        </div>
      `;
    }
    
    // Render maintenance required
    const maintenanceRequiredEl = document.getElementById(`${this.containerId}-maintenance-required`);
    if (maintenanceRequiredEl) {
      const { maintenanceRequired, totalBatteries } = this.fleetOverview;
      
      maintenanceRequiredEl.innerHTML = `
        <div class="maintenance-count">
          ${maintenanceRequired}
          <span class="total">/ ${totalBatteries}</span>
        </div>
        <div class="maintenance-label">
          Batteries requiring maintenance
        </div>
      `;
    }
    
    // Render average RUL
    const averageRulEl = document.getElementById(`${this.containerId}-average-rul`);
    if (averageRulEl) {
      const { averageRUL } = this.fleetOverview;
      
      averageRulEl.innerHTML = `
        <div class="rul-value">
          ${averageRUL}
          <span class="unit">days</span>
        </div>
        <div class="rul-label">
          Average remaining useful life
        </div>
      `;
    }
  }
  
  /**
   * Render battery list
   */
  renderBatteryList() {
    const batteryListEl = document.getElementById(`${this.containerId}-battery-list`);
    if (!batteryListEl) return;
    
    if (this.batteries.length === 0) {
      batteryListEl.innerHTML = '<p class="no-data">No batteries found</p>';
      return;
    }
    
    // Filter batteries based on status filter and search
    const statusFilter = document.getElementById(`${this.containerId}-status-filter`);
    const searchInput = document.getElementById(`${this.containerId}-search`);
    
    let filteredBatteries = [...this.batteries];
    
    if (statusFilter && statusFilter.value !== 'all') {
      filteredBatteries = filteredBatteries.filter(battery => battery.status === statusFilter.value);
    }
    
    if (searchInput && searchInput.value.trim() !== '') {
      const searchTerm = searchInput.value.trim().toLowerCase();
      filteredBatteries = filteredBatteries.filter(battery => 
        battery.batteryId.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort batteries by status (critical first, then warning, then good)
    filteredBatteries.sort((a, b) => {
      const statusOrder = { CRITICAL: 0, WARNING: 1, GOOD: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Render battery list
    batteryListEl.innerHTML = filteredBatteries.map(battery => `
      <div class="battery-item ${battery.status.toLowerCase()} ${this.selectedBatteryId === battery.batteryId ? 'selected' : ''}" 
           data-battery-id="${battery.batteryId}">
        <div class="battery-status ${battery.status.toLowerCase()}">
          <i class="fas ${battery.status === 'CRITICAL' ? 'fa-exclamation-circle' : 
                           battery.status === 'WARNING' ? 'fa-exclamation-triangle' : 
                           'fa-check-circle'}"></i>
        </div>
        <div class="battery-info">
          <div class="battery-id">${battery.batteryId}</div>
          <div class="battery-rul">
            RUL: ${battery.remainingDays} days
          </div>
        </div>
        <div class="battery-maintenance">
          <div class="maintenance-date">
            Next Maintenance:<br>
            ${formatDate(battery.nextMaintenanceDate)}
          </div>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to battery items
    batteryListEl.querySelectorAll('.battery-item').forEach(item => {
      item.addEventListener('click', () => {
        const batteryId = item.getAttribute('data-battery-id');
        this.loadBatteryDetails(batteryId);
        
        // Update selected item
        batteryListEl.querySelectorAll('.battery-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  }
  
  /**
   * Render battery details
   * @param {Object} prediction - Battery prediction data
   */
  renderBatteryDetails(prediction) {
    const detailsEl = document.getElementById(`${this.containerId}-battery-details`);
    if (!detailsEl) return;
    
    const { batteryId, remainingUsefulLife, batteryHealth, nextMaintenanceDate } = prediction;
    
    detailsEl.innerHTML = `
      <div class="battery-details-header">
        <h4>${batteryId}</h4>
        <div class="battery-status ${remainingUsefulLife.status.toLowerCase()}">
          ${remainingUsefulLife.status}
        </div>
      </div>
      
      <div class="battery-details-section">
        <h5>Remaining Useful Life</h5>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Days Remaining:</div>
            <div class="detail-value">${remainingUsefulLife.days}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Human Readable:</div>
            <div class="detail-value">${formatDuration(remainingUsefulLife.days)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Confidence:</div>
            <div class="detail-value">${remainingUsefulLife.confidence}%</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Next Maintenance:</div>
            <div class="detail-value">${formatDate(nextMaintenanceDate)}</div>
          </div>
        </div>
      </div>
      
      <div class="battery-details-section">
        <h5>Battery Health</h5>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">State of Health:</div>
            <div class="detail-value">${batteryHealth.soh.toFixed(2)}%</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Cycle Count:</div>
            <div class="detail-value">${batteryHealth.cycleCount}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Temperature:</div>
            <div class="detail-value">${batteryHealth.temperature.toFixed(1)}°C</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render the recommendations section
   * @param {Array} recommendations - Array of maintenance recommendations
   */
  renderRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById('battery-recommendations');
    
    if (!recommendationsContainer) {
      console.error('Recommendations container not found');
      return;
    }
    
    // Clear existing content
    recommendationsContainer.innerHTML = '';
    
    // Check if there are any recommendations
    if (!recommendations || recommendations.length === 0) {
      recommendationsContainer.innerHTML = `
        <div class="no-recommendations">
          <i class="fas fa-check-circle"></i>
          <p>No maintenance recommendations at this time. Battery is in good condition.</p>
        </div>
      `;
      return;
    }
    
    // Sort recommendations by priority
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Create recommendations list
    const recommendationsList = document.createElement('div');
    recommendationsList.className = 'recommendations-list';
    
    sortedRecommendations.forEach(recommendation => {
      const recommendationItem = document.createElement('div');
      recommendationItem.className = `recommendation-item ${recommendation.priority.toLowerCase()}`;
      
      recommendationItem.innerHTML = `
        <div class="recommendation-header">
          <span class="priority-badge ${recommendation.priority.toLowerCase()}">${recommendation.priority}</span>
          <h4>${recommendation.action}</h4>
        </div>
        <div class="recommendation-body">
          <p>${recommendation.description}</p>
          <div class="recommendation-deadline">
            <i class="fas fa-calendar-alt"></i>
            <span>Deadline: ${formatDate(recommendation.deadline)}</span>
          </div>
        </div>
      `;
      
      recommendationsList.appendChild(recommendationItem);
    });
    
    recommendationsContainer.appendChild(recommendationsList);
  }
  
  /**
   * Filter batteries based on status filter and search
   */
  filterBatteries() {
    this.renderBatteryList();
  }
  
  /**
   * Refresh dashboard
   */
  refreshDashboard() {
    this.loadFleetOverview();
    
    if (this.selectedBatteryId) {
      this.loadBatteryDetails(this.selectedBatteryId);
    }
  }
  
  /**
   * Show loading state
   */
  showLoadingState() {
    const batteryDetailsContainer = document.querySelector('.battery-details-container');
    if (batteryDetailsContainer) {
      batteryDetailsContainer.classList.add('loading');
      
      // Create loading overlay if it doesn't exist
      if (!document.getElementById('loading-overlay')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div><p>Loading battery data...</p>';
        batteryDetailsContainer.appendChild(loadingOverlay);
      } else {
        document.getElementById('loading-overlay').style.display = 'flex';
      }
    }
  }
  
  /**
   * Hide loading state
   */
  hideLoadingState() {
    const batteryDetailsContainer = document.querySelector('.battery-details-container');
    if (batteryDetailsContainer) {
      batteryDetailsContainer.classList.remove('loading');
      
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
      const container = document.createElement('div');
      container.id = 'error-container';
      container.className = 'error-container';
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
          <button class="btn-close"><i class="fas fa-times"></i></button>
        </div>
      `;
      
      // Add close button functionality
      container.querySelector('.btn-close').addEventListener('click', () => {
        container.style.display = 'none';
      });
      
      // Add to the dashboard
      document.getElementById(this.containerId).appendChild(container);
    } else {
      errorContainer.querySelector('p').textContent = message;
      errorContainer.style.display = 'block';
    }
  }
}

// Export for use in other modules
window.PredictiveDashboard = PredictiveDashboard;
