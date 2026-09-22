const fs = require('fs');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

class AIServiceClient {
  /**
   * Health check for Python AI service
   */
  async checkHealth() {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) {
        throw new Error(`AI service returned HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return {
        status: 'UNREACHABLE',
        error: err.message,
        url: AI_SERVICE_URL
      };
    }
  }

  /**
   * Forwards a document upload to Python AI Service
   */
  async ingestDocument(fileBuffer, originalName, mimeType, domain) {
    const formData = new FormData();
    formData.append('domain', domain || 'rag');
    formData.append('file', fileBuffer, {
      filename: originalName,
      contentType: mimeType || 'application/octet-stream'
    });

    const response = await fetch(`${AI_SERVICE_URL}/api/ingest`, {
      method: 'POST',
      body: formData.getBuffer(),
      headers: formData.getHeaders(),
      signal: AbortSignal.timeout(120000) // 2 minutes for processing
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Python AI service error (${response.status}): ${errText}`);
    }

    return await response.json();
  }

  /**
   * Executes the domain-aware query pipeline
   */
  async query(payload) {
    const response = await fetch(`${AI_SERVICE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI query pipeline error (${response.status}): ${errText}`);
    }

    return await response.json();
  }

  /**
   * Fetch active domains with chunk and document counts
   */
  async getDomains() {
    const response = await fetch(`${AI_SERVICE_URL}/api/domains`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domains: HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Create dynamic domain
   */
  async createDomain(name, description) {
    const response = await fetch(`${AI_SERVICE_URL}/api/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create domain: ${err}`);
    }

    return await response.json();
  }

  /**
   * List indexed documents
   */
  async getDocuments() {
    const response = await fetch(`${AI_SERVICE_URL}/api/documents`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: HTTP ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Get document by ID
   */
  async getDocument(docId) {
    const response = await fetch(`${AI_SERVICE_URL}/api/documents/${docId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Document ${docId} not found`);
    }
    return await response.json();
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(docId) {
    const response = await fetch(`${AI_SERVICE_URL}/api/documents/${docId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to delete document ${docId}`);
    }
    return await response.json();
  }
}

module.exports = new AIServiceClient();
