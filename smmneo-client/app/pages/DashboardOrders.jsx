import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { useAuth } from '../components/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import { cancelOrder, refreshProviderOrder } from '../services/adminDashboardAPI.js';

const defaultStatusValues = ['all', 'pending', 'processing', 'completed', 'partial', 'canceled', 'refunded'];

const statusColorMap = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-700',
  partial: 'bg-fuchsia-100 text-fuchsia-700',
  canceled: 'bg-slate-100 text-slate-700',
  canceled_order: 'bg-slate-100 text-slate-700',
  refunded: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

function formatLink(link) {
  if (!link) return '—';
  try {
    const url = new URL(link);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return link;
  }
}


function normalizeStatus(status) {
  const normalized = String(status || 'pending')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized === 'complete' || normalized === 'completed' || normalized === 'done' || normalized === 'success' || normalized === 'delivered') {
    return 'completed';
  }
  if (normalized === 'cancelled') return 'canceled';
  return normalized || 'pending';
}

function formatStatusLabel(status) {
  const s = normalizeStatus(status);
  // Map all variations to standard labels
  if (s === 'pending') return 'Pending';
  if (s === 'in_progress') return 'In Progress';
  if (s === 'processing') return 'Processing';
  if (s === 'completed') return 'Completed';
  if (s === 'partial') return 'Partial';
  if (s === 'canceled' || s === 'canceled_order') return 'Canceled';
  if (s === 'refunded') return 'Refunded';
  if (s === 'failed') return 'Failed';
  if (!s) return 'Unknown';
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getOrderStatusValue(order) {
  const localStatus = normalizeStatus(order?.status || 'pending');
  const providerStatus = normalizeStatus(
    order?.providerStatus ||
    order?.providerResponse?.status ||
    order?.providerResponse?.state ||
    order?.providerResponse?.status_text ||
    order?.providerResponse?.state_text ||
    order?.providerResponse?.order_status ||
    order?.providerResponse?.orderStatus ||
    order?.providerResponse?.statusMessage ||
    order?.providerResponse?.status_message ||
    order?.providerResponse?.status_name ||
    order?.providerResponse?.statusName ||
    order?.providerResponse?.current_status ||
    order?.providerResponse?.currentStatus ||
    order?.providerResponse?.order_status_text ||
    order?.providerResponse?.status_description ||
    order?.status ||
    'pending'
  );

  const finalLocalState = ['completed', 'canceled', 'refunded', 'failed', 'partial'];
  if (finalLocalState.includes(localStatus)) {
    return localStatus;
  }

  const finalProviderState = ['completed', 'canceled', 'refunded', 'failed', 'partial'];
  if (finalProviderState.includes(providerStatus)) {
    return providerStatus;
  }

  return providerStatus || localStatus || 'pending';
}

function getStatusClass(status) {
  return statusColorMap[normalizeStatus(status)] || 'bg-slate-100 text-slate-700';
}

function getDisplayOrderId(order) {
  return order?.providerOrderId || order?.orderId || order?.id || '—';
}

function getOrderServiceDisplay(order) {
  const serviceId = order?.providerServiceId || order?.serviceId || order?.provider_service_id;
  const serviceName = order?.service || 'Service';
  if (serviceId && String(serviceId).trim()) {
    const to = `/dashboard/?service=${encodeURIComponent(String(serviceId).trim())}`;
    return (
      <span className="inline-flex flex-wrap gap-1">
        <Link
          to={to}
          className="text-slate-900 hover:underline font-semibold whitespace-nowrap"
          onClick={(event) => event.stopPropagation()}
        >
          {String(serviceId).trim()}
        </Link>
        <span className="text-slate-700">-</span>
          <span className="text-slate-700 wrap-break-word">{serviceName}</span>
      </span>
    );
  }
  return serviceName;
}

function getStartCountValue(order) {
  const rawStart = order?.providerResponse?.start ?? order?.providerResponse?.start_count ?? order?.providerResponse?.startCount ?? order?.startCount ?? order?.start_count;
  const startCount = Number(rawStart);
  return Number.isFinite(startCount) ? startCount : 0;
}

function getRemainValue(order) {
  const providerRemains = Number(
    order?.providerResponse?.remains ?? order?.providerResponse?.remaining ?? order?.providerResponse?.remain ?? order?.remains
  );
  if (Number.isFinite(providerRemains) && providerRemains >= 0) return providerRemains;

  const orderRemains = Number(order?.remains);
  if (Number.isFinite(orderRemains) && orderRemains >= 0) return orderRemains;

  const providerStart = getStartCountValue(order);
  if (Number.isFinite(providerStart) && providerStart >= 0) return providerStart;

  return 0;
}

function getChargeValue(order, currency = 'USD', formatCurrency = (amount, curr) => {
  const formattedAmount = Number(amount) || 0;
  if (curr === 'BDT') return `BDT ${formattedAmount.toFixed(2)}`;
  const absAmount = Math.abs(formattedAmount);
  if (absAmount >= 0.01) return `$${formattedAmount.toFixed(2)}`;
  if (absAmount > 0) return `$${formattedAmount.toFixed(8).replace(/\.0+$|([0-9]*\.[0-9]*?)0+$/, '$1')}`;
  return `$${formattedAmount.toFixed(2)}`;
}) {
  const rawCharge =
    Number.isFinite(order?.amountRaw) ? order.amountRaw :
    order?.price ??
    order?.paidAmount ??
    order?.charge ??
    order?.providerResponse?.charge ??
    order?.providerResponse?.amount ??
    order?.providerResponse?.price ??
    order?.amount;
  if (rawCharge === null || rawCharge === undefined || rawCharge === '') {
    return '—';
  }

  const text = String(rawCharge).trim();
  if (!text) {
    return '—';
  }

  const numeric = Number(text.replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric)) {
    return text;
  }

  const isBdtValue = /BDT|৳/.test(text);
  if (isBdtValue) {
    if (currency === 'BDT') {
      return `৳${numeric.toFixed(2)}`;
    }
    return formatCurrency(numeric / 130, 'USD');
  }

  if (currency === 'BDT') {
    return formatCurrency(numeric, 'BDT');
  }

  return formatCurrency(numeric, currency);
}

export default function DashboardOrders() {
  const { user, loading: authLoading } = useAuth();
  const { currency, convertToCurrency, formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [cancellingIds, setCancellingIds] = useState([]);
  const [refreshingIds, setRefreshingIds] = useState([]);
  const [autoRefreshedOrderIds, setAutoRefreshedOrderIds] = useState([]);

  const loadOrders = React.useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError('');

      const token = await user.getIdToken();
      const url = getApiUrl(`${API_ENDPOINTS.ORDERS_USER(user.email)}?limit=100&status=all`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || payload.message || 'Failed to fetch orders');
      }

      setOrders(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setOrders([]);
      setLoading(false);
      return;
    }
    loadOrders();
  }, [authLoading, user?.email, loadOrders]);

  useEffect(() => {
    const ordersToRefresh = orders
      .filter((order) => order.providerOrderId && !autoRefreshedOrderIds.includes(order.orderId))
      .filter((order) => ['pending', 'processing', 'partial'].includes(getOrderStatusValue(order)))
      .slice(0, 4);

    if (!ordersToRefresh.length) return;

    let mounted = true;
    const refreshPendingOrders = async () => {
      try {
        setRefreshingIds((prev) => [...prev, ...ordersToRefresh.map((order) => order.orderId)]);
        await Promise.all(
          ordersToRefresh.map(async (order) => {
            await refreshProviderOrder(order.providerOrderId);
            return order.orderId;
          })
        );
        if (!mounted) return;
        setAutoRefreshedOrderIds((prev) => [...prev, ...ordersToRefresh.map((order) => order.orderId)]);
        await loadOrders();
      } catch (err) {
        // ignore refresh errors, user can still interact manually
      } finally {
        if (!mounted) return;
        setRefreshingIds((prev) => prev.filter((id) => !ordersToRefresh.some((o) => o.orderId === id)));
      }
    };

    refreshPendingOrders();
    return () => {
      mounted = false;
    };
  }, [orders, autoRefreshedOrderIds, loadOrders]);

  const statusOptions = useMemo(() => {
    // fixed order of statuses to always show eight buttons (including 'all')
    const fixedOrder = ['all', 'pending', 'in_progress', 'processing', 'completed', 'partial', 'canceled', 'refunded'];
    return fixedOrder.map((value) => ({ value, label: value === 'all' ? 'All' : formatStatusLabel(value) }));
  }, [orders]);

  const statusFilteredOrders = useMemo(() => {
    if (activeStatus === 'all') return orders;
    return orders.filter((order) => getOrderStatusValue(order) === activeStatus);
  }, [orders, activeStatus]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return statusFilteredOrders;

    return statusFilteredOrders.filter((order) => {
      return [order.orderId, order.service, order.link, order.status, order.providerStatus, order.date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [statusFilteredOrders, searchTerm]);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!event.target.closest('[data-order-actions]')) {
        setOpenActionId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleOrderAgain = async (order) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('smmssecure:orderAgainLink', order.link || '');
      }
      setOpenActionId(null);
      toast.success('Order link sent to New Order page');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Unable to prepare order again');
    }
  };

  const handleReport = async (order) => {
    try {
      const reportText = `Order ID: ${order.orderId}\nService: ${order.service}\nLink: ${order.link}\nStatus: ${order.status}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
        toast.success('Order details copied for reporting');
      } else {
        toast('Order details ready for report');
      }
      setOpenActionId(null);
    } catch (err) {
      toast.error('Unable to copy report details');
    }
  };

  const handleRefreshOrder = async (order) => {
    if (!order?.providerOrderId) {
      toast.error('Unable to refresh order: missing provider order id');
      return;
    }

    try {
      setRefreshingIds((prev) => [...prev, order.orderId]);
      await refreshProviderOrder(order.providerOrderId);
      toast.success('Order status refreshed');
      await loadOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to refresh order status');
    } finally {
      setRefreshingIds((prev) => prev.filter((id) => id !== order.orderId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
        <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`dashboard-main min-w-0 px-1 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading your orders...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`dashboard-main min-w-0 px-1 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">My Orders</h1>
              <p className="mt-1 text-sm text-slate-500">Showing orders for {user.email}</p>
            </div>
            <div className="w-full lg:max-w-md">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = activeStatus === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveStatus(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No orders found for this filter.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <article key={order.orderId || order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Order</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{getDisplayOrderId(order)}</p>
                      <p className="text-xs text-slate-500">{order.date}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusClass(getOrderStatusValue(order))}`}>
                      {formatStatusLabel(getOrderStatusValue(order))}
                    </span>
                  </div>

                  <div className="grid gap-2 text-[11px] text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Service</span>
                      <span className="truncate text-right text-slate-600">{order.service || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Charge</span>
                      <span className="truncate text-right text-slate-600">{getChargeValue(order, currency, formatCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Quantity</span>
                      <span className="truncate text-right text-slate-600">{order.quantity ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Remains</span>
                      <span className="truncate text-right text-slate-600">{getRemainValue(order)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Link</span>
                      <span className="truncate text-right text-violet-600">{formatLink(order.link)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.cancelable && ['pending', 'processing'].includes(getOrderStatusValue(order)) && (
                      <button
                        type="button"
                        disabled={cancellingIds.includes(order.orderId)}
                        onClick={async () => {
                          try {
                            setCancellingIds((prev) => [...prev, order.orderId]);
                            await cancelOrder(order.orderId);
                            toast.success('Cancel requested');
                            setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? { ...o, status: 'canceled', cancelable: false } : o)));
                          } catch (err) {
                            toast.error(err.message || 'Failed to cancel order');
                          } finally {
                            setCancellingIds((prev) => prev.filter((id) => id !== order.orderId));
                          }
                        }}
                        className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                      >
                        {cancellingIds.includes(order.orderId) ? 'Canceling…' : 'Cancel'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOrderAgain(order)}
                      className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-600"
                    >
                      Order Again
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReport(order)}
                      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-slate-300"
                    >
                      Report
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="smooth-scroll scrollbar-hide horizontal-scroll-table md:overflow-visible">
            <table className="min-w-max md:w-full table-auto text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">ID</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Link</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Charge</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Start count</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quantity</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Service</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Remains</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-3 py-10 text-center text-slate-500">
                      No orders found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const openUpward = index === filteredOrders.length - 1;

                    return (
                      <tr key={order.orderId || order.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="px-2 py-3 text-[11px] font-semibold text-slate-900 whitespace-nowrap truncate max-w-25">{getDisplayOrderId(order)}</td>
                        <td className="px-2 py-3 text-[11px] text-slate-600 whitespace-nowrap truncate max-w-20">{order.date}</td>
                        <td className="px-2 py-3 text-[11px] text-violet-600 whitespace-nowrap truncate max-w-45">
                          <a href={order.link} target="_blank" rel="noreferrer" className="inline-block max-w-full truncate hover:underline">
                            {formatLink(order.link)}
                          </a>
                        </td>
                        <td className="px-2 py-3 text-[11px] text-slate-700 whitespace-nowrap truncate max-w-20">{getChargeValue(order, currency, formatCurrency)}</td>
                        <td className="px-2 py-3 text-[11px] text-slate-700 whitespace-nowrap truncate max-w-20">{getStartCountValue(order)}</td>
                        <td className="px-2 py-3 text-[11px] text-slate-700 whitespace-nowrap truncate max-w-20">{order.quantity ?? 0}</td>
                        <td className="px-2 py-3 text-[11px] text-slate-700 whitespace-normal wrap-break-word max-w-60">
                          {getOrderServiceDisplay(order)}
                        </td>
                        <td className="px-2 py-3 text-[11px] text-slate-700 whitespace-nowrap truncate max-w-20">{getRemainValue(order)}</td>
                        <td className="px-2 py-3 text-[11px] whitespace-nowrap max-w-22.5">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusClass(getOrderStatusValue(order))}`}>
                            {formatStatusLabel(getOrderStatusValue(order))}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-[11px] text-right whitespace-nowrap" data-order-actions>
                          <div className="relative inline-flex items-center gap-1">
                            {order.cancelable && ['pending', 'processing'].includes(getOrderStatusValue(order)) && (
                              <button
                                type="button"
                                disabled={cancellingIds.includes(order.orderId)}
                                onClick={async () => {
                                  try {
                                    setCancellingIds((prev) => [...prev, order.orderId]);
                                    await cancelOrder(order.orderId);
                                    toast.success('Cancel requested');
                                    setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? { ...o, status: 'canceled', cancelable: false } : o)));
                                  } catch (err) {
                                    toast.error(err.message || 'Failed to cancel order');
                                  } finally {
                                    setCancellingIds((prev) => prev.filter((id) => id !== order.orderId));
                                    setOpenActionId(null);
                                  }
                                }}
                                className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                              >
                                {cancellingIds.includes(order.orderId) ? 'Canceling…' : 'Cancel'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setOpenActionId(openActionId === order.orderId ? null : order.orderId)}
                              className="rounded-full bg-slate-500 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-600"
                            >
                              Actions
                              <span className="text-[10px]">▼</span>
                            </button>

                            {openActionId === order.orderId && (
                              <div className={`absolute right-0 z-20 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                <button
                                  type="button"
                                  onClick={() => handleOrderAgain(order)}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                                >
                                  Order Again
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReport(order)}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                                >
                                  Report
                                </button>
                                {(order.providerOrderId && ['pending', 'processing', 'partial'].includes(getOrderStatusValue(order))) && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await handleRefreshOrder(order);
                                      setOpenActionId(null);
                                    }}
                                    disabled={refreshingIds.includes(order.orderId)}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    {refreshingIds.includes(order.orderId) ? 'Refreshing…' : 'Refresh Status'}
                                  </button>
                                )}
                            {order.cancelable && ['pending', 'processing'].includes(getOrderStatusValue(order)) && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await cancelOrder(order.orderId);
                                        toast.success('Cancel requested');
                                        setOpenActionId(null);
                                        setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? { ...o, status: 'canceled' } : o)));
                                      } catch (err) {
                                        toast.error(err.message || 'Failed to cancel order');
                                      }
                                    }}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}