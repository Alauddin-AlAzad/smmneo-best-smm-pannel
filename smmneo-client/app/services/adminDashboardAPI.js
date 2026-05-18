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