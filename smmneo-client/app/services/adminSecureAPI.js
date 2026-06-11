import { getApiUrl } from '../config/api.js';

const ACCESS_TOKEN_KEY = 'smmsecure_admin_access_token';
let csrfToken = null;

function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function setAccessToken(token) {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

function clearAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  csrfToken = null;
}

async function fetchCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetch(getApiUrl('/smmsecure/admin/auth/csrf-token'), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Failed to fetch CSRF token');
  }
  csrfToken = data.data.csrfToken;
  return csrfToken;
}

async function refreshAdminToken() {
  await fetchCsrfToken();
  const response = await fetch(getApiUrl('/smmsecure/admin/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    clearAccessToken();
    throw new Error(data.error || 'Failed to refresh admin session');
  }
  setAccessToken(data.data.accessToken);
  return data.data;
}

async function requestJson(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = await fetchCsrfToken();
  }

  const response = await fetch(getApiUrl(path), {
    credentials: 'include',
    ...options,
    method,
    headers,
  });

  let data = {};
  let responseText = '';
  try {
    responseText = await response.text();
    data = responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    data = {};
  }

  if (response.status === 401 && !options._retry) {
    try {
      await refreshAdminToken();
      return requestJson(path, { ...options, _retry: true });
    } catch (refreshError) {
      clearAccessToken();
      throw refreshError;
    }
  }

  if (!response.ok || data.success === false) {
    const errorMessage = data.error || data.message || responseText || `Request failed for ${path}`;
    const errorPayload = {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      error: errorMessage,
    };
    throw new Error(JSON.stringify(errorPayload));
  }

  return data.data;
}

export async function loginAdmin(email, password) {
  const data = await requestJson('/smmsecure/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.accessToken);
  csrfToken = null;
  return data;
}

export async function fetchAdminMe() {
  return requestJson('/smmsecure/admin/auth/me');
}

export async function logoutAdmin() {
  const data = await requestJson('/smmsecure/admin/auth/logout', {
    method: 'POST',
  });
  clearAccessToken();
  return data;
}

export async function fetchAdminUsers(limit = 50) {
  return requestJson(`/smmsecure/admin/users?limit=${limit}`);
}

export async function createAdminUser(payload) {
  return requestJson('/smmsecure/admin/users/create-admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(id) {
  return requestJson(`/smmsecure/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function updateAdminUserStatus(id, status) {
  return requestJson(`/smmsecure/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getStoredAdminAccessToken() {
  return getAccessToken();
}

export function clearAdminSession() {
  clearAccessToken();
}
