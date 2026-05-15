import React, { useState } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import Button from '../components/admin/common/Button.jsx';
import { ticketsData } from '../data/adminDashboardData.js';

const AdminTickets = () => {
  const [tickets, setTickets] = useState(ticketsData);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-slate-100 text-slate-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <DashboardLayout pageTitle="Support Tickets">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <Button variant="primary" size="md">
          + Create Ticket
        </Button>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ticket ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{ticket.ticketId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{ticket.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{ticket.date}</td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded transition">
                      Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTickets;
