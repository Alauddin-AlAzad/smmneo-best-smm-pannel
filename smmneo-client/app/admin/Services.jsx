import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import useProviderServices from '../hooks/useProviderServices.js';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import toast from 'react-hot-toast';

const AdminServices = () => {
  const [providerSettings, setProviderSettings] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [selectAllAcrossApi, setSelectAllAcrossApi] = useState(false);
  const [deselectedServices, setDeselectedServices] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedServices, setAllLoadedServices] = useState([]);

  // Fetch services from global provider settings via proxy
  const { services, loading, error, pagination, fetchServices } = useProviderServices(
    null,  // Don't pass credentials - use backend proxy instead
    null
  );

  const fetchProviderSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch('http://localhost:3000/api/settings');
      const data = await response.json();
      if (data && data.success && data.data && data.data.provider) {
        setProviderSettings(data.data.provider);
      } else {
        toast.error('No provider configured. Please set provider settings first.');
      }
    } catch (error) {
      console.error('Error fetching provider settings:', error);
      toast.error('Failed to load provider settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await fetch('http://localhost:3000/api/providers');
      const data = await response.json();
      if (data && data.success && Array.isArray(data.data)) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
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
      const response = await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      if (data && data.success) {
        const activeProvider = data.data?.provider || provider;
        setProviderSettings(activeProvider);
        setSelectedProviderId(provider._id || '');
        setCurrentPage(1);
        setAllLoadedServices([]);

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
      console.error('Error switching provider:', error);
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

  // Load more services to current loaded set
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    try {
      await fetchServices(nextPage, pagination.limit);
      setCurrentPage(nextPage);
    } catch (err) {
      toast.error('Failed to load more services');
    }
  };

  // Load global provider settings from backend
  useEffect(() => {
    fetchProviderSettings();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (loadingSettings) {
      return;
    }

    if (!providers.length) {
      setSelectedProviderId('');
      if (providerSettings) {
        setProviderSettings(null);
        setAllLoadedServices([]);
      }
      return;
    }

    const matchedProviderByCurrent =
      providers.find((provider) => provider._id === providerSettings?._id) ||
      providers.find((provider) => provider.apiUrl === providerSettings?.apiUrl);

    if (matchedProviderByCurrent) {
      const hasValidSelection = providers.some((provider) => provider._id === selectedProviderId);
      if (!selectedProviderId || !hasValidSelection) {
        setSelectedProviderId(matchedProviderByCurrent._id);
      }
      return;
    }

    // Keep provider from global settings if it was set from General Settings,
    // even when it's not in the saved providers list.
    if (providerSettings?.apiUrl) {
      if (!selectedProviderId) {
        setSelectedProviderId(providers[0]?._id || '');
      }
      return;
    }

    const fallbackProvider = providers[0];
    if (fallbackProvider && fallbackProvider._id !== selectedProviderId) {
      setSelectedProviderId(fallbackProvider._id);
    }
  }, [providers, providerSettings, selectedProviderId, loadingSettings]);

  // Fetch services page 1 when provider settings are loaded
  useEffect(() => {
    if (providerSettings?.apiUrl) {
      setCurrentPage(1);
      setAllLoadedServices([]);
      setSelectAllAcrossApi(false);
      setSelectedServices(new Set());
      setDeselectedServices(new Set());
      fetchServices(1, 50);
    }
  }, [providerSettings?.apiUrl, fetchServices]);

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

  // Filter services by search term
  const filteredServices = useMemo(() => {
    if (!searchTerm) return allLoadedServices;
    const term = searchTerm.toLowerCase();
    return allLoadedServices.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.service?.toString().toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term)
    );
  }, [allLoadedServices, searchTerm]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce((acc, service) => {
      const category = service.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});
  }, [filteredServices]);

  // Calculate stats
  const stats = useMemo(() => {
    const selectedCount = selectAllAcrossApi
      ? Math.max(0, (pagination.total || 0) - deselectedServices.size)
      : selectedServices.size;

    return {
      total: pagination.total,
      loaded: allLoadedServices.length,
      refillable: allLoadedServices.filter((s) => s.refill).length,
      cancellable: allLoadedServices.filter((s) => s.cancel).length,
      selected: selectedCount,
    };
  }, [allLoadedServices, selectedServices.size, deselectedServices.size, selectAllAcrossApi, pagination.total]);

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
                  ? 'text-violet-600 border-b-2 border-violet-600 -mb-[2px]'
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

          {/* Display Provider Info */}
          {providerSettings && (
            <div className="bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl border border-violet-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-violet-900 mb-2">🔗 Active Provider</h3>
              <p className="text-violet-700">{providerSettings.apiUrl}</p>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <label className="block text-sm font-bold text-slate-900 mb-3">🔍 Search Services</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or category..."
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-violet-500 outline-none"
            />
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Total Available</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-blue-700 mt-1">Loaded: {stats.loaded}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 p-4">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Refillable</p>
                <p className="text-3xl font-bold text-green-900">{stats.refillable}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200 p-4">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Cancellable</p>
                <p className="text-3xl font-bold text-orange-900">{stats.cancellable}</p>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border-2 border-violet-200 p-4">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Selected</p>
                <p className="text-3xl font-bold text-violet-900">{stats.selected}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <ErrorState
              error={error}
              onRetry={() => fetchServices(1, 50)}
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

              {filteredServices.length > 0 ? (
                Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
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
                            <th className="px-4 py-3 text-left font-semibold">Rate</th>
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
                                <td className="px-4 py-3 text-slate-900 min-w-[280px]">{service.name}</td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{service.type || '-'}</td>
                                <td className="px-4 py-3 text-green-700 font-semibold whitespace-nowrap">${(parseFloat(service.rate) || 0).toFixed(4)}</td>
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

              {/* Pagination Controls */}
              {pagination.hasMore && !loading && allLoadedServices.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Loaded <span className="font-bold">{stats.loaded}</span> of{' '}
                    <span className="font-bold">{stats.total}</span> services
                  </p>
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Loading...' : '📥 Load More Services'}
                  </button>
                </div>
              )}

              {!pagination.hasMore && allLoadedServices.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-4 text-center">
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


