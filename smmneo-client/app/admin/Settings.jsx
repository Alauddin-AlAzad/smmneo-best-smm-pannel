import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import toast from 'react-hot-toast';
import { fetchAdminSettings, saveAdminSettings } from '../services/adminDashboardAPI.js';
import { getPaymentMethods, savePaymentMethod } from '../services/paymentAPI.js';

// 1. Settings Modules data array (Bahire thaka e bhalo)
const settingsModules = [
  { id: 'general', icon: '⚙️', title: 'General Settings', description: 'Manage basic website settings and configuration', color: 'from-blue-500 to-cyan-500' },
  { id: 'sellers', icon: '👥', title: 'Sellers Settings', description: 'Configure seller accounts and permissions', color: 'from-purple-500 to-pink-500' },
  { id: 'payment-methods', icon: '💳', title: 'Payment Methods', description: 'Configure payment gateways and processors', color: 'from-green-500 to-emerald-500' },
  { id: 'bank-accounts', icon: '🏦', title: 'Bank Accounts', description: 'Manage bank account details and transfers', color: 'from-orange-500 to-red-500' },
  { id: 'modules', icon: '🧩', title: 'Modules Management', description: 'Enable/disable system modules and features', color: 'from-indigo-500 to-purple-500' },
  { id: 'services', icon: '🛍️', title: 'Services', description: 'Manage services, bulk editor, and synced logs', color: 'from-teal-500 to-green-500' },
  { id: 'support', icon: '🎧', title: 'Support Settings', description: 'Configure support channels and ticketing system', color: 'from-yellow-500 to-orange-500' },
  { id: 'bonus', icon: '🎁', title: 'Payment Bonus', description: 'Set up bonus structure and rewards programs', color: 'from-rose-500 to-pink-500' },
  { id: 'currency', icon: '💱', title: 'Site Currency Manager', description: 'Manage currency settings and exchange rates', color: 'from-teal-500 to-cyan-500' },
  { id: 'notifications', icon: '🔔', title: 'Notification Settings', description: 'Control admin and user notification preferences', color: 'from-violet-500 to-purple-500' },
  { id: 'fake-orders', icon: '📦', title: 'Fake Orders Settings', description: 'Configure test order system and parameters', color: 'from-fuchsia-500 to-rose-500' },
  { id: 'logo', icon: '🖼️', title: 'Site Logo Upload', description: 'Upload or change your site logo and branding', color: 'from-slate-600 to-slate-700' },
];

// 2. SettingsCard Component ke Bahire ana holo (STABLE RENDER)
const SettingsCard = ({ module, setActiveModal }) => (
  <div
    onClick={() => setActiveModal(module.id)}
    className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-violet-300 overflow-hidden relative"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
        {module.icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors duration-300">
        {module.title}
      </h3>
      <p className="text-sm text-slate-600 mb-4 group-hover:text-slate-700 transition-colors duration-300">
        {module.description}
      </p>
      <div className="flex items-center text-violet-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
        <span>Manage</span>
        <span className="ml-2 text-lg">→</span>
      </div>
    </div>
  </div>
);

// 3. ModalContent Component ke Bahire ana holo (STABLE RENDER, No Focus Loss)
const ModalContent = ({ 
  moduleId, 
  generalForm, setGeneralForm, 
  formData, setFormData, 
  isFetchingPaymentMethods, paymentMethods, setPaymentMethods,
  loadingProviders, providers, setProviders, setShowProviderForm, setEditingProviderId,
  activeServiceTab, setActiveServiceTab 
}) => {
  const modalContentMap = {
    general: (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Site Name</label>
          <input
            type="text"
            placeholder="SMMSecure"
            value={generalForm.siteName}
            onChange={(e) => setGeneralForm({ ...generalForm, siteName: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Site URL</label>
          <input
            type="url"
            placeholder="https://example.com"
            value={generalForm.siteUrl}
            onChange={(e) => setGeneralForm({ ...generalForm, siteUrl: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Admin Email</label>
          <input
            type="email"
            placeholder="admin@example.com"
            value={generalForm.adminEmail}
            onChange={(e) => setGeneralForm({ ...generalForm, adminEmail: e.target.value })}
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
          <input
            type="checkbox"
            id="maintenance"
            className="w-4 h-4"
            checked={generalForm.maintenanceMode}
            onChange={(e) => setGeneralForm({ ...generalForm, maintenanceMode: e.target.checked })}
          />
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
              setFormData({ apiUrl: '', apiKey: '', disableSync: false, loginUsername: '', loginPassword: '' });
            }}
            className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition font-medium"
          >
            + Add New Provider
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loadingProviders && <p className="text-sm text-slate-500">Loading providers...</p>}
          {!loadingProviders && providers.length > 0 && providers.map((provider) => (
            <div key={provider._id} className="p-4 border border-slate-200 rounded-lg hover:border-violet-300 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 group-hover:text-violet-600 transition">{provider.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{provider.apiUrl}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${provider.disableSync ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {provider.disableSync ? 'Sync Disabled' : 'Sync Enabled'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingProviderId(provider._id);
                    setFormData({ apiUrl: provider.apiUrl, apiKey: provider.apiKey, disableSync: provider.disableSync || false, loginUsername: provider.loginUsername || '', loginPassword: provider.loginPassword || '' });
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
                        const resp = await fetch(`http://localhost:3000/api/providers/${provider._id}`, { method: 'DELETE' });
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
        {isFetchingPaymentMethods ? (
          <div className="p-6 text-center text-slate-500">Loading payment methods...</div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-slate-600">Configure payment numbers for each mobile wallet provider. These will be displayed to users during the payment process.</p>
            </div>
            {/* bKash */}
            <div className="p-4 border border-slate-200 rounded-lg bg-gradient-to-br from-red-50 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-lg">🔴</div>
                <h4 className="font-semibold text-slate-900">bKash</h4>
                <span className="ml-auto text-xs text-slate-500">Mobile Wallet</span>
              </div>
              <input
                id="bkash-number"
                name="bkash-number"
                autoComplete="off"
                type="text"
                placeholder="e.g., 01700000000"
                value={paymentMethods.bkash.number}
                onChange={(e) => setPaymentMethods((prev) => ({ ...prev, bkash: { ...prev.bkash, number: e.target.value } }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Enter the bKash merchant phone number</p>
            </div>
            {/* Nagad */}
            <div className="p-4 border border-slate-200 rounded-lg bg-gradient-to-br from-orange-50 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🟠</div>
                <h4 className="font-semibold text-slate-900">Nagad</h4>
                <span className="ml-auto text-xs text-slate-500">Mobile Wallet</span>
              </div>
              <input
                id="nagad-number"
                name="nagad-number"
                autoComplete="off"
                type="text"
                placeholder="e.g., 01600000000"
                value={paymentMethods.nagad.number}
                onChange={(e) => setPaymentMethods((prev) => ({ ...prev, nagad: { ...prev.nagad, number: e.target.value } }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Enter the Nagad merchant phone number</p>
            </div>
            {/* Rocket */}
            <div className="p-4 border border-slate-200 rounded-lg bg-gradient-to-br from-blue-50 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">🔵</div>
                <h4 className="font-semibold text-slate-900">Rocket</h4>
                <span className="ml-auto text-xs text-slate-500">Mobile Wallet</span>
              </div>
              <input
                id="rocket-number"
                name="rocket-number"
                autoComplete="off"
                type="text"
                placeholder="e.g., 01800000000"
                value={paymentMethods.rocket.number}
                onChange={(e) => setPaymentMethods((prev) => ({ ...prev, rocket: { ...prev.rocket, number: e.target.value } }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Enter the Rocket merchant phone number</p>
            </div>
          </>
        )}
      </div>
    ),
    'bank-accounts': (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Bank Name</label>
          <input type="text" placeholder="Your Bank Name" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Account Number</label>
          <input type="password" placeholder="••••••••••••" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">SWIFT Code</label>
          <input type="text" placeholder="SWIFTCODE" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
      </div>
    ),
    modules: (
      <div className="space-y-3">
        {['Orders Module', 'Users Module', 'Services Module', 'Refills Module', 'API Module', 'Analytics Module'].map((mod) => (
          <div key={mod} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id={mod} className="w-4 h-4" defaultChecked />
            <label htmlFor={mod} className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{mod}</label>
          </div>
        ))}
      </div>
    ),
    services: (
      <div className="space-y-4">
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
              className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeServiceTab === tab.id ? 'text-violet-600 border-b-2 border-violet-600 -mb-[1px]' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span className="mr-1">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {activeServiceTab === 'services' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">Manage your available services</p>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <input type="checkbox" id="enable-services" className="w-4 h-4" defaultChecked />
                <label htmlFor="enable-services" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">Enable Service Management</label>
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
                <input type="file" accept=".csv" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition font-medium text-sm">Download Template</button>
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
                {[{ date: '2024-05-14', provider: 'Provider 1', status: 'Success', count: 150 }, { date: '2024-05-13', provider: 'Provider 2', status: 'Success', count: 87 }].map((log, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{log.provider}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{log.date}</span><span>{log.count} services synced</span>
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
          <input type="email" placeholder="support@example.com" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <input type="checkbox" id="live-chat" className="w-4 h-4" defaultChecked />
          <label htmlFor="live-chat" className="text-sm font-medium text-slate-700 cursor-pointer">Enable Live Chat</label>
        </div>
      </div>
    ),
    bonus: (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Welcome Bonus ($)</label>
          <input type="number" placeholder="10" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
      </div>
    )
  };
   

  return modalContentMap[moduleId] || null;
};

// 4. MAIN COMPONENT (Khub e Lightweight & Optimized)
const AdminSettings = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeServiceTab, setActiveServiceTab] = useState('services');
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providers, setProviders] = useState([]);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalForm, setGeneralForm] = useState({ siteName: '', siteUrl: '', adminEmail: '', maintenanceMode: false });
  const [formData, setFormData] = useState({ apiUrl: '', apiKey: '', disableSync: false, loginUsername: '', loginPassword: '' });
  const [paymentMethods, setPaymentMethods] = useState({
    bkash: { number: '', label: 'bKash' },
    nagad: { number: '', label: 'Nagad' },
    rocket: { number: '', label: 'Rocket' },
  });
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);
  const [isFetchingPaymentMethods, setIsFetchingPaymentMethods] = useState(false);

  useEffect(() => {
    fetchProviders();
    fetchAdminSettings()
      .then((data) => {
        if (data && data.provider) {
          setFormData((f) => ({ ...f, apiUrl: data.provider.apiUrl || '', apiKey: data.provider.apiKey || '' }));
        }
        if (data && data.general) {
          setGeneralForm({
            siteName: data.general.siteName || '',
            siteUrl: data.general.siteUrl || '',
            adminEmail: data.general.adminEmail || '',
            maintenanceMode: Boolean(data.general.maintenanceMode),
          });
        }
      })
      .catch((err) => console.warn('Failed to load settings', err));

    fetchPaymentMethods();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const resp = await fetch('http://localhost:3000/api/providers');
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.data)) setProviders(data.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      setIsFetchingPaymentMethods(true);
      const data = await getPaymentMethods();
      if (data && data.success && Array.isArray(data.data)) {
        setPaymentMethods((prev) => {
          const methods = { ...prev };
          data.data.forEach((pm) => {
            if (methods[pm.key]) {
              methods[pm.key] = {
                ...methods[pm.key],
                number: prev[pm.key]?.number !== undefined && prev[pm.key]?.number !== '' ? prev[pm.key].number : pm.number || '',
                label: pm.label || pm.key,
              };
            }
          });
          return methods;
        });
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsFetchingPaymentMethods(false);
    }
  };

  const handleSavePaymentMethods = async () => {
    try {
      setSavingPaymentMethods(true);
      const methods = ['bkash', 'nagad', 'rocket'];
      for (const key of methods) {
        const data = await savePaymentMethod({ key, label: paymentMethods[key].label, number: paymentMethods[key].number });
        if (!data.success) throw new Error(data.error || `Failed to save ${key}`);
      }
      toast.success('Payment methods saved successfully');
      setActiveModal(null);
    } catch (error) {
      toast.error(`Failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingPaymentMethods(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!formData.apiUrl || !formData.apiKey) {
      toast.error('API URL and API Key are required');
      return;
    }

    try {
      const payload = {
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        disableSync: formData.disableSync,
        loginUsername: formData.loginUsername,
        loginPassword: formData.loginPassword,
      };
      const url = editingProviderId ? `http://localhost:3000/api/providers/${editingProviderId}` : 'http://localhost:3000/api/providers';
      const method = editingProviderId ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to save provider');
      }

      if (editingProviderId) {
        setProviders((prev) => prev.map((provider) => String(provider._id) === String(editingProviderId) ? data.data : provider));
        toast.success('Provider updated successfully');
      } else {
        setProviders((prev) => [data.data, ...prev]);
        toast.success('Provider added successfully');
      }

      setShowProviderForm(false);
      setEditingProviderId(null);
      setFormData({ apiUrl: '', apiKey: '', disableSync: false, loginUsername: '', loginPassword: '' });
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error(error.message || 'Failed to save provider');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">System Settings</h1>
          <p className="text-slate-600">Configure and manage your application platforms and wallet setups.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsModules.map((module) => (
            <SettingsCard key={module.id} module={module} setActiveModal={setActiveModal} />
          ))}
        </div>

        {/* Modal Overlay Wrapper */}
        {activeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full flex flex-col max-h-[85vh] transform scale-100 transition-transform duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {settingsModules.find((m) => m.id === activeModal)?.title}
                </h2>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold p-1 transition">
                  &times;
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <ModalContent
                  moduleId={activeModal}
                  generalForm={generalForm}
                  setGeneralForm={setGeneralForm}
                  formData={formData}
                  setFormData={setFormData}
                  isFetchingPaymentMethods={isFetchingPaymentMethods}
                  paymentMethods={paymentMethods}
                  setPaymentMethods={setPaymentMethods}
                  loadingProviders={loadingProviders}
                  providers={providers}
                  setProviders={setProviders}
                  setShowProviderForm={setShowProviderForm}
                  setEditingProviderId={setEditingProviderId}
                  activeServiceTab={activeServiceTab}
                  setActiveServiceTab={setActiveServiceTab}
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition text-sm font-medium">
                  Cancel
                </button>
                {activeModal === 'payment-methods' && (
                  <button onClick={handleSavePaymentMethods} disabled={savingPaymentMethods} className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-400 transition text-sm font-medium shadow-sm">
                    {savingPaymentMethods ? 'Saving...' : 'Save Settings'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {showProviderForm && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{editingProviderId ? 'Edit API Provider' : 'Add New API Provider'}</h2>
                  <p className="text-sm text-slate-500">Manage seller API provider credentials and sync settings.</p>
                </div>
                <button onClick={() => setShowProviderForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold transition">
                  &times;
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Login Username</label>
                    <input
                      type="text"
                      placeholder="Username (optional)"
                      value={formData.loginUsername}
                      onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Login Password</label>
                    <input
                      type="password"
                      placeholder="Password (optional)"
                      value={formData.loginPassword}
                      onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.disableSync}
                    onChange={(e) => setFormData({ ...formData, disableSync: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  Disable sync for this provider
                </label>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowProviderForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProvider}
                  className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition text-sm font-medium shadow-sm"
                >
                  {editingProviderId ? 'Update Provider' : 'Save Provider'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;