import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import Button from '../components/admin/common/Button.jsx';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import { fetchAdminOrders } from '../services/adminDashboardAPI.js';

const defaultStatusValues = ['all', 'pending', 'processing', 'completed', 'partial', 'canceled', 'refunded'];

function normalizeStatus(status) {
  return String(status || 'pending').trim().toLowerCase().replace(/-/g, '_');
}

function formatStatusLabel(status) {
  const s = normalizeStatus(status);
  if (s === 'processing') return 'Processing';
  if (s === 'pending') return 'Pending';
  if (s === 'in_progress' || s === 'in-progress') return 'In Progress';
  if (s === 'completed' || s === 'done') return 'Completed';
  if (s === 'partial') return 'Partial';
  if (s === 'canceled' || s === 'cancelled' || s === 'canceled_order') return 'Canceled';
  if (s === 'refunded') return 'Refunded';
  if (s === 'failed') return 'Failed';
  if (!s) return 'Unknown';
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchAdminOrders(100);
        if (!mounted) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  const statusOptions = useMemo(() => {
    // fixed order of statuses to always show eight buttons (including 'all')
    const fixedOrder = ['all', 'pending', 'in_progress', 'processing', 'completed', 'partial', 'canceled', 'refunded'];
    return fixedOrder.map((value) => ({ value, label: value === 'all' ? 'All' : formatStatusLabel(value) }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeStatus === 'all') return orders;
    return orders.filter((order) => normalizeStatus(order.providerStatus || order.status || 'pending') === activeStatus);
  }, [orders, activeStatus]);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Orders">
        <div className="py-16">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Orders">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </DashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      partial: 'bg-fuchsia-100 text-fuchsia-700',
      canceled: 'bg-slate-100 text-slate-700',
      refunded: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <DashboardLayout pageTitle="Orders">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Orders Management</h1>
        <Button variant="primary" size="md">
          + Create Order
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const isActive = activeStatus === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveStatus(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search orders..."
            className="flex-1 min-w-56 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Showing {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto md:overflow-visible touch-pan-x">
            <table className="min-w-max md:w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Service</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id || order.orderId} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{order.orderId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.customer || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.service || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.providerStatus || order.status)}`}>
                      {formatStatusLabel(order.providerStatus || order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{order.date || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="px-3 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded transition">
                        View
                      </button>
                      <button className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hidden">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <article key={order.id || order.orderId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Order</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{order.orderId}</p>
                  <p className="text-xs text-slate-500">{order.date || '—'}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusColor(order.providerStatus || order.status)}`}>
                  {formatStatusLabel(order.providerStatus || order.status)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-[11px] text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Customer</span>
                  <span className="truncate text-right text-slate-600">{order.customer || '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Service</span>
                  <span className="truncate text-right text-slate-600">{order.service || '—'}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                  View
                </button>
                <button className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                  Cancel
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
