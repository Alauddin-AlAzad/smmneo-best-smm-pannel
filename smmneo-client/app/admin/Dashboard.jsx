import React from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import StatsGrid from '../components/admin/dashboard/StatsGrid.jsx';
import RecentOrders from '../components/admin/dashboard/RecentOrders.jsx';
import { dashboardStats, recentOrders } from '../data/adminDashboardData.js';

const AdminDashboard = () => {
  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* Stats Grid */}
      <StatsGrid stats={dashboardStats} />

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} />

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Performance Overview</h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            📊 Chart Placeholder
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
    </DashboardLayout>
  );
};

export default AdminDashboard;
