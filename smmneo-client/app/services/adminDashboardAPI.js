import { getStoredAdminAccessToken, clearAdminSession } from './adminSecureAPI.js';
import { getApiUrl } from '../config/api.js';

async function requestJson(path, options = {}) {
  const accessToken = getStoredAdminAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(getApiUrl(path), {
    headers,
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    clearAdminSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/smmsecure/admin/login';
    }
    throw new Error(data.error || data.message || 'Unauthorized admin access');
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed for ${path}`);
  }

  return data.data;
}

export const fetchAdminOverview = () => requestJson('/api/admin/overview');
export const fetchAdminUsers = (limit = 50) => requestJson(`/api/admin/users?limit=${limit}`);
export const fetchAdminUserDetails = (userId) => requestJson(`/api/admin/users/${userId}`);
export const fetchAdminOrders = (limit = 50) => requestJson(`/api/admin/orders?limit=${limit}`);
export const fetchAdminTickets = (limit = 50) => requestJson(`/api/admin/tickets?limit=${limit}`);
export const fetchAdminTicketThread = (ticketId, viewer = 'admin') =>
  requestJson(`/api/admin/tickets/${encodeURIComponent(ticketId)}?viewer=${encodeURIComponent(viewer)}`);
export const replyToAdminTicket = (ticketId, payload) =>
  requestJson(`/api/admin/tickets/${encodeURIComponent(ticketId)}/replies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const closeAdminTicket = (ticketId) =>
  requestJson(`/api/admin/tickets/${encodeURIComponent(ticketId)}/close`, {
    method: 'POST',
  });
export const fetchAdminSettings = () => requestJson('/api/settings');
export const saveAdminSettings = (payload) =>
  requestJson('/api/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchUserOrders = (email, limit = 100, status = 'all') =>
  requestJson(`/api/orders/user/${encodeURIComponent(email)}?limit=${limit}&status=${encodeURIComponent(status)}`);

export const fetchUserTickets = (email, limit = 100, status = 'all') =>
  requestJson(`/api/tickets/user/${encodeURIComponent(email)}?limit=${limit}&status=${encodeURIComponent(status)}`);

export const fetchTicketThread = (ticketId, viewer = 'user') =>
  requestJson(`/api/tickets/${encodeURIComponent(ticketId)}?viewer=${encodeURIComponent(viewer)}`);

export const createSupportTicket = (payload) =>
  requestJson('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const replyToSupportTicket = (ticketId, payload) =>
  requestJson(`/api/tickets/${encodeURIComponent(ticketId)}/replies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// User management endpoints
export const updateAdminUser = (userId, payload) =>
  requestJson(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const updateUserBalance = (userId, amount, action = 'set') =>
  requestJson(`/api/admin/users/${userId}/balance`, {
    method: 'POST',
    body: JSON.stringify({ amount, action }),
  });

// Get current user status by email
export const checkUserStatus = (email) =>
  requestJson(`/api/users/status/${encodeURIComponent(email)}`)
    .catch(() => ({ status: 'active' })); // Default to active if not found

// Create order and deduct balance
export const createOrder = (email, serviceName, link, quantity, chargeAmount, currency, providerServiceId) =>
  requestJson('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({ email, serviceName, link, quantity, chargeAmount, currency, providerServiceId }),
  });

export const cancelOrder = (orderId) =>
  requestJson(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
  });

export const refreshProviderOrder = (providerOrderId) =>
  requestJson(`/api/provider/order/${encodeURIComponent(providerOrderId)}`);

// Check for active orders with same link
export const checkLinkActiveOrder = (email, link) =>
  requestJson(`/api/orders/check-link/${encodeURIComponent(email)}/${encodeURIComponent(link)}`)
    .catch(() => ({ hasActiveOrder: false, activeOrder: null })); // Default to no active order if check fails