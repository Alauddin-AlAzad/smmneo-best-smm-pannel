import { useState, useCallback, useEffect } from 'react';
import ProviderAPI from '../services/providerAPI.js';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';

function appendBooleanParam(params, key, value) {
  if (value === true) {
    params.append(key, 'true');
  } else if (value === false) {
    params.append(key, 'false');
  }
}

export function useProviderServices(apiUrl, apiKey) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const fetchServices = useCallback(async (page = 1, limit = 50, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      let data = null;
      let paginationData = null;

      if (apiUrl && apiKey) {
        const api = new ProviderAPI(apiUrl, apiKey);
        data = await api.getServices();
        // For direct API, handle pagination client-side
        if (Array.isArray(data)) {
          const total = data.length;
          const start = (page - 1) * limit;
          const end = start + limit;
          const paginatedData = data.slice(start, end);
          
          paginationData = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: end < total,
          };
          
          setServices(paginatedData);
          setPagination(paginationData);
        }
      } else {
        // Backend proxy with server-side pagination
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (options.admin) params.append('admin', 'true');
        if (options.search) params.append('search', options.search);
        if (options.category) params.append('category', options.category);
        if (options.subcategory) params.append('subcategory', options.subcategory);
        appendBooleanParam(params, 'refill', options.refill);
        appendBooleanParam(params, 'cancel', options.cancel);

        const resp = await fetch(getApiUrl(`${API_ENDPOINTS.PROVIDER_SERVICES}?${params.toString()}`));
        if (!resp.ok) throw new Error(`Provider proxy failed: ${resp.statusText}`);
        const json = await resp.json();
        
        if (json.success) {
          const services = json.data || [];
          paginationData = json.pagination || {
            page,
            limit,
            total: services.length,
            totalPages: 1,
            hasMore: false,
          };
          
          setServices(services);
          setPagination(paginationData);
        } else {
          throw new Error(json.error || 'Invalid proxy response');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch services');
      setServices([]);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: 0,
        totalPages: 0,
        hasMore: false,
      }));
    } finally {
      setLoading(false);
    }
  }, [apiUrl, apiKey]);

  // Auto-fetch page 1 when credentials change
  useEffect(() => {
    if (apiUrl && apiKey) {
      fetchServices(1, 50);
    }
  }, [apiUrl, apiKey]);

  // Fetch page 1 when only backend is used (no apiUrl/apiKey)
  useEffect(() => {
    if (!apiUrl && !apiKey) {
      fetchServices(1, 50);
    }
  }, []);

  return {
    services,
    loading,
    error,
    pagination,
    totalCount: pagination.total,
    fetchServices,
  };
}

export default useProviderServices;
