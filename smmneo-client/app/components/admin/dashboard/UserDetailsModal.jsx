import React, { useEffect, useState } from 'react';
import { fetchAdminUserDetails } from '../../../services/adminDashboardAPI.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const UserDetailsModal = ({ userId, userName, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserDetails = async () => {
    try {
      const data = await fetchAdminUserDetails(userId);
      setUser(data);
    } catch (err) {
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchUserDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchAdminUserDetails(userId);
        setUser(data);
      } catch (err) {
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();

    // Set up auto-refresh every 2 seconds for real-time balance updates
    const refreshInterval = setInterval(() => {
      fetchUserDetails().catch(() => {});
    }, 2000);

    return () => clearInterval(refreshInterval);
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">User Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition disabled:opacity-50"
              title="Refresh user details"
            >
              {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-16">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* User Profile */}
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                    {(user.name || 'User').split(' ')[0][0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-violet-100 text-sm mt-1">{user.email}</p>
                    <p className="text-violet-100 text-sm">@{user.username}</p>
                  </div>
                </div>
              </div>

              {/* User Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Balance</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${user.balanceUSD.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{user.totalOrders}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${user.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Status</p>
                  <p
                    className={`text-sm font-semibold mt-2 inline-block px-2 py-1 rounded ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Join Date</p>
                  <p className="text-slate-900 font-semibold mt-1">{user.joinDate}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Last Active</p>
                  <p className="text-slate-900 font-semibold mt-1">{user.lastActive}</p>
                </div>
              </div>

              {/* Orders Section */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Recent Orders ({user.orders.length})</h4>
                {user.orders.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Order ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Service
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.orders.map((order) => (
                          <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{order.orderId}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{order.service}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{order.amount}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{order.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">No orders yet</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
