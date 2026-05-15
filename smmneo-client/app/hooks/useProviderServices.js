import { useState, useCallback, useEffect } from 'react';
import ProviderAPI from '../services/providerAPI.js';

export function useProviderServices(apiUrl, apiKey) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching services from provider...');

      let data = null;

      if (apiUrl && apiKey) {
        const api = new ProviderAPI(apiUrl, apiKey);
        data = await api.getServices();
      } else {
        // Fallback: ask backend to use stored settings and proxy
        const resp = await fetch('http://localhost:3000/api/provider/services');
        if (!resp.ok) throw new Error('Provider proxy failed');
        const json = await resp.json();
        data = json.data || [];
      }

      if (Array.isArray(data)) {
        setServices(data);
        setTotalCount(data.length);
        console.log(`✅ Fetched ${data.length} services`);
      } else if (data && data.success && Array.isArray(data.success)) {
        // sometimes nested
        setServices(data.success);
        setTotalCount(data.success.length);
      } else if (Array.isArray(data.data)) {
        setServices(data.data);
        setTotalCount(data.data.length);
      } else {
        // unknown format: try to extract array
        const arr = Array.isArray(data) ? data : data?.data || [];
        if (Array.isArray(arr)) {
          setServices(arr);
          setTotalCount(arr.length);
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setError(err.message || 'Failed to fetch services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, apiKey]);

  // Auto-fetch when credentials change
  useEffect(() => {
    if (apiUrl && apiKey) {
      fetchServices();
    }
  }, [apiUrl, apiKey, fetchServices]);

  return {
    services,
    loading,
    error,
    totalCount,
    fetchServices,
  };
}

export default useProviderServices;
