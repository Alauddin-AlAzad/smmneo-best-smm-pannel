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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Fetch services from global provider settings via proxy
  const { services, loading, error, totalCount, fetchServices } = useProviderServices(
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

  const handleSwitchProvider = async () => {
    const provider = providers.find((item) => item._id === selectedProviderId);

    if (!provider) {
      toast.error('Please select a provider first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      if (data && data.success) {
        setProviderSettings(data.data?.provider || provider);
        setSelectedProviderId(provider._id);
        toast.success(`Switched to ${provider.name}`);
      } else {
        toast.error(data.error || 'Failed to switch provider');
      }
    } catch (error) {
      console.error('Error switching provider:', error);
      toast.error('Failed to switch provider');
    }
  };

  // Load global provider settings from backend
  useEffect(() => {
    fetchProviderSettings();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (!providers.length) {
      setSelectedProviderId('');
      return;
    }

    const matchedProvider =
      providers.find((provider) => provider._id === providerSettings?._id) ||
      providers.find((provider) => provider.apiUrl === providerSettings?.apiUrl) ||
      providers[0];

    if (matchedProvider && matchedProvider._id !== selectedProviderId) {
      setSelectedProviderId(matchedProvider._id);
    }
  }, [providers, providerSettings, selectedProviderId]);

  // Fetch services when provider settings are loaded
  useEffect(() => {
    if (providerSettings?.apiUrl) {
      fetchServices();
    }
  }, [providerSettings, fetchServices]);

  // Filter services by search term
  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    const term = searchTerm.toLowerCase();
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.service?.toString().toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term)
    );
  }, [services, searchTerm]);

  // Show all filtered services (no client-side pagination)
  const paginatedServices = filteredServices;

  // Group paginated services by category
  const groupedServices = useMemo(() => {
    const groups = {};
    paginatedServices.forEach((service) => {
      const category = service.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });
    return groups;
  }, [paginatedServices]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: totalCount,
      refillable: services.filter((s) => s.refill).length,
      cancellable: services.filter((s) => s.cancel).length,
      selected: selectedServices.size,
    };
  }, [services, selectedServices.size, totalCount]);

  // Toggle select service
  const toggleSelectService = (serviceId) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  // Select ALL filtered services (not just current page)
  const toggleSelectAll = () => {
    if (selectedServices.size === filteredServices.length && filteredServices.length > 0) {
      setSelectedServices(new Set());
    } else {
      const allIds = new Set(filteredServices.map((s) => s.service));
      setSelectedServices(allIds);
    }
  };

  // Delete selected services
  const handleDeleteSelected = () => {
    if (selectedServices.size === 0) {
      alert('Please select services to delete');
      return;
    }

    if (confirm(`Delete ${selectedServices.size} selected services?`)) {
      console.log('🗑️ Deleting services:', Array.from(selectedServices));
      // TODO: Call delete API
      setSelectedServices(new Set());
      alert(`Deleted ${selectedServices.size} services`);
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
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Total Services</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total.toLocaleString()}</p>
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
              onRetry={fetchServices}
            />
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner message="Loading services from provider..." />}

          {/* Services List */}
          {!loading && !error && (
            <div className="space-y-6">
              {/* Select All & Delete */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer accent-violet-600"
                  />
                  <span className="font-bold text-slate-900">
                    {selectedServices.size === filteredServices.length && filteredServices.length > 0
                      ? `Deselect All (${filteredServices.length})`
                      : `Select All (${filteredServices.length})`}
                  </span>
                </label>

                {selectedServices.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    🗑️ Delete {selectedServices.size} Selected
                  </button>
                )}
              </div>

              {/* Categories */}
              {Object.keys(groupedServices).length > 0 ? (
                Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
                      <h2 className="text-lg font-bold text-white flex items-center justify-between">
                        <span>📁 {category}</span>
                        <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {categoryServices.length}
                        </span>
                      </h2>
                    </div>

                    {/* Services */}
                    <div className="divide-y divide-slate-200">
                      {categoryServices.map((service) => {
                        const serviceId = service.service;
                        const isSelected = selectedServices.has(serviceId);

                        return (
                          <div
                            key={serviceId}
                            className={`px-6 py-4 transition ${isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectService(serviceId)}
                                className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer accent-violet-600 mt-1"
                              />

                              {/* Service Info */}
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  {/* Name & ID */}
                                  <div>
                                    <p className="font-bold text-slate-900">{service.name}</p>
                                    <p className="text-sm text-slate-600">ID: {serviceId}</p>
                                  </div>

                                  {/* Details */}
                                  <div className="flex flex-wrap gap-2">
                                    {service.type && (
                                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-medium">
                                        {service.type}
                                      </span>
                                    )}

                                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-xs font-bold">
                                      ${(parseFloat(service.rate) || 0).toFixed(4)}
                                    </span>

                                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-xs font-medium">
                                      {service.min}-{service.max}
                                    </span>

                                    {service.refill ? (
                                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-xs font-bold">
                                        🔄 Refill
                                      </span>
                                    ) : (
                                      <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-bold">
                                        ✗ No Refill
                                      </span>
                                    )}

                                    {service.cancel ? (
                                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-xs font-bold">
                                        ✓ Cancel
                                      </span>
                                    ) : (
                                      <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-bold">
                                        🔒 Locked
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded transition">
                                      ✏️ Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Delete service ${serviceId}?`)) {
                                          console.log('🗑️ Delete service:', serviceId);
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded transition"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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

              {/* No pagination controls - showing all filtered services */}
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


