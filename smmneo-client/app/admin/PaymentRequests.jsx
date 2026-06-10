import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import DashboardLayout from '../components/admin/layout/DashboardLayout.jsx';
import LoadingSpinner from '../components/admin/common/LoadingSpinner.jsx';
import ErrorState from '../components/admin/common/ErrorState.jsx';
import { listPaymentRequests, verifyPaymentRequest } from '../services/paymentAPI.js';

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const PaymentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [savingId, setSavingId] = useState(null);

  const loadRequests = async () => {
    try {
      setError('');
      const data = await listPaymentRequests();
      if (data && data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
        setError(data?.error || 'Failed to load payment requests');
      }
    } catch (err) {
      setError(err.message || 'Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    loadRequests();
    const interval = setInterval(() => {
      if (!mounted) return;
      loadRequests();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeStatus === 'all') return requests;
    return requests.filter((request) => String(request.status || 'pending').toLowerCase() === activeStatus);
  }, [requests, activeStatus]);

  const handleVerify = async (id, status) => {
    const { isConfirmed } = await Swal.fire({
      title: `Mark this request as ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;
    setSavingId(id);
    try {
      const result = await verifyPaymentRequest(id, { status, adminNotes: `${status} by admin` });
      if (!result.success) throw new Error(result.error || 'Failed to update status');
      toast.success(`Request ${status} successfully`);
      await loadRequests();
    } catch (err) {      const message = err.message || 'Unable to update request status';
      toast.error(message);
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Payment Requests">
        <div className="py-16">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Payment Requests">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Payment Requests">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Requests</h1>
          <p className="text-sm text-slate-600">View and manage user-submitted payment confirmations.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeStatus === status ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {status === 'all' ? 'All' : statusLabels[status]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadRequests();
            }}
            className="rounded-full px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                    No payment requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request._id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-4 py-4 font-medium text-slate-900">{request.method || request.payment_method || '—'}</td>
                    <td className="px-4 py-4">{request.username || '—'}</td>
                    <td className="px-4 py-4">{request.amount != null ? `${request.amount}` : '—'}</td>
                    <td className="px-4 py-4">{request.client_number || request.senderNumber || '—'}</td>
                    <td className="px-4 py-4 break-all">{request.transactionId || request.transaction_id || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                        request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {statusLabels[request.status] || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4">{new Date(request.createdAt || request.created_at).toLocaleString()}</td>
                    <td className="px-4 py-4 space-x-2">
                      {request.status === 'pending' ? (
                        <> 
                          <button
                            type="button"
                            onClick={() => handleVerify(request._id, 'approved')}
                            disabled={savingId === request._id}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerify(request._id, 'rejected')}
                            disabled={savingId === request._id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">No action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentRequests;
