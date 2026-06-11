import React, { useEffect, useState } from 'react';
import { updateAdminUser, fetchAdminUserDetails, updateUserBalance } from '../../../services/adminDashboardAPI.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import Button from '../common/Button.jsx';

const UserEditModal = ({ userId, userName, onClose, onSuccess }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('active');
  const [balanceOperation, setBalanceOperation] = useState('set'); // set, add, subtract
  const [balanceAmount, setBalanceAmount] = useState('');
  const [showBalanceForm, setShowBalanceForm] = useState(false);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchAdminUserDetails(userId);
        setUser(data);
        setDisplayName(data.name || '');
        setStatus(data.status || 'active');
      } catch (err) {
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
  }, [userId]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      if (!displayName.trim()) {
        setError('Display name is required');
        setSaving(false);
        return;
      }

      if (!status) {
        setError('Status is required');
        setSaving(false);
        return;
      }

      const payload = {
        displayName: displayName.trim(),
        status: status.toLowerCase(),
      };
      await updateAdminUser(userId, payload);

      setSuccessMessage('User information updated successfully!');
      
      // Reload user data
      const updatedUser = await fetchAdminUserDetails(userId);
      setUser(updatedUser);
      setDisplayName(updatedUser.name || '');
      setStatus(updatedUser.status || 'active');

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }

      // Clear message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleBalanceUpdate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const amount = parseFloat(balanceAmount);
      
      if (isNaN(amount) || amount < 0) {
        setError('Please enter a valid amount');
        setSaving(false);
        return;
      }

      await updateUserBalance(userId, amount, balanceOperation);

      setSuccessMessage(`Balance ${balanceOperation}d successfully!`);
      setBalanceAmount('');
      setShowBalanceForm(false);

      // Reload user data
      const updatedUser = await fetchAdminUserDetails(userId);
      setUser(updatedUser);

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }

      // Clear message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update balance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-16">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : null}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mb-6">
              <p className="font-semibold">Success</p>
              <p className="text-sm mt-1">{successMessage}</p>
            </div>
          )}

          {user ? (
            <div className="space-y-6">
              {/* User Info Section */}
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                    {(user.name || 'User').split(' ')[0][0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-violet-100 text-sm mt-1">{user.email}</p>
                    <p className="text-violet-100 text-sm">Current Balance: ${user.balanceUSD.toFixed(8)}</p>
                  </div>
                </div>
              </div>

              {/* Edit User Info Form */}
              <form onSubmit={handleUpdateUser} className="space-y-4 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Edit User Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(user.name || '');
                      setStatus(user.status || 'active');
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {/* Balance Management Section */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Balance Management</h3>
                    <p className="text-sm text-slate-600 mt-1">Current Balance: <span className="font-bold text-violet-600">${user.balanceUSD.toFixed(2)}</span></p>
                  </div>
                  <button
                    onClick={() => setShowBalanceForm(!showBalanceForm)}
                    className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition"
                  >
                    {showBalanceForm ? 'Cancel' : 'Add/Modify Balance'}
                  </button>
                </div>

                {showBalanceForm && (
                  <form onSubmit={handleBalanceUpdate} className="space-y-4 mt-4 pt-4 border-t border-slate-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Operation
                        </label>
                        <select
                          value={balanceOperation}
                          onChange={(e) => setBalanceOperation(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="set">Set Balance To</option>
                          <option value="add">Add Amount</option>
                          <option value="subtract">Subtract Amount</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Amount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {balanceOperation === 'add' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        Current balance: ${user.balanceUSD.toFixed(2)} + ${balanceAmount || '0.00'} = ${(user.balanceUSD + (parseFloat(balanceAmount) || 0)).toFixed(2)}
                      </div>
                    )}
                    {balanceOperation === 'subtract' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                        Current balance: ${user.balanceUSD.toFixed(2)} - ${balanceAmount || '0.00'} = ${Math.max(0, user.balanceUSD - (parseFloat(balanceAmount) || 0)).toFixed(2)}
                      </div>
                    )}
                    {balanceOperation === 'set' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                        Balance will be set to: ${balanceAmount || '0.00'}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving || !balanceAmount}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Processing...' : 'Update Balance'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBalanceForm(false);
                          setBalanceAmount('');
                          setBalanceOperation('set');
                        }}
                        className="px-4 py-2 bg-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{user.totalOrders}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">${user.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-medium">Join Date</p>
                  <p className="text-sm font-bold text-slate-900 mt-2">{user.joinDate}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
