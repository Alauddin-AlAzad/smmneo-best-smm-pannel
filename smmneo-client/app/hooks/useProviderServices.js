import { useState, useCallback, useEffect } from 'react';
import ProviderAPI from '../services/providerAPI.js';

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
      console.log(`🔄 Fetching services (page=${page}, limit=${limit})...`);

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
          console.log(`✅ Fetched ${paginatedData.length}/${total} services (page ${page})`);
        }
      } else {
        // Backend proxy with server-side pagination
        const adminQuery = options.admin ? '&admin=true' : '';
        const resp = await fetch(`http://localhost:3000/api/provider/services?page=${page}&limit=${limit}${adminQuery}`);
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
          console.log(`✅ Fetched ${services.length}/${paginationData.total} services (page ${page})`);
        } else {
          throw new Error(json.error || 'Invalid proxy response');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching services:', err);
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
