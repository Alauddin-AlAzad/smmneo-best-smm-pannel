import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import Button from '../components/admin/common/Button.jsx';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import { closeAdminTicket, fetchAdminTicketThread, fetchAdminTickets, replyToAdminTicket } from '../services/adminDashboardAPI.js';

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchAdminTickets(100);
        if (!mounted) return;
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load tickets');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

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
      answered: 'bg-green-500 text-white',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const openThread = async (ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');

    try {
      const data = await fetchAdminTicketThread(ticket.ticketId, 'admin');
      setSelectedTicket(data || ticket);
      window.dispatchEvent(new Event('support-tickets-updated'));
    } catch (err) {
      setError(err.message || 'Failed to load ticket thread');
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setReplyLoading(true);
      const reply = await replyToAdminTicket(selectedTicket.ticketId, {
        authorName: 'Admin',
        authorEmail: 'admin@smmssecure.local',
        message: replyText,
      });

      setTickets((current) => current.map((ticket) => (
        ticket.ticketId === selectedTicket.ticketId
          ? { ...ticket, status: 'answered', unreadForAdmin: 0, unreadForUser: Number(ticket.unreadForUser || 0) + 1, repliesCount: (ticket.repliesCount || 0) + 1, lastReplyAt: reply.date }
          : ticket
      )));

      setSelectedTicket((current) => (current ? { ...current, status: 'answered', replies: [...(current.replies || []), reply] } : current));
      setReplyText('');
      window.dispatchEvent(new Event('support-tickets-updated'));
    } finally {
      setReplyLoading(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket || String(selectedTicket.status || '').toLowerCase() === 'closed') return;

    try {
      setReplyLoading(true);
      const updated = await closeAdminTicket(selectedTicket.ticketId);

      setTickets((current) => current.map((ticket) => (
        ticket.ticketId === selectedTicket.ticketId
          ? { ...ticket, status: 'closed', unreadForAdmin: 0, unreadForUser: 0, updatedAt: updated.updatedAt || ticket.updatedAt }
          : ticket
      )));

      setSelectedTicket((current) => (current ? { ...current, status: 'closed' } : current));
      window.dispatchEvent(new Event('support-tickets-updated'));
    } finally {
      setReplyLoading(false);
    }
  };

  const selectedReplies = useMemo(() => selectedTicket?.replies || [], [selectedTicket]);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Support Tickets">
        <div className="py-16">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Support Tickets">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Support Tickets">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <Button variant="primary" size="md">+ Create Ticket</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">Ticket ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{ticket.ticketId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{ticket.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {(ticket.status || 'pending').charAt(0).toUpperCase() + (ticket.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {(ticket.priority || 'low').charAt(0).toUpperCase() + (ticket.priority || 'low').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{ticket.date}</td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => openThread(ticket)} className="rounded px-3 py-1 text-xs font-medium text-violet-600 transition hover:bg-violet-50">
                      Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 lg:items-center">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{selectedTicket.ticketId}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedTicket.email} · {selectedTicket.category}</p>
              </div>
              <Button variant="danger" size="md" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
              {selectedReplies.map((reply) => (
                <div key={reply.id} className={`rounded-2xl p-4 ${reply.authorType === 'admin' ? 'bg-violet-50' : 'bg-slate-100'}`}>
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{reply.authorName}</span>
                    <span>{reply.date}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{reply.message}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-5">
              {String(selectedTicket.status || '').toLowerCase() === 'closed' ? (
                <div className="py-4 text-sm text-slate-500">This ticket is closed. Replies are disabled.</div>
              ) : (
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  placeholder="Type admin reply..."
                />
              )}
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="danger" size="md" onClick={() => setSelectedTicket(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={closeTicket}
                  disabled={String(selectedTicket.status || '').toLowerCase() === 'closed' || replyLoading}
                >
                  {String(selectedTicket.status || '').toLowerCase() === 'closed' ? 'Closed' : 'Close Ticket'}
                </Button>
                {String(selectedTicket.status || '').toLowerCase() !== 'closed' && (
                  <Button variant="primary" size="md" onClick={sendReply} disabled={replyLoading}>
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminTickets;
