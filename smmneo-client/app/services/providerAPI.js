/**
 * Provider API Client
 * Uses backend proxy to avoid CORS issues
 * All requests go to local backend which then proxies to provider API
 */

class ProviderAPI {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  /**
   * Internal method to call backend proxy
   */
  async callBackendProxy(action, additionalParams = {}) {
    try {
      const response = await fetch(`${this.backendUrl}/api/providers/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: this.apiUrl,
          apiKey: this.apiKey,
          ...additionalParams,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Backend returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend Proxy Error:', error.message);
      throw error;
    }
  }

  /**
   * Get all services from provider
   */
  async getServices() {
    return this.callBackendProxy('services');
  }

  /**
   * Get account balance
   */
  async getBalance() {
    return this.callBackendProxy('balance');
  }

  /**
   * Add order
   */
  async addOrder(orderData) {
    return this.callBackendProxy('add', orderData);
  }

  /**
   * Get order status
   */
  async getStatus(orderId) {
    return this.callBackendProxy('status', { order: orderId });
  }

  /**
   * Get multiple orders status
   */
  async getMultiStatus(orderIds) {
    const orderString = Array.isArray(orderIds) ? orderIds.join(',') : orderIds;
    return this.callBackendProxy('status', { orders: orderString });
  }

  /**
   * Refill order
   */
  async refill(orderId) {
    return this.callBackendProxy('refill', { order: orderId });
  }

  /**
   * Get refill status
   */
  async getRefillStatus(refillId) {
    return this.callBackendProxy('refill_status', { refill: refillId });
  }

  /**
   * Cancel orders
   */
  async cancel(orderIds) {
    const orderString = Array.isArray(orderIds) ? orderIds.join(',') : orderIds;
    return this.callBackendProxy('cancel', { orders: orderString });
  }
}

export default ProviderAPI;
