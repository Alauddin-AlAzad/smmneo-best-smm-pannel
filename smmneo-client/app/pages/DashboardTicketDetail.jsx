import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { useAuth } from '../components/AuthContext.jsx';
import { fetchTicketThread, replyToSupportTicket } from '../services/adminDashboardAPI.js';

export async function loader() {
	return null;
}

function getStatusClass(status) {
	const value = String(status || 'pending').toLowerCase();
	if (value === 'answered') return 'bg-green-100 text-green-700';
	if (value === 'closed') return 'bg-slate-100 text-slate-700';
	if (value === 'pending') return 'bg-amber-100 text-amber-700';
	return 'bg-blue-100 text-blue-700';
}

export default function DashboardTicketDetail() {
	const { user, loading: authLoading } = useAuth();
	const { ticketId } = useParams();
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [ticket, setTicket] = useState(null);
	const [loading, setLoading] = useState(true);
	const [replyText, setReplyText] = useState('');
	const [sending, setSending] = useState(false);

	useEffect(() => {
		setSidebarOpen(window.innerWidth >= 1024);
	}, []);

	useEffect(() => {
		let mounted = true;

		const loadTicket = async () => {
			if (!ticketId || !user?.email) return;

			try {
				setLoading(true);
				const data = await fetchTicketThread(ticketId, 'user');
				if (!mounted) return;
				setTicket(data || null);
				window.dispatchEvent(new Event('support-tickets-updated'));
			} catch (err) {
				if (!mounted) return;
				toast.error(err.message || 'Failed to load ticket');
			} finally {
				if (mounted) setLoading(false);
			}
		};

		loadTicket();

		return () => {
			mounted = false;
		};
	}, [ticketId, user?.email]);

	const replies = useMemo(() => ticket?.replies || [], [ticket]);
	const status = String(ticket?.status || 'pending').toLowerCase() === 'open'
		? 'pending'
		: String(ticket?.status || 'pending').toLowerCase();
	const canReply = status !== 'closed';

	const handleReply = async (event) => {
		event.preventDefault();

		const message = replyText.trim();
		if (!message) {
			toast.error('Type a reply first');
			return;
		}

		try {
			setSending(true);
			const reply = await replyToSupportTicket(ticket.ticketId, {
				email: user.email,
				name: user.displayName || user.name || user.email,
				message,
			});

			setTicket((current) => (current ? {
				...current,
				status: 'pending',
				unreadForAdmin: Number(current.unreadForAdmin || 0) + 1,
				unreadForUser: 0,
				replies: [...(current.replies || []), reply],
				repliesCount: (current.repliesCount || 0) + 1,
				lastReplyAt: reply.date,
			} : current));

			setReplyText('');
			window.dispatchEvent(new Event('support-tickets-updated'));
			toast.success('Reply sent');
		} catch (err) {
			toast.error(err.message || 'Failed to send reply');
		} finally {
			setSending(false);
		}
	};

	if (authLoading || loading) {
		return (
			<div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
				<DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
				<DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
				<main className={`dashboard-main min-w-0 px-2.5 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading support ticket...</div>
				</main>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/" replace />;
	}

	if (!ticket) {
		return (
			<div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
				<DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
				<DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
				<main className={`dashboard-main min-w-0 px-2.5 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<p className="text-sm text-slate-600">Support ticket not found.</p>
						<Link to="/dashboard/tickets" className="mt-4 inline-flex rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
							Back to tickets
						</Link>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
			<DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
			<DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

			<main className={`dashboard-main min-w-0 px-2.5 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
				<div className="space-y-4 lg:w-2/3">
					<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-600 text-white shadow-md">
							<span className="text-lg font-bold">i</span>
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="truncate text-2xl font-extrabold text-slate-900">{ticket.subject || ticket.subcategory || 'Support Ticket'}</h1>
							<p className="mt-1 text-sm text-slate-500">Support ID: {ticket.ticketId} · {ticket.email}</p>
						</div>
						<Link to="/dashboard/tickets" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
							Back
						</Link>
					</div>

					<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
						<div className="space-y-4 px-4 py-4 lg:px-5">
							{replies.map((reply) => {
								const isAdmin = reply.authorType === 'admin';
								const bubbleClass = isAdmin ? 'bg-green-100' : 'bg-blue-100';

								return (
									<div key={reply.id} className="space-y-1">
										<div className={`rounded-2xl px-4 py-3 ${bubbleClass}`}>
											<div className="whitespace-pre-line text-sm leading-6 text-slate-800">{reply.message}</div>
										</div>
										<div className="px-1 text-sm font-semibold text-slate-900">
											<span>{reply.authorName}</span>
											<span className="ml-1 font-normal text-slate-500">{reply.date}</span>
										</div>
									</div>
								);
							})}
						</div>

						<div className="border-t border-slate-200 px-4 py-4 lg:px-5">
							<div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</div>

							{canReply ? (
								<form onSubmit={handleReply} className="space-y-3">
									<label className="block">
										<span className="mb-1.5 block text-sm font-semibold text-slate-800">Message</span>
										<textarea
											value={replyText}
											onChange={(e) => setReplyText(e.target.value)}
											rows={4}
											className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
											placeholder="Write your reply..."
										/>
									</label>
									<div className="flex justify-end gap-3">
										<Link to="/dashboard/tickets" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
											Cancel
										</Link>
										<button type="submit" disabled={sending} className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
											{sending ? 'Sending...' : 'Submit'}
										</button>
									</div>
								</form>
							) : (
								<div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
									This ticket is closed. Replies are disabled.
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
