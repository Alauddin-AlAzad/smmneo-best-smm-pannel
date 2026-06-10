import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  fetchAdminMe,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
  logoutAdmin,
} from '../services/adminSecureAPI.js';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const loadProfile = async () => {
    try {
      const profile = await fetchAdminMe();
      setAdmin(profile);
    } catch (err) {
      toast.error('Session expired. Please login again.');
      navigate('/smmsecure/admin/login');
    }
  };

  const loadAdmins = async () => {
    try {
      const list = await fetchAdminUsers(100);
      setAdmins(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load admin users');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProfile(), loadAdmins()]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setRefreshing(true);
    try {
      await createAdminUser({ ...form, role: 'admin' });
      toast.success('Admin created successfully');
      setForm({ name: '', email: '', password: '' });
      await loadAdmins();
    } catch (err) {
      toast.error(err.message || 'Failed to create admin');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusToggle = async (id, status) => {
    setRefreshing(true);
    try {
      await updateAdminUserStatus(id, status === 'active' ? 'disabled' : 'active');
      toast.success('Admin status updated');
      await loadAdmins();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin account?')) return;
    setRefreshing(true);
    try {
      await deleteAdminUser(id);
      toast.success('Admin removed successfully');
      await loadAdmins();
    } catch (err) {
      toast.error(err.message || 'Failed to delete admin');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.warn('Logout error', err);
    }
    navigate('/smmsecure/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-3xl bg-white p-8 shadow-lg">Loading admin panel…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Signed in as</p>
            <h1 className="text-2xl font-semibold text-slate-900">{admin?.name || admin?.email}</h1>
            <p className="text-sm text-slate-600">Role: {admin?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Admin Users</h2>
                <p className="text-sm text-slate-500">Create and manage admin accounts from a secure panel.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Super Admin</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {admins.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3 capitalize">{user.role}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{user.createdAt?.slice(0, 10)}</td>
                      <td className="px-4 py-3 space-x-2">
                        {user.role !== 'super_admin' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(user.id, user.status)}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-white hover:bg-slate-700"
                            >
                              {user.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-white hover:bg-rose-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Create New Admin</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={12}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
              <button
                type="submit"
                disabled={refreshing}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {refreshing ? 'Saving…' : 'Create Admin'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
