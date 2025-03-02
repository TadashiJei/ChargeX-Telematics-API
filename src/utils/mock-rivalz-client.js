/**
 * Mock implementation of the Rivalz.ai client for testing purposes
 */

export class RivalzClient {
  constructor(secretToken) {
    this.secretToken = secretToken;
    this.knowledgeBases = new Map();
    this.chatSessions = new Map();
    this.conversations = new Map();
    console.log('Mock Rivalz client initialized with token:', secretToken);
  }

  /**
   * Create a RAG knowledge base from a document
   * @param {string} filePath - Path to the document
   * @param {string} name - Name of the knowledge base
   * @returns {Promise<object>} Knowledge base details
   */
  async createRagKnowledgeBase(filePath, name) {
    const id = `kb_${Date.now()}`;
    const knowledgeBase = {
      id,
      name,
      status: 'processing',
      createdAt: new Date().toISOString(),
      documentCount: 1,
      vectorCount: 0
    };

    this.knowledgeBases.set(id, knowledgeBase);
    
    // Simulate processing time
    setTimeout(() => {
      knowledgeBase.status = 'ready';
      knowledgeBase.vectorCount = 150;
      console.log(`Knowledge base ${id} is now ready`);
    }, 2000);

    return knowledgeBase;
  }

  /**
   * Get a knowledge base by ID
   * @param {string} knowledgeBaseId - ID of the knowledge base
   * @returns {Promise<object>} Knowledge base details
   */
  async getKnowledgeBase(knowledgeBaseId) {
    const knowledgeBase = this.knowledgeBases.get(knowledgeBaseId);
    if (!knowledgeBase) {
      throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
    }
    return knowledgeBase;
  }

  /**
   * Create a chat session with a knowledge base
   * @param {string} knowledgeBaseId - ID of the knowledge base
   * @param {string} question - Question to ask
   * @param {string} sessionId - Optional session ID for continuing a conversation
   * @returns {Promise<object>} Chat session details
   */
  async createChatSession(knowledgeBaseId, question, sessionId = null) {
    // Check if the knowledge base exists
    const knowledgeBase = this.knowledgeBases.get(knowledgeBaseId);
    if (!knowledgeBase) {
      throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
    }

    // Generate a session ID if not provided
    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
    }

    // Generate a mock answer based on the question
    let answer = '';
    if (question.toLowerCase().includes('battery level')) {
      answer = 'The battery level has been steadily increasing from 85% to 95% over the monitored period, showing a healthy charging pattern.';
    } else if (question.toLowerCase().includes('temperature')) {
      answer = 'The battery temperature fluctuated between 24.8°C and 26.2°C, which is within the normal operating range.';
    } else if (question.toLowerCase().includes('voltage')) {
      answer = 'The voltage increased from 12.6V to 12.9V as the battery charged, indicating normal charging behavior.';
    } else if (question.toLowerCase().includes('current')) {
      answer = 'The current decreased from 2.1A to 0.5A as the battery approached full charge, which is the expected behavior during the constant voltage phase of charging.';
    } else if (question.toLowerCase().includes('status')) {
      answer = 'The final battery status was CHARGED, indicating that the battery completed its charging cycle successfully.';
    } else if (question.toLowerCase().includes('location')) {
      answer = 'The battery remained in approximately the same location (around latitude 37.775, longitude -122.419) throughout the monitoring period.';
    } else {
      answer = 'Based on the telemetry data, the device appears to be functioning normally with no anomalies detected.';
    }

    // Create the chat session
    const chatSession = {
      sessionId,
      question,
      answer,
      timestamp: new Date().toISOString(),
      knowledgeBaseId
    };

    // Store the chat session
    if (!this.chatSessions.has(sessionId)) {
      this.chatSessions.set(sessionId, []);
    }
    this.chatSessions.get(sessionId).push(chatSession);

    // Store the conversation
    if (!this.conversations.has(knowledgeBaseId)) {
      this.conversations.set(knowledgeBaseId, []);
    }
    this.conversations.get(knowledgeBaseId).push({
      sessionId,
      messages: [
        {
          role: 'user',
          content: question,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: answer,
          timestamp: new Date().toISOString()
        }
      ]
    });

    return chatSession;
  }

  /**
   * Get all conversations for a knowledge base
   * @param {string} knowledgeBaseId - ID of the knowledge base
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations(knowledgeBaseId) {
    return this.conversations.get(knowledgeBaseId) || [];
  }
}

export default RivalzClient;
