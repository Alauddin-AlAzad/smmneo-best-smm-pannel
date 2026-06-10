import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to fetch and organize services for dashboard
 * Uses backend proxy to fetch from configured provider
 */
export function useDashboardServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServicesFromBackend = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/provider/services');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format');
      }

      // Handle both array and object responses from provider APIs
      let servicesList = Array.isArray(data.data) ? data.data : Object.values(data.data);

      // Normalize service data structure
      servicesList = servicesList.map((service, index) => {
        // Handle different provider response formats
        const serviceId = service.service_id || service.serviceId || service.id || index;
        const name = service.name || service.title || 'Unknown Service';
        const category = service.category || service.type || 'Other';
        const price = parseFloat(service.rate || service.price || 0);
        const minOrder = parseInt(service.min || service.minQuantity || 1);
        const maxOrder = parseInt(service.max || service.maxQuantity || 10000);
        const refill = service.refill === 1 || service.refill === true || service.refill === 'true';

        return {
          serviceId,
          id: serviceId,
          name,
          category,
          price,
          minQuantity: minOrder,
          maxQuantity: maxOrder,
          minOrder,
          maxOrder,
          refill,
          // Preserve original fields for reference
          original: service
        };
      });

      // Extract unique categories and sort them
      const uniqueCategories = [...new Set(servicesList.map(s => s.category))].sort();
      
      setServices(servicesList);
      setCategories(uniqueCategories);      return { services: servicesList, categories: uniqueCategories };
    } catch (err) {      setError(err.message);
      setServices([]);
      setCategories([]);
      return { services: [], categories: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchServicesFromBackend();
  }, [fetchServicesFromBackend]);

  /**
   * Get services grouped by category
   */
  const getServicesByCategory = useCallback((categoryFilter = null) => {
    return services.reduce((grouped, service) => {
      const category = service.category;
      
      if (categoryFilter && category !== categoryFilter) {
        return grouped;
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
      return grouped;
    }, {});
  }, [services]);

  /**
   * Get all services in a specific category
   */
  const getServicesByName = useCallback((categoryName) => {
    return services.filter(s => s.category === categoryName);
  }, [services]);

  /**
   * Search services by name or category
   */
  const searchServices = useCallback((query) => {
    if (!query) return services;
    
    const lowerQuery = query.toLowerCase();
    return services.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.category.toLowerCase().includes(lowerQuery) ||
      String(s.serviceId).includes(query)
    );
  }, [services]);

  /**
   * Refetch services
   */
  const refetch = useCallback(() => {
    return fetchServicesFromBackend();
  }, [fetchServicesFromBackend]);

  return {
    services,
    categories,
    loading,
    error,
    getServicesByCategory,
    getServicesByName,
    searchServices,
    refetch,
  };
}

export default useDashboardServices;
