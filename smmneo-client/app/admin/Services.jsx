import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import useProviderServices from '../hooks/useProviderServices.js';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import toast from 'react-hot-toast';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';

const AdminServices = () => {
  const PAGE_SIZE = 50;
  const [providerSettings, setProviderSettings] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('0');
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [selectAllAcrossApi, setSelectAllAcrossApi] = useState(false);
  const [deselectedServices, setDeselectedServices] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refillOnly, setRefillOnly] = useState(false);
  const [cancelOnly, setCancelOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedServices, setAllLoadedServices] = useState([]);
  const sentinelRef = useRef(null);

  // Fetch services from global provider settings via proxy
  const { services, loading, error, pagination, fetchServices } = useProviderServices(
    null,  // Don't pass credentials - use backend proxy instead
    null
  );

  const currentQuery = useMemo(() => ({
    admin: true,
    search: appliedSearch.trim() || undefined,
    refill: refillOnly || undefined,
    cancel: cancelOnly || undefined,
  }), [appliedSearch, refillOnly, cancelOnly]);

  const resetSelectionState = useCallback(() => {
    setSelectAllAcrossApi(false);
    setSelectedServices(new Set());
    setDeselectedServices(new Set());
  }, []);

  const refreshServices = useCallback(async (page = 1) => {
    setCurrentPage(page);
    setAllLoadedServices([]);
    resetSelectionState();
    await fetchServices(page, PAGE_SIZE, currentQuery);
  }, [fetchServices, currentQuery, resetSelectionState]);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchTerm.trim());
  }, [searchTerm]);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setAppliedSearch(searchTerm.trim());
    }
  }, [searchTerm]);

  const toggleRefillOnly = useCallback(() => {
    setRefillOnly((value) => !value);
  }, []);

  const toggleCancelOnly = useCallback(() => {
    setCancelOnly((value) => !value);
  }, []);

  const fetchProviderSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch(getApiUrl(API_ENDPOINTS.SETTINGS));
      const data = await response.json();
      if (data && data.success && data.data && data.data.provider) {
        setProviderSettings(data.data.provider);
        setProfitPercentage(String(data.data.provider.defaultProfitPercentage ?? data.data.provider.profitPercentage ?? 0));
      } else {
        setProviderSettings(null);
        setProfitPercentage('0');
      }
    } catch (error) {
      toast.error('Failed to load provider settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      setProvidersError(null);
      const response = await fetch(getApiUrl(API_ENDPOINTS.PROVIDERS));
      const data = await response.json();
      if (data && data.success && Array.isArray(data.data)) {
        setProviders(data.data);
      } else if (data && !data.success) {
        setProvidersError(data.error || 'Unable to load providers');
      }
    } catch (error) {
      setProvidersError(error.message || 'Failed to load providers');
      toast.error('Failed to load providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  const activateProvider = async (provider, options = {}) => {
    const { silent = false } = options;

    if (!provider) {
      if (!silent) {
        toast.error('Please select a provider first');
      }
      return false;
    }

    try {
      const shouldForceReload = providerSettings?.apiUrl === provider?.apiUrl;
      const normalizedProfitPercentage = Number.parseFloat(profitPercentage) || 0;
      const providerPayload = {
        ...provider,
        defaultProfitPercentage: normalizedProfitPercentage,
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.SETTINGS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerPayload }),
      });

      const data = await response.json();
      if (data && data.success) {
        const activeProvider = data.data?.provider || provider;
        setProviderSettings(activeProvider);
        setSelectedProviderId(provider._id || '');
        setProfitPercentage(String(activeProvider.defaultProfitPercentage ?? activeProvider.profitPercentage ?? normalizedProfitPercentage));
        setCurrentPage(1);
        setAllLoadedServices([]);

        if (shouldForceReload) {
          await fetchServices(1, PAGE_SIZE, currentQuery);
        }

        if (!silent) {
          toast.success(`Switched to ${provider.name}`);
        }
        return true;
      }

      if (!silent) {
        toast.error(data.error || 'Failed to switch provider');
      }
      return false;
    } catch (error) {
      if (!silent) {
        toast.error('Failed to switch provider');
      }
      return false;
    }
  };

  const handleSwitchProvider = async () => {
    const provider = providers.find((item) => item._id === selectedProviderId);
    await activateProvider(provider);
  };

  const handleSaveProfitPercentage = async () => {
    const provider = providers.find((item) => item._id === selectedProviderId) || providerSettings;

    if (!provider) {
      toast.error('Please select a provider first');
      return;
    }

    await activateProvider(provider);
  };

  // Load more services to current loaded set
  const handleLoadMore = useCallback(async () => {
    if (loading || !pagination.hasMore) {
      return;
    }

    const nextPage = currentPage + 1;
    try {
      await fetchServices(nextPage, PAGE_SIZE, currentQuery);
      setCurrentPage(nextPage);
    } catch (err) {
      toast.error('Failed to load more services');
    }
  }, [currentPage, fetchServices, loading, pagination.hasMore, currentQuery]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !pagination.hasMore || !allLoadedServices.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          handleLoadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [allLoadedServices.length, handleLoadMore, loading, pagination.hasMore]);

  // Load global provider settings from backend + poll for changes
  useEffect(() => {
    fetchProviderSettings();
    fetchProviders();

    // Poll for provider changes every 5 seconds
    const pollInterval = setInterval(() => {
      fetchProviderSettings();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (loadingSettings) {
      return;
    }

    if (!providers.length) {
      return;
    }

    const matchedProviderByCurrent =
      providers.find((provider) => String(provider._id) === String(providerSettings?._id)) ||
      providers.find((provider) => provider.apiUrl === providerSettings?.apiUrl);

    if (matchedProviderByCurrent) {
      const hasValidSelection = providers.some((provider) => String(provider._id) === String(selectedProviderId));
      if (!selectedProviderId || !hasValidSelection) {
        setSelectedProviderId(matchedProviderByCurrent._id);
      }
      return;
    }

    const fallbackProvider = providers[0];
    if (fallbackProvider && fallbackProvider._id !== selectedProviderId) {
      setSelectedProviderId(fallbackProvider._id);
    }
  }, [providers, providerSettings, selectedProviderId, loadingSettings]);

  useEffect(() => {
    if (providerSettings?.apiUrl) {
      refreshServices(1);
    }
  }, [providerSettings?.apiUrl, appliedSearch, refillOnly, cancelOnly, refreshServices]);

  // Accumulate loaded services
  useEffect(() => {
    if (services && services.length > 0) {
      setAllLoadedServices((prev) => {
        const merged = new Map();
        prev.forEach((item) => merged.set(String(item.service), item));
        services.forEach((item) => merged.set(String(item.service), item));
        return Array.from(merged.values());
      });
    }
  }, [services]);

  const visibleServices = useMemo(() => allLoadedServices, [allLoadedServices]);

  const groupedServices = useMemo(() => {
    return visibleServices.reduce((acc, service) => {
      const category = service.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});
  }, [visibleServices]);

  // Calculate stats
  const stats = useMemo(() => {
    const selectedCount = selectAllAcrossApi
      ? Math.max(0, (pagination.total || 0) - deselectedServices.size)
      : selectedServices.size;

    const loadedRefillable = allLoadedServices.filter((s) => s.refill).length;
    const loadedCancellable = allLoadedServices.filter((s) => s.cancel).length;

    return {
      total: pagination.total,
      loaded: allLoadedServices.length,
      refillable: pagination.refillableTotal ?? loadedRefillable,
      cancellable: pagination.cancellableTotal ?? loadedCancellable,
      refillableLoaded: loadedRefillable,
      cancellableLoaded: loadedCancellable,
      selected: selectedCount,
    };
  }, [allLoadedServices, selectedServices.size, deselectedServices.size, selectAllAcrossApi, pagination.total, pagination.refillableTotal, pagination.cancellableTotal]);

  const isServiceSelected = (serviceId) => {
    const key = String(serviceId);
    if (selectAllAcrossApi) {
      return !deselectedServices.has(key);
    }
    return selectedServices.has(key);
  };

  // Toggle select service
  const toggleSelectService = (serviceId) => {
    const key = String(serviceId);

    if (selectAllAcrossApi) {
      setDeselectedServices((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
      return;
    }

    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Select all services from API (not only loaded page)
  const toggleSelectAll = () => {
    if (selectAllAcrossApi) {
      setSelectAllAcrossApi(false);
      setSelectedServices(new Set());
      setDeselectedServices(new Set());
    } else {
      setSelectAllAcrossApi(true);
      setSelectedServices(new Set());
      setDeselectedServices(new Set());
    }
  };

  return (
    <DashboardLayout pageTitle="Services">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Services Catalog</h1>
        <p className="text-slate-600 text-lg">Manage services from your API provider</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex gap-2 border-b-2 border-slate-200 overflow-x-auto pb-0">
          {[
            { id: 'services', label: 'Services', icon: '🛍️' },
            { id: 'settings', label: 'Provider Settings', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-violet-600 border-b-2 border-violet-600 -mb-0.5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Provider Switcher */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Switch API Provider</h3>
                
                <p className="text-sm text-slate-600">Choose a saved provider and make it active for services syncing.</p>
              </div>
              {loadingProviders && <span className="text-xs font-medium text-slate-500">Loading providers...</span>}
              {providersError && !loadingProviders && (
                <span className="text-xs font-medium text-red-600">{providersError}</span>
              )}
            </div>

            {providers.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-violet-500 outline-none bg-white"
                >
                  {providers.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name} {provider.disableSync ? '(Sync disabled)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSwitchProvider}
                  className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition"
                >
                  Activate Provider
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                No saved providers yet. Add one in Settings to switch here.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Profit Percentage</h3>
                <p className="text-sm text-slate-600">Set the markup used to calculate selling prices from provider prices.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Markup %</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profitPercentage}
                  onChange={(e) => setProfitPercentage(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-violet-500 outline-none bg-white"
                  placeholder="0"
                />
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 md:min-w-70 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">How it works</p>
                <p className="text-sm text-slate-700">
                  Selling price = provider price + {profitPercentage || 0}% margin
                </p>
              </div>

              <button
                onClick={handleSaveProfitPercentage}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition md:self-end"
              >
                Save Profit Margin
              </button>
            </div>
          </div>

          {/* Display Provider Info */}
          {providerSettings && (
            <div className="bg-linear-to-r from-violet-50 to-violet-100 rounded-xl border border-violet-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-violet-900 mb-2">🔗 Active Provider</h3>
              <p className="text-violet-700">{providerSettings.apiUrl}</p>
              <p className="mt-2 text-sm text-violet-800">
                Profit margin: <span className="font-bold">{profitPercentage || 0}%</span>
              </p>
            </div>
          )}

          {/* Search + Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">🔍 Search Services</label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by name, ID, category, or description..."
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-violet-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={toggleRefillOnly}
                className={`px-4 py-2 rounded-lg border font-semibold transition ${
                  refillOnly
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-green-500'
                }`}
              >
                {refillOnly ? '✓ Refillable only' : 'Refillable'}
              </button>
              <button
                type="button"
                onClick={toggleCancelOnly}
                className={`px-4 py-2 rounded-lg border font-semibold transition ${
                  cancelOnly
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-orange-500'
                }`}
              >
                {cancelOnly ? '✓ Cancellable only' : 'Cancellable'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setAppliedSearch('');
                  setRefillOnly(false);
                  setCancelOnly(false);
                }}
                className="px-4 py-2 rounded-lg border font-semibold bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Total Available</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-blue-700 mt-1">Loaded: {stats.loaded}</p>
              </div>

              <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 p-4">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Refillable</p>
                <p className="text-3xl font-bold text-green-900">{stats.refillable}</p>
              </div>

              <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200 p-4">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Cancellable</p>
                <p className="text-3xl font-bold text-orange-900">{stats.cancellable}</p>
              </div>

              <div className="bg-linear-to-br from-violet-50 to-violet-100 rounded-lg border-2 border-violet-200 p-4">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Selected</p>
                <p className="text-3xl font-bold text-violet-900">{stats.selected}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <ErrorState
              error={error}
              onRetry={() => refreshServices(1)}
            />
          )}

          {/* Loading State */}
          {loading && currentPage === 1 && <LoadingSpinner message="Loading services from provider..." />}

          {/* Services List */}
          {!loading && !error && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAllAcrossApi}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer accent-violet-600"
                  />
                  <span className="font-bold text-slate-900">
                    {selectAllAcrossApi
                      ? `Deselect All (${pagination.total || 0})`
                      : `Select All (${pagination.total || 0})`}
                  </span>
                </label>
              </div>

              {visibleServices.length > 0 ? (
                Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-linear-to-r from-slate-900 to-slate-800 px-6 py-4">
                      <h2 className="text-lg font-bold text-white flex items-center justify-between">
                        <span>📁 {category}</span>
                        <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {categoryServices.length}
                        </span>
                      </h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">
                              <input
                                type="checkbox"
                                checked={selectAllAcrossApi}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-violet-600"
                              />
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">Service ID</th>
                            <th className="px-4 py-3 text-left font-semibold">Service Name</th>
                            <th className="px-4 py-3 text-left font-semibold">Type</th>
                            <th className="px-4 py-3 text-left font-semibold">Original Price</th>
                            <th className="px-4 py-3 text-left font-semibold">Selling Price</th>
                            <th className="px-4 py-3 text-left font-semibold">Min</th>
                            <th className="px-4 py-3 text-left font-semibold">Max</th>
                            <th className="px-4 py-3 text-left font-semibold">Refill</th>
                            <th className="px-4 py-3 text-left font-semibold">Cancel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryServices.map((service, index) => {
                            const serviceId = String(service.service);
                            const isSelected = isServiceSelected(serviceId);

                            return (
                              <tr
                                key={`${serviceId}-${service.name || ''}-${index}`}
                                className={`border-t border-slate-200 ${isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectService(serviceId)}
                                    className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-violet-600"
                                  />
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{serviceId}</td>
                                <td className="px-4 py-3 text-slate-900 min-w-70">{service.name}</td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{service.type || '-'}</td>
                                <td className="px-4 py-3 text-green-700 font-semibold whitespace-nowrap">${(parseFloat(service.providerPrice ?? service.rate ?? service.price) || 0).toFixed(4)}</td>
                                <td className="px-4 py-3 text-green-700 font-semibold whitespace-nowrap">${(parseFloat(service.sellingPrice ?? service.price ?? 0) || 0).toFixed(4)}</td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{service.min ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{service.max ?? '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={service.refill ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                                    {service.refill ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={service.cancel ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                                    {service.cancel ? 'Yes' : 'No'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-4xl mb-4">📭</p>
                  <p className="text-lg font-bold text-slate-900">No Services Found</p>
                  <p className="text-slate-600 mt-2">
                    {searchTerm ? 'Try different search terms' : 'Select a provider to load services'}
                  </p>
                </div>
              )}

              <div ref={sentinelRef} className="h-10" />

              {pagination.hasMore && allLoadedServices.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-sm text-slate-600">
                    Loaded <span className="font-bold">{stats.loaded}</span> of{' '}
                    <span className="font-bold">{stats.total}</span> services
                  </p>
                  {loading && <p className="mt-2 text-xs text-slate-500">Loading more…</p>}
                </div>
              )}

              {!pagination.hasMore && allLoadedServices.length > 0 && (
                <div className="bg-linear-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-4 text-center">
                  <p className="text-sm font-semibold text-green-700">✅ All {stats.total} services loaded</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Provider Settings</h2>
          {providerSettings ? (
            <div className="space-y-4">
              <p className="text-slate-600 mb-4">Current provider configuration:</p>
              <div className="p-4 border border-violet-200 rounded-lg bg-violet-50">
                <p className="font-bold text-slate-900">API URL</p>
                <p className="text-sm text-slate-600 break-all">{providerSettings.apiUrl}</p>
              </div>
              <p className="text-sm text-slate-600 mt-6">
                To update provider settings, go to Settings → General Settings
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-slate-600 mb-4">No provider configured</p>
              <p className="text-sm text-slate-500">Go to Settings → General Settings to add your API provider</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminServices;


