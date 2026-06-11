import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { loginAdmin } from '../services/adminSecureAPI.js';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await loginAdmin(email.trim(), password);
      toast.success('Admin login successful');
      navigate('/smmsecure/admin/dashboard');
    } catch (err) {
      let message = err?.message || 'Failed to login';
      try {
        const parsed = JSON.parse(message);
        message = parsed.error || parsed.body || parsed.statusText || 'Failed to login';
      } catch (_) {
        // keep original message
      }
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[420px] rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-3 sm:text-2xl">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-300"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-300"
            />
          </label>
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:mt-4">
          Use your super admin credentials to access the secure admin panel.
        </p>
      </div>
    </main>
  );
};

export default AdminLogin;
