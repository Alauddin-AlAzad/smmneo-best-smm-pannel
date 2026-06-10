import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router';
import toast from 'react-hot-toast';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { useAuth } from '../components/AuthContext.jsx';
import { createSupportTicket, fetchTicketThread, fetchUserTickets, replyToSupportTicket } from '../services/adminDashboardAPI.js';

const categoryOptions = [
  { value: 'AI Support', label: 'AI Support' },
  { value: 'Human Support', label: 'Human Support' },
];

const subcategoryMap = {
  'AI Support': ['Refill', 'Cancel', 'Speedup', 'Restart', 'Fake complete'],
  'Human Support': ['Refill', 'Cancel', 'Speedup', 'Restart', 'Fake complete', 'Payment'],
};

const supportFaq = [
  {
    id: 'create-ticket',
    title: 'How to Create Ticket ?',
    body: 'Select a category, choose the most relevant subcategory, enter your order ID, and submit the ticket. Use one ticket per issue for faster resolution.',
  },
  {
    id: 'response-time',
    title: 'How long does it take to get a reply from support regarding my complaint?',
    body: 'Most tickets are answered within a few minutes during active support hours. Complex cases may take longer if we need to verify order details.',
  },
  {
    id: 'guidelines',
    title: 'Important Guidelines',
    body: 'Please open only one ticket for the same or similar issue. Avoid creating multiple tickets for the same issue, as it may delay the resolution process.',
    details: [
      'No Use of Bad Language: Any form of offensive, abusive, or inappropriate language will not be tolerated.',
      'Respect Our Support Team: Our team is here to assist you. Treat them with respect to ensure smooth communication and faster resolution.',
      'Consequences of Violations: First offense: a warning will be issued. Repeated offenses: your account may face temporary or permanent suspension without prior notice.',
      'How to Communicate: Be clear and respectful in your messages. Provide all necessary details about your issue to help us assist you effectively.',
    ],
  },
];

function getStatusClass(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'answered') return 'bg-green-100 text-green-700';
  if (value === 'closed') return 'bg-slate-100 text-slate-700';
  if (value === 'pending') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto h-62.5 w-full max-w-105 lg:h-70">
      <div className="absolute inset-0 rounded-[28px] bg-linear-to-br from-white/60 to-violet-50/40 opacity-80" />
      <div className="absolute left-10 top-4 h-20 w-20 rounded-full bg-amber-200/80 blur-[1px]" />
      <div className="absolute right-12 top-8 h-16 w-16 rounded-full bg-emerald-300/70" />
      <div className="absolute left-0 top-24 h-14 w-14 rounded-2xl bg-slate-900/90 shadow-lg" />
      <div className="absolute left-16 top-12 h-20 w-28 rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
        <div className="mx-3 mt-3 space-y-2">
          <div className="h-3 rounded-full bg-emerald-100" />
          <div className="h-3 rounded-full bg-slate-100" />
          <div className="h-3 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="absolute left-28 top-40 h-28 w-44 rounded-[26px] bg-white shadow-xl ring-1 ring-slate-200">
        <div className="absolute left-4 top-4 h-4 w-24 rounded-full bg-slate-900" />
        <div className="absolute left-6 top-10 right-6 h-2 rounded-full bg-violet-200" />
        <div className="absolute left-6 top-16 right-6 h-2 rounded-full bg-pink-200" />
        <div className="absolute left-6 bottom-6 flex items-end gap-2">
          <div className="h-8 w-4 rounded-sm bg-violet-300" />
          <div className="h-12 w-4 rounded-sm bg-amber-300" />
          <div className="h-16 w-4 rounded-sm bg-emerald-300" />
          <div className="h-10 w-4 rounded-sm bg-slate-400" />
        </div>
      </div>
      <div className="absolute right-0 top-28 h-36 w-36 rounded-[36px] bg-linear-to-br from-white to-violet-100 shadow-xl ring-1 ring-slate-200">
        <div className="absolute left-7 top-8 h-16 w-16 rounded-full bg-amber-300 shadow-md" />
        <div className="absolute right-6 top-5 h-8 w-8 rounded-full bg-pink-300/80" />
        <div className="absolute bottom-6 left-1/2 h-16 w-2 -translate-x-1/2 rotate-12 rounded-full bg-slate-300" />
      </div>
      <div className="absolute bottom-6 right-8 h-20 w-20 rounded-full bg-pink-200/70 blur-[1px]" />
      <div className="absolute right-20 top-0 h-10 w-10 rounded-full bg-orange-500 text-center text-xl leading-10 text-white shadow-lg">☺</div>
    </div>
  );
}

export default function DashboardTickets() {
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [faqOpen, setFaqOpen] = useState('guidelines');
  const [form, setForm] = useState({
    category: 'AI Support',
    subcategory: 'Refill',
    message: '',
  });

  useEffect(() => {
    let mounted = true;

    async function loadTickets() {
      if (!user?.email) return;
      try {
        setLoading(true);
        const data = await fetchUserTickets(user.email, 100, 'all');
        if (!mounted) return;
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        toast.error(err.message || 'Failed to load tickets');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTickets();

    return () => {
      mounted = false;
    };
  }, [user?.email]);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!event.target.closest('[data-ticket-thread]')) {
        setActiveTicketId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadActiveThread = async () => {
      if (!activeTicketId || !user?.email) return;

      try {
        const thread = await fetchTicketThread(activeTicketId, 'user');
        if (!mounted || !thread) return;

        setTickets((current) => current.map((ticket) => (
          (ticket.ticketId || ticket.id) === activeTicketId
            ? { ...ticket, ...thread }
            : ticket
        )));
        window.dispatchEvent(new Event('support-tickets-updated'));
      } catch {
        // Keep the list usable even if the thread refresh fails.
      }
    };

    loadActiveThread();

    return () => {
      mounted = false;
    };
  }, [activeTicketId, user?.email]);

  const visibleTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const sorted = [...tickets].sort((left, right) => {
      const leftDate = new Date(left.updatedAt || left.lastReplyAt || left.date || 0).getTime();
      const rightDate = new Date(right.updatedAt || right.lastReplyAt || right.date || 0).getTime();
      return rightDate - leftDate;
    });

    if (!term) return sorted;

    return sorted.filter((ticket) => {
      const haystack = [ticket.ticketId, ticket.id, ticket.subject, ticket.category, ticket.subcategory, ticket.status, ticket.updatedAt, ticket.lastReplyAt]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [tickets, searchTerm]);

  if (authLoading || loading) {
    return (
      <div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
        <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`dashboard-main min-w-0 px-2.5 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading support tickets...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const currentSubcategories = subcategoryMap[form.category] || subcategoryMap['AI Support'];

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    const subject = form.subcategory;
    const message = form.category === 'Human Support'
      ? form.message.trim()
      : `Support request for ${form.category} / ${form.subcategory}.`;

    if (form.category === 'Human Support' && !message) {
      toast.error('Please write a message for human support');
      return;
    }

    try {
      setSubmitting(true);
      const created = await createSupportTicket({
        email: user.email,
        name: user.displayName || user.name || user.email,
        category: form.category,
        subcategory: form.subcategory,
        subject,
        message,
      });

      setTickets((current) => [created, ...current]);
      setActiveTab('history');
      setActiveTicketId(created.ticketId || created.id);
      setForm({ category: 'AI Support', subcategory: 'Refill', message: '' });
      window.dispatchEvent(new Event('support-tickets-updated'));
      toast.success('Ticket created');
    } catch (err) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticket) => {
    const ticketKey = ticket.ticketId || ticket.id;
    const draft = (replyDrafts[ticketKey] || '').trim();
    if (!draft) {
      toast.error('Type a reply first');
      return;
    }

    try {
      const reply = await replyToSupportTicket(ticketKey, {
        email: user.email,
        name: user.displayName || user.name || user.email,
        message: draft,
      });

      setTickets((current) => current.map((item) => {
        if ((item.ticketId || item.id) !== ticketKey) return item;
        return {
          ...item,
          status: 'pending',
          unreadForAdmin: Number(item.unreadForAdmin || 0) + 1,
          unreadForUser: 0,
          replies: [...(item.replies || []), reply],
          repliesCount: (item.repliesCount || 0) + 1,
          lastReplyAt: reply.date,
        };
      }));

      setReplyDrafts((current) => ({ ...current, [ticketKey]: '' }));
      window.dispatchEvent(new Event('support-tickets-updated'));
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    }
  };

  return (
    <div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`dashboard-main min-w-0 px-2.5 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
        <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-5 lg:py-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                <span className="text-violet-600">S</span>
                Support Tickets
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-[34px]">Support Tickets</h1>
                <p className="mt-3 max-w-3xl text-[13px] leading-6 text-slate-600">
                  Need assistance? Create a support ticket and get the help you need from our dedicated support team.
                  Whether you&apos;re facing technical issues, have questions about our services, or need guidance, we&apos;re
                  here to assist you. Simply submit a ticket, and our experts will respond promptly to ensure your
                  concerns are resolved efficiently.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="inline-flex rounded-md bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(109,40,217,0.25)] transition hover:bg-violet-700"
              >
                Create Tickets
              </button>
            </div>

            <div className="flex items-center justify-center">
              <HeroIllustration />
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${activeTab === 'new' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-white'}`}
              >
                New Tickets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${activeTab === 'history' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-white'}`}
              >
                Ticket History
              </button>
            </div>

            <div className="mb-4 space-y-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[12px] leading-5 text-slate-600">
              <p>👉 Hey {user.displayName || user.name || user.email}, Subscribe our Telegram Channel To Get Special Service Offer <a className="font-semibold text-sky-600 underline" href="https://t.me/" target="_blank" rel="noreferrer">Join Our Telegram Channel</a></p>
              <p>👉 Hey {user.displayName || user.name || user.email}, If you have any kind of payment related issue, you can contact us on <a className="font-semibold text-sky-600 underline" href="https://t.me/" target="_blank" rel="noreferrer">Telegram - Click Here</a></p>
            </div>

            {activeTab === 'new' ? (
              <form onSubmit={handleCreateTicket} className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">Category</span>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm((current) => ({ ...current, category: e.target.value, subcategory: subcategoryMap[e.target.value][0] }))}
                      className="h-11 w-full appearance-none rounded border border-slate-300 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none transition focus:border-violet-500"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">subcategory</span>
                  <div className="relative">
                    <select
                      value={form.subcategory}
                      onChange={(e) => setForm((current) => ({ ...current, subcategory: e.target.value }))}
                      className="h-11 w-full appearance-none rounded border border-slate-300 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none transition focus:border-violet-500"
                    >
                      {currentSubcategories.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
                  </div>
                </label>

                {form.category === 'Human Support' && (
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">Message</span>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
                      rows="4"
                      className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-violet-500"
                      placeholder="Write your issue message"
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded bg-violet-600 text-[14px] font-semibold text-white shadow-[0_10px_18px_rgba(109,40,217,0.24)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit ticket'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-stretch overflow-hidden rounded border border-slate-300 bg-slate-50">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 flex-1 border-0 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400"
                    placeholder="Search"
                  />
                  <button type="button" className="h-11 w-11 bg-violet-600 text-white">
                    ⌕
                  </button>
                </div>

                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-semibold uppercase tracking-wide text-slate-700">
                          <th className="px-3 py-3">ID</th>
                          <th className="px-3 py-3">Subject</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Last update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTickets.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-10 text-center text-sm text-slate-500">
                              No tickets found.
                            </td>
                          </tr>
                        ) : visibleTickets.map((ticket, index) => {
                          const ticketKey = ticket.ticketId || ticket.id || String(index);
                          const lastUpdate = ticket.updatedAt || ticket.lastReplyAt || ticket.date || '—';
                          const status = String(ticket.status || 'pending').toLowerCase() === 'open' ? 'pending' : String(ticket.status || 'pending').toLowerCase();
                          const pillClass = status === 'answered'
                            ? 'bg-green-500 text-white'
                            : status === 'pending'
                              ? 'bg-violet-600 text-white'
                              : 'bg-rose-500 text-white';

                          return (
                            <tr key={ticketKey} className="border-b border-slate-200 text-[13px] odd:bg-slate-50/80">
                              <td className="px-3 py-2 font-semibold text-slate-700">{ticket.ticketId}</td>
                              <td className="px-3 py-2">
                                <Link
                                  to={`/dashboard/tickets/${ticketKey}`}
                                  className="font-semibold text-violet-600 underline decoration-violet-300 underline-offset-2"
                                >
                                  {ticket.subject || ticket.subcategory}
                                </Link>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex min-w-35 justify-center rounded-full px-4 py-1.5 text-[12px] font-semibold ${pillClass}`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{lastUpdate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-white shadow-sm">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[11px] font-bold">i</span>
              <h2 className="text-[14px] font-semibold">Read before create tickets</h2>
            </div>

            <div className="mt-3 space-y-2">
              {supportFaq.map((item) => {
                const isOpen = faqOpen === item.id;
                return (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? '' : item.id)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] font-medium ${isOpen && item.id !== 'guidelines' ? 'bg-slate-50' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">▣</span>
                        {item.title}
                      </span>
                      <span className="text-slate-400">{isOpen ? '⌃' : '⌄'}</span>
                    </button>

                    {isOpen && item.id !== 'guidelines' && (
                      <div className="border-t border-slate-200 px-3 py-3 text-[13px] leading-6 text-slate-600">
                        {item.body}
                      </div>
                    )}

                    {item.id === 'guidelines' && isOpen && (
                      <div className="border-t border-slate-200 px-3 py-3 text-[13px] leading-6 text-slate-600">
                        <p>{item.body}</p>
                        <div className="mt-3 space-y-2">
                          <p><span className="font-semibold text-slate-900">1.</span> {item.details[0]}</p>
                          <p><span className="font-semibold text-slate-900">2.</span> {item.details[1]}</p>
                          <p><span className="font-semibold text-slate-900">3.</span> {item.details[2]}</p>
                          <p><span className="font-semibold text-slate-900">4.</span> {item.details[3]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
