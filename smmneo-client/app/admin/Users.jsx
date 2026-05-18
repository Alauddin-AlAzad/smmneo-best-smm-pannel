import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import Button from '../components/admin/common/Button.jsx';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import UserDetailsModal from '../components/admin/dashboard/UserDetailsModal.jsx';
import UserEditModal from '../components/admin/dashboard/UserEditModal.jsx';
import { fetchAdminUsers } from '../services/adminDashboardAPI.js';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAdminUsers(100);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initLoad = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchAdminUsers(100);
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initLoad();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Users">
        <div className="py-16">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Users">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Users">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
        <Button variant="primary" size="md">
          + Add New User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm">
                        {(user.name || 'User').split(' ')[0][0]}
                      </div>
                      <span className="font-medium text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.joinDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setSelectedUserToEdit(user)}
                        className="px-3 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded transition"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* User Edit Modal */}
      {selectedUserToEdit && (
        <UserEditModal
          userId={selectedUserToEdit.id}
          userName={selectedUserToEdit.name}
          onClose={() => setSelectedUserToEdit(null)}
          onSuccess={() => {
            loadUsers();
            setSelectedUserToEdit(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
