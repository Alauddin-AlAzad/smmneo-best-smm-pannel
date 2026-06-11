/**
 * Centralized API Configuration
 * Uses VITE_API_URL from environment, falls back to production or localhost
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'https://smmneo-server.vercel.app'
).replace(/\/$/, ''); // Remove trailing slash if present

export const getApiUrl = (path = '') => {
  return `${API_BASE_URL}${path}`;
};

export const API_ENDPOINTS = {
  // User endpoints
  USERS_REGISTER: '/api/users/register',
  USERS_SYNC_FIREBASE: '/api/users/sync-firebase',
  USERS_SYNC_BALANCE: '/api/users/sync-balance',
  USERS_ME: '/api/users/me',

  // Provider endpoints
  PROVIDERS: '/api/providers',
  PROVIDER_SERVICES: '/api/provider/services',
  PROVIDER_CATEGORIES: '/api/provider/categories',
  PROVIDER_SUBCATEGORIES: '/api/provider/subcategories',
  PROVIDER_SERVICE_PRICING: (id) => `/api/providers/${id}/service-pricing`,

  // Payment endpoints
  PAYMENTS_ADD_FUND_REQUEST: '/api/add-fund-request',
  PAYMENTS_ADD_FUND_VERIFY: (id) => `/api/add-fund-request/${id}/verify`,
  PAYMENTS_SETTINGS: '/api/payments/payment-settings',
  PAYMENTS: '/api/payments',

  // Settings endpoints
  SETTINGS: '/api/settings',

  // Admin endpoints
  ADMIN_CSRF_TOKEN: '/smmsecure/admin/auth/csrf-token',

  // Tickets endpoints
  TICKETS_USER: (email) => `/api/tickets/user/${encodeURIComponent(email)}`,

  // Orders endpoints
  ORDERS_USER: (email) => `/api/orders/user/${encodeURIComponent(email)}`,
};

export default API_BASE_URL;
