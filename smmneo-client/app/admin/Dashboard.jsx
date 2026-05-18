import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import StatsGrid from '../components/admin/dashboard/StatsGrid.jsx';
import RecentOrders from '../components/admin/dashboard/RecentOrders.jsx';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import { fetchAdminOverview, fetchAdminOrders } from '../services/adminDashboardAPI.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const [overview, orders] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminOrders(5),
        ]);

        if (!mounted) return;
        setStats(overview?.stats || []);
        setRecentOrders(Array.isArray(orders) ? orders : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load admin dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout pageTitle="Dashboard">
      {loading ? (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <>
          {/* Stats Grid */}
          <StatsGrid stats={stats} />

          {/* Recent Orders */}
          <RecentOrders orders={recentOrders} />

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Quick Stats */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Performance Overview</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.slice(0, 4).map((stat) => (
                  <div key={stat.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stat.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition text-sm font-medium">
                  + Create Order
                </button>
                <button className="w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition text-sm font-medium">
                  + Add User
                </button>
                <button className="w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition text-sm font-medium">
                  + Add Service
                </button>
                <button className="w-full px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition text-sm font-medium">
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
