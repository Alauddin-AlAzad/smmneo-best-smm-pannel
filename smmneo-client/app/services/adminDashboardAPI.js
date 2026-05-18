const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
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
export const fetchAdminSettings = () => requestJson('/api/settings');
export const saveAdminSettings = (payload) =>
  requestJson('/api/settings', {
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
export const createOrder = (email, serviceName, link, quantity, chargeAmount, currency) =>
  requestJson('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({ email, serviceName, link, quantity, chargeAmount, currency }),

  // Check for active orders with same link
  export const checkLinkActiveOrder = (email, link) =>
    requestJson(`/api/orders/check-link/${encodeURIComponent(email)}/${encodeURIComponent(link)}`)
      .catch(() => ({ hasActiveOrder: false, activeOrder: null })); // Default to no active order if check fails
  });