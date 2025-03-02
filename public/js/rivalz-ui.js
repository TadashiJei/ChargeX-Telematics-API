/**
 * ChargeX Telematics - Rivalz.ai UI Integration
 * 
 * This script provides UI components for interacting with the Rivalz.ai RAG integration.
 */

class RivalzUI {
  constructor(apiBasePath = '/api/v1/rivalz') {
    this.apiBasePath = apiBasePath;
    this.token = localStorage.getItem('auth_token');
    this.activeKnowledgeBase = null;
    this.activeSessionId = null;
    this.messageHistory = [];
  }

  /**
   * Initialize the Rivalz UI
   * @param {string} containerId - ID of the container element
   */
  initialize(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID ${containerId} not found`);
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the Rivalz UI
   */
  render() {
    this.container.innerHTML = `
      <div class="rivalz-container">
        <div class="rivalz-header">
          <h2>Rivalz.ai Knowledge Base</h2>
          <div class="rivalz-controls">
            <select id="rivalz-device-select" class="form-select">
              <option value="">Select a device</option>
            </select>
            <button id="rivalz-create-kb" class="btn btn-primary">Create Knowledge Base</button>
            <select id="rivalz-kb-select" class="form-select">
              <option value="">Select a knowledge base</option>
            </select>
          </div>
        </div>
        
        <div class="rivalz-chat-container">
          <div id="rivalz-messages" class="rivalz-messages"></div>
          <div class="rivalz-input-container">
            <input type="text" id="rivalz-query-input" class="form-control" placeholder="Ask a question about your device data...">
            <button id="rivalz-send-query" class="btn btn-primary">Send</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .rivalz-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .rivalz-header {
        padding: 15px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #ddd;
      }
      
      .rivalz-controls {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      
      .rivalz-chat-container {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 400px;
      }
      
      .rivalz-messages {
        flex-grow: 1;
        padding: 15px;
        overflow-y: auto;
        background-color: #fff;
      }
      
      .rivalz-message {
        margin-bottom: 15px;
        padding: 10px 15px;
        border-radius: 18px;
        max-width: 80%;
        word-wrap: break-word;
      }
      
      .rivalz-message.user {
        background-color: #007bff;
        color: white;
        align-self: flex-end;
        margin-left: auto;
      }
      
      .rivalz-message.assistant {
        background-color: #f1f1f1;
        color: #333;
        align-self: flex-start;
      }
      
      .rivalz-input-container {
        display: flex;
        padding: 10px;
        border-top: 1px solid #ddd;
        background-color: #f8f9fa;
      }
      
      .rivalz-input-container input {
        flex-grow: 1;
        margin-right: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    // Load devices
    this.loadDevices();

    // Create knowledge base button
    document.getElementById('rivalz-create-kb').addEventListener('click', () => {
      const deviceId = document.getElementById('rivalz-device-select').value;
      if (!deviceId) {
        this.showNotification('Please select a device first', 'error');
        return;
      }
      this.createKnowledgeBase(deviceId);
    });

    // Knowledge base select
    document.getElementById('rivalz-kb-select').addEventListener('change', (e) => {
      this.activeKnowledgeBase = e.target.value;
      this.activeSessionId = null;
      this.messageHistory = [];
      this.renderMessages();
    });

    // Send query button
    document.getElementById('rivalz-send-query').addEventListener('click', () => {
      this.sendQuery();
    });

    // Send query on Enter key
    document.getElementById('rivalz-query-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendQuery();
      }
    });
  }

  /**
   * Load devices from the API
   */
  async loadDevices() {
    try {
      const response = await fetch('/api/v1/devices', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load devices');
      }
      
      const data = await response.json();
      const deviceSelect = document.getElementById('rivalz-device-select');
      
      deviceSelect.innerHTML = '<option value="">Select a device</option>';
      
      data.data.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id || device._id;
        option.textContent = device.name || device.id || device._id;
        deviceSelect.appendChild(option);
      });

      // Also load knowledge bases
      this.loadKnowledgeBases();
    } catch (error) {
      console.error('Error loading devices:', error);
      this.showNotification('Failed to load devices', 'error');
    }
  }

  /**
   * Load knowledge bases from the API
   */
  async loadKnowledgeBases() {
    try {
      const response = await fetch(`${this.apiBasePath}/knowledge-bases`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load knowledge bases');
      }
      
      const data = await response.json();
      const kbSelect = document.getElementById('rivalz-kb-select');
      
      kbSelect.innerHTML = '<option value="">Select a knowledge base</option>';
      
      data.data.forEach(kb => {
        const option = document.createElement('option');
        option.value = kb.id;
        option.textContent = kb.name;
        kbSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      // Don't show notification as this might be the first time using Rivalz
    }
  }

  /**
   * Create a knowledge base for a device
   * @param {string} deviceId - ID of the device
   */
  async createKnowledgeBase(deviceId) {
    try {
      this.showNotification('Creating knowledge base...', 'info');
      
      const response = await fetch(`${this.apiBasePath}/device/${deviceId}/knowledge-base`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          name: `Device Telemetry - ${deviceId} - ${new Date().toISOString().split('T')[0]}`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create knowledge base');
      }
      
      const data = await response.json();
      this.showNotification('Knowledge base created successfully', 'success');
      
      // Reload knowledge bases
      this.loadKnowledgeBases();
      
      // Set the active knowledge base
      this.activeKnowledgeBase = data.data.id;
      
      // Update the select element
      setTimeout(() => {
        document.getElementById('rivalz-kb-select').value = this.activeKnowledgeBase;
      }, 1000);
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      this.showNotification('Failed to create knowledge base', 'error');
    }
  }

  /**
   * Send a query to the knowledge base
   */
  async sendQuery() {
    const queryInput = document.getElementById('rivalz-query-input');
    const query = queryInput.value.trim();
    
    if (!query) {
      return;
    }
    
    if (!this.activeKnowledgeBase) {
      this.showNotification('Please select a knowledge base first', 'error');
      return;
    }
    
    // Add user message to UI
    this.addMessage('user', query);
    queryInput.value = '';
    
    try {
      const response = await fetch(`${this.apiBasePath}/knowledge-base/${this.activeKnowledgeBase}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          query,
          sessionId: this.activeSessionId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to query knowledge base');
      }
      
      const data = await response.json();
      
      // Add assistant message to UI
      this.addMessage('assistant', data.data.answer);
      
      // Save session ID for follow-up questions
      this.activeSessionId = data.data.sessionId;
    } catch (error) {
      console.error('Error querying knowledge base:', error);
      this.addMessage('assistant', 'Sorry, I encountered an error processing your query. Please try again.');
    }
  }

  /**
   * Add a message to the chat
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   */
  addMessage(role, content) {
    this.messageHistory.push({ role, content });
    this.renderMessages();
  }

  /**
   * Render all messages in the chat
   */
  renderMessages() {
    const messagesContainer = document.getElementById('rivalz-messages');
    messagesContainer.innerHTML = '';
    
    this.messageHistory.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = `rivalz-message ${message.role}`;
      messageElement.textContent = message.content;
      messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Show a notification to the user
   * @param {string} message - Notification message
   * @param {string} type - 'success', 'error', 'info'
   */
  showNotification(message, type = 'info') {
    // Check if notification container exists
    let notificationContainer = document.querySelector('.rivalz-notifications');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'rivalz-notifications';
      document.body.appendChild(notificationContainer);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .rivalz-notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .rivalz-notification {
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 4px;
          color: white;
          width: 300px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: rivalz-fade-in 0.3s ease-out;
        }
        
        .rivalz-notification.success {
          background-color: #28a745;
        }
        
        .rivalz-notification.error {
          background-color: #dc3545;
        }
        
        .rivalz-notification.info {
          background-color: #17a2b8;
        }
        
        @keyframes rivalz-fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `rivalz-notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      notification.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if the container exists
  if (document.getElementById('rivalz-container')) {
    const rivalzUI = new RivalzUI();
    rivalzUI.initialize('rivalz-container');
  }
});

// Export for use in other scripts
window.RivalzUI = RivalzUI;
