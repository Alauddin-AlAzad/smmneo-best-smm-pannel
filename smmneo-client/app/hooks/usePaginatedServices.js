import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

// API URL for browser environment
const API_BASE = 'http://localhost:3000/api';

console.log('📡 API Base URL:', API_BASE);
const DEBOUNCE_DELAY = 500; // ms


export function usePaginatedServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
  });
  const debounceTimer = useRef(null);

  // Fetch services with pagination
  const fetchServices = useCallback(async (page = 1, search = '', category = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
      });

      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const url = `${API_BASE}/services?${params.toString()}`;
      console.log('🔄 Fetching:', url); // Debug log

      const response = await axios.get(url);
      console.log('✅ Response:', response.data); // Debug log

      if (response.data.success) {
        setServices(response.data.data || []);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch services');
      }
    } catch (err) {
      console.error('❌ Fetch Error:', err); // Debug log
      setError(err.response?.data?.error || err.message || 'Failed to fetch services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search with debounce
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchServices(1, searchTerm, filters.category);
    }, DEBOUNCE_DELAY);
  }, [filters.category, fetchServices]);

  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setFilters(prev => ({ ...prev, category }));
    fetchServices(1, filters.search, category);
  }, [filters.search, fetchServices]);

  // Change page
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchServices(page, filters.search, filters.category);
    }
  }, [pagination.totalPages, filters, fetchServices]);

  // Next page
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination, goToPage]);

  // Previous page
  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [pagination, goToPage]);

  // Initial load
  useEffect(() => {
    fetchServices(1, filters.search, filters.category);
  }, []);

  return {
    services,
    loading,
    error,
    pagination,
    filters,
    handleSearch,
    handleCategoryChange,
    goToPage,
    nextPage,
    previousPage,
    fetchServices,
  };
}

export default usePaginatedServices;
