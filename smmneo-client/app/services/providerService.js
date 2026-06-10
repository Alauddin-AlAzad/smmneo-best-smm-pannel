/**
 * Provider API Service
 * Handles all provider CRUD operations with the backend
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000') + '/api/providers';

class ProviderService {
  /**
   * Fetch all providers
   */
  static async getAllProviders() {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch providers');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {      throw error;
    }
  }

  /**
   * Fetch a single provider by ID
   */
  static async getProvider(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch provider');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {      throw error;
    }
  }

  /**
   * Create a new provider
   * @param {Object} providerData - { name, apiUrl, apiKey, disableSync, loginUsername, loginPassword }
   */
  static async createProvider(providerData) {
    try {      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
      });      if (!response.ok) {
        const error = await response.json();        throw new Error(error.error || `HTTP Error: ${response.status}`);
      }

      const result = await response.json();      return result.data;
    } catch (error) {      throw error;
    }
  }

  /**
   * Update an existing provider
   * @param {string} id - Provider ID
   * @param {Object} updateData - Fields to update
   */
  static async updateProvider(id, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update provider');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {      throw error;
    }
  }

  /**
   * Delete a provider
   * @param {string} id - Provider ID
   */
  static async deleteProvider(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete provider');
      }

      const result = await response.json();
      return result;
    } catch (error) {      throw error;
    }
  }

  /**
   * Fetch only active providers
   */
  static async getActiveProviders() {
    try {
      const response = await fetch(`${API_BASE_URL}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch active providers');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {      throw error;
    }
  }
}

export default ProviderService;
