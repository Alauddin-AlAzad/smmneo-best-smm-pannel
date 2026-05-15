import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeServiceTab, setActiveServiceTab] = useState('services');
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providers, setProviders] = useState([]);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [formData, setFormData] = useState({
    apiUrl: '',
    apiKey: '',
    disableSync: false,
    loginUsername: '',
    loginPassword: '',
  });

  // Fetch providers from backend on mount
  useEffect(() => {
    fetchProviders();
    // fetch global settings (provider) to prefill general modal
    fetch('http://localhost:3000/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success && data.data && data.data.provider) {
          setFormData((f) => ({ ...f, apiUrl: data.data.provider.apiUrl || '', apiKey: data.data.provider.apiKey || '' }));
        }
      })
      .catch((err) => {
        console.warn('Failed to load settings', err);
      });
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const resp = await fetch('http://localhost:3000/api/providers');
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.data)) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const settingsModules = [
    {
      id: 'general',
      icon: '⚙️',
      title: 'General Settings',
      description: 'Manage basic website settings and configuration',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'sellers',
      icon: '👥',
      title: 'Sellers Settings',
      description: 'Configure seller accounts and permissions',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'payment-methods',
      icon: '💳',
      title: 'Payment Methods',
      description: 'Configure payment gateways and processors',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'bank-accounts',
      icon: '🏦',
      title: 'Bank Accounts',
      description: 'Manage bank account details and transfers',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'modules',
      icon: '🧩',
      title: 'Modules Management',
      description: 'Enable/disable system modules and features',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'services',
      icon: '🛍️',
      title: 'Services',
      description: 'Manage services, bulk editor, and synced logs',
      color: 'from-teal-500 to-green-500',
    },
    {
      id: 'support',
      icon: '🎧',
      title: 'Support Settings',
      description: 'Configure support channels and ticketing system',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'bonus',
      icon: '🎁',
      title: 'Payment Bonus',
      description: 'Set up bonus structure and rewards programs',
      color: 'from-rose-500 to-pink-500',
    },
    {
      id: 'currency',
      icon: '💱',
      title: 'Site Currency Manager',
      description: 'Manage currency settings and exchange rates',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notification Settings',
      description: 'Control admin and user notification preferences',
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'fake-orders',
      icon: '📦',
      title: 'Fake Orders Settings',
      description: 'Configure test order system and parameters',
      color: 'from-fuchsia-500 to-rose-500',
    },
    {
      id: 'logo',
      icon: '🖼️',
      title: 'Site Logo Upload',
      description: 'Upload or change your site logo and branding',
      color: 'from-slate-600 to-slate-700',
    },
  ];

  const SettingsCard = ({ module }) => (
    <div
      onClick={() => setActiveModal(module.id)}
      className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-violet-300 overflow-hidden relative"
    >
      {/* Gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}
        >
          {module.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors duration-300">
          {module.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4 group-hover:text-slate-700 transition-colors duration-300">
          {module.description}
        </p>

        {/* Arrow indicator */}
        <div className="flex items-center text-violet-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
          <span>Manage</span>
          <span className="ml-2 text-lg">→</span>
        </div>
      </div>
    </div>
  );

  const ModalContent = ({ moduleId }) => {
    const module = settingsModules.find((m) => m.id === moduleId);

    const modalContentMap = {
      general: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Site Name</label>
            <input
              type="text"
              placeholder="SMMGen"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Site URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Admin Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">API Provider URL</label>
            <input
              type="url"
              placeholder="https://amarfollow.com/api/v2"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">API Key</label>
            <input
              type="password"
              placeholder="API Key"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="maintenance" className="w-4 h-4" />
            <label htmlFor="maintenance" className="text-sm font-medium text-slate-700 cursor-pointer">
              Enable Maintenance Mode
            </label>
          </div>
        </div>
      ),
      sellers: (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">API Providers</h3>
            <button
              onClick={() => {
                setShowProviderForm(true);
                setEditingProviderId(null);
                setFormData({
                  apiUrl: '',
                  apiKey: '',
                  disableSync: false,
                  loginUsername: '',
                  loginPassword: '',
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition font-medium"
            >
              + Add New Provider
            </button>
          </div>

          {/* Providers List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loadingProviders && <p className="text-sm text-slate-500">Loading providers...</p>}
            {!loadingProviders && providers.length > 0 && providers.map((provider) => (
              <div
                key={provider._id}
                className="p-4 border border-slate-200 rounded-lg hover:border-violet-300 hover:shadow-md transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-violet-600 transition">
                      {provider.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{provider.apiUrl}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        provider.disableSync
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {provider.disableSync ? 'Sync Disabled' : 'Sync Enabled'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingProviderId(provider._id);
                      setFormData({
                        apiUrl: provider.apiUrl,
                        apiKey: provider.apiKey,
                        disableSync: provider.disableSync || false,
                        loginUsername: provider.loginUsername || '',
                        loginPassword: provider.loginPassword || '',
                      });
                      setShowProviderForm(true);
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete provider "${provider.name}"?`)) {
                        try {
                          const resp = await fetch(`http://localhost:3000/api/providers/${provider._id}`, {
                            method: 'DELETE',
                          });
                          const data = await resp.json();
                          if (data && data.success) {
                            setProviders(providers.filter(p => p._id !== provider._id));
                            toast.success('Provider deleted successfully');
                          } else {
                            toast.error('Failed to delete provider');
                          }
                        } catch (error) {
                          console.error('Error deleting provider:', error);
                          toast.error('Failed to delete provider');
                        }
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loadingProviders && providers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No providers added yet</p>
              <p className="text-xs mt-1">Click "Add New Provider" to get started</p>
            </div>
          )}
        </div>
      ),
      'payment-methods': (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="stripe" className="w-4 h-4" defaultChecked />
            <label htmlFor="stripe" className="text-sm font-medium text-slate-700 cursor-pointer">
              Stripe
            </label>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="paypal" className="w-4 h-4" />
            <label htmlFor="paypal" className="text-sm font-medium text-slate-700 cursor-pointer">
              PayPal
            </label>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="crypto" className="w-4 h-4" />
            <label htmlFor="crypto" className="text-sm font-medium text-slate-700 cursor-pointer">
              Cryptocurrency
            </label>
          </div>
        </div>
      ),
      'bank-accounts': (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Bank Name</label>
            <input
              type="text"
              placeholder="Your Bank Name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Account Number</label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">SWIFT Code</label>
            <input
              type="text"
              placeholder="SWIFTCODE"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>
      ),
      modules: (
        <div className="space-y-3">
          {['Orders Module', 'Users Module', 'Services Module', 'Refills Module', 'API Module', 'Analytics Module'].map((mod) => (
            <div key={mod} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input type="checkbox" id={mod} className="w-4 h-4" defaultChecked />
              <label htmlFor={mod} className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                {mod}
              </label>
            </div>
          ))}
        </div>
      ),
      services: (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 -mx-6 px-6 pb-0">
            {[
              { id: 'services', label: 'Services', icon: '🛍️' },
              { id: 'bulk-editor', label: 'Bulk Service Editor', icon: '✏️' },
              { id: 'category-sort', label: 'Category Sort', icon: '📊' },
              { id: 'synced-logs', label: 'Synced Logs', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveServiceTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  activeServiceTab === tab.id
                    ? 'text-violet-600 border-b-2 border-violet-600 -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeServiceTab === 'services' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">Manage your available services</p>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <input type="checkbox" id="enable-services" className="w-4 h-4" defaultChecked />
                  <label htmlFor="enable-services" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                    Enable Service Management
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Default Service Status</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            )}

            {activeServiceTab === 'bulk-editor' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">Edit multiple services at once</p>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm text-slate-600 mb-2">Import CSV file to bulk edit services</p>
                  <input
                    type="file"
                    accept=".csv"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <button className="w-full px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition font-medium text-sm">
                  Download Template
                </button>
              </div>
            )}

            {activeServiceTab === 'category-sort' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">Arrange service categories</p>
                <div className="space-y-2">
                  {['Instagram Services', 'TikTok Services', 'YouTube Services', 'Twitter Services'].map((cat, idx) => (
                    <div key={cat} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition cursor-move">
                      <span className="text-lg cursor-move">⋮⋮</span>
                      <span className="text-sm font-medium text-slate-900 flex-1">{cat}</span>
                      <span className="text-xs text-slate-500">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeServiceTab === 'synced-logs' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">View synchronization history</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { date: '2024-05-14', provider: 'Provider 1', status: 'Success', count: 150 },
                    { date: '2024-05-13', provider: 'Provider 2', status: 'Success', count: 87 },
                    { date: '2024-05-12', provider: 'Provider 1', status: 'Failed', count: 0 },
                  ].map((log, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{log.provider}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            log.status === 'Success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{log.date}</span>
                        <span>{log.count} services synced</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      support: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Support Email</label>
            <input
              type="email"
              placeholder="support@example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="live-chat" className="w-4 h-4" defaultChecked />
            <label htmlFor="live-chat" className="text-sm font-medium text-slate-700 cursor-pointer">
              Enable Live Chat
            </label>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="ticket-system" className="w-4 h-4" defaultChecked />
            <label htmlFor="ticket-system" className="text-sm font-medium text-slate-700 cursor-pointer">
              Enable Ticket System
            </label>
          </div>
        </div>
      ),
      bonus: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Welcome Bonus ($)</label>
            <input
              type="number"
              placeholder="10"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Referral Bonus (%)</label>
            <input
              type="number"
              placeholder="5"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="bonus-auto" className="w-4 h-4" defaultChecked />
            <label htmlFor="bonus-auto" className="text-sm font-medium text-slate-700 cursor-pointer">
              Auto Credit Bonus
            </label>
          </div>
        </div>
      ),
      currency: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Default Currency</label>
            <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none">
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
              <option>GBP - British Pound</option>
              <option>INR - Indian Rupee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Exchange Rate API</label>
            <input
              type="text"
              placeholder="Your API Key"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>
      ),
      notifications: (
        <div className="space-y-3">
          {['Email Notifications', 'SMS Notifications', 'Order Alerts', 'Refund Alerts', 'System Alerts', 'User Registration Alerts'].map((notif) => (
            <div key={notif} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input type="checkbox" id={notif} className="w-4 h-4" defaultChecked />
              <label htmlFor={notif} className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                {notif}
              </label>
            </div>
          ))}
        </div>
      ),
      'fake-orders': (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="fake-enabled" className="w-4 h-4" />
            <label htmlFor="fake-enabled" className="text-sm font-medium text-slate-700 cursor-pointer">
              Enable Fake Orders
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Max Fake Orders/Day</label>
            <input
              type="number"
              placeholder="100"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Fake Order Prefix</label>
            <input
              type="text"
              placeholder="TEST-"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>
      ),
      logo: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm text-slate-600 mb-2">Drag and drop your logo here or click to browse</p>
            <input
              type="file"
              accept="image/*"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="logo-dark" className="w-4 h-4" />
            <label htmlFor="logo-dark" className="text-sm font-medium text-slate-700 cursor-pointer">
              Also set as dark mode logo
            </label>
          </div>
        </div>
      ),
    };

    return modalContentMap[moduleId] || null;
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage all system configurations and preferences</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsModules.map((module) => (
          <SettingsCard key={module.id} module={module} />
        ))}
      </div>

      {/* Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => {
            setActiveModal(null);
            setActiveServiceTab('services');
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {settingsModules.find((m) => m.id === activeModal)?.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {settingsModules.find((m) => m.id === activeModal)?.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveServiceTab('services');
                }}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <ModalContent moduleId={activeModal} />

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={async () => {
                    // If saving General settings, persist provider data
                    if (activeModal === 'general') {
                      try {
                        const resp = await fetch('http://localhost:3000/api/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ provider: { apiUrl: formData.apiUrl, apiKey: formData.apiKey } }),
                        });
                        const data = await resp.json();
                        if (data && data.success) {
                          toast.success('Settings saved');
                        } else {
                          toast.error('Failed to save settings');
                        }
                      } catch (err) {
                        console.error('Save settings error', err);
                        toast.error('Failed to save settings');
                      }
                    }
                    setActiveModal(null);
                    setActiveServiceTab('services');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setActiveServiceTab('services');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Form Modal (Nested Modal for Sellers) */}
      {showProviderForm && activeModal === 'sellers' && (
        <div
          className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
          onClick={() => {
            setShowProviderForm(false);
            setEditingProviderId(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProviderId ? 'Edit API Provider' : 'Add New API Provider'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowProviderForm(false);
                  setEditingProviderId(null);
                }}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">API Provider URL</label>
                <input
                  type="url"
                  placeholder="https://api.provider.com/v2"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  disabled={formData.disableSync}
                  className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none ${
                    formData.disableSync ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">API Key</label>
                <input
                  type="password"
                  placeholder="Your API Key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  disabled={formData.disableSync}
                  className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none ${
                    formData.disableSync ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Disable Sync</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, disableSync: false })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      !formData.disableSync
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, disableSync: true })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      formData.disableSync
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Login Credentials (for Refill Status)</h3>
                <p className="text-xs text-slate-500 mb-3">Optional: Used to fetch refill status from provider</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Login Username</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={formData.loginUsername}
                      onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Login Password</label>
                    <input
                      type="password"
                      placeholder="Password"
                      value={formData.loginPassword}
                      onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowProviderForm(false);
                    setEditingProviderId(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!formData.apiUrl || !formData.apiKey) {
                      toast.error('API URL and Key are required');
                      return;
                    }

                    try {
                      const method = editingProviderId ? 'PUT' : 'POST';
                      const url = editingProviderId
                        ? `http://localhost:3000/api/providers/${editingProviderId}`
                        : 'http://localhost:3000/api/providers';

                      const resp = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          apiUrl: formData.apiUrl,
                          apiKey: formData.apiKey,
                          disableSync: formData.disableSync,
                          loginUsername: formData.loginUsername,
                          loginPassword: formData.loginPassword,
                        }),
                      });

                      const data = await resp.json();
                      if (data && data.success) {
                        toast.success(editingProviderId ? 'Provider updated successfully' : 'Provider added successfully');
                        await fetchProviders();
                        setShowProviderForm(false);
                        setEditingProviderId(null);
                      } else {
                        toast.error(data.message || 'Failed to save provider');
                      }
                    } catch (error) {
                      console.error('Error saving provider:', error);
                      toast.error('Failed to save provider');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition font-medium"
                >
                  {editingProviderId ? 'Update Provider' : 'Add Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminSettings;
