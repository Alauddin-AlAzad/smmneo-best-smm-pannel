import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { sidebarMenuItems } from '../../../data/adminDashboardData.js';
import { fetchAdminSettings, fetchAdminTickets } from '../../../services/adminDashboardAPI.js';
import { getAdminDisplayName, getAdminSubtitle } from '../../../utils/adminProfile.js';
import logoIcon from '../../../assets/icon.png';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState(null);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    let mounted = true;

    fetchAdminSettings()
      .then((data) => {
        if (mounted) setSettings(data || null);
      })
      .catch(() => {
        if (mounted) setSettings(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTicketsCount = async () => {
      try {
        const tickets = await fetchAdminTickets(100);
        if (!mounted) return;
        setPendingTicketsCount(
          Array.isArray(tickets)
            ? tickets.reduce((sum, ticket) => sum + Number(ticket.unreadForAdmin || 0), 0)
            : 0,
        );
      } catch {
        if (mounted) setPendingTicketsCount(0);
      }
    };

    loadTicketsCount();

    const handleRefresh = () => {
      loadTicketsCount();
    };

    window.addEventListener('support-tickets-updated', handleRefresh);
    const intervalId = window.setInterval(loadTicketsCount, 15000);

    return () => {
      mounted = false;
      window.removeEventListener('support-tickets-updated', handleRefresh);
      window.clearInterval(intervalId);
    };
  }, []);

  const adminName = getAdminDisplayName(settings);
  const adminSubtitle = getAdminSubtitle(settings);

  const mainItems = sidebarMenuItems.filter((item) => item.category === 'main');
  const additionalItems = sidebarMenuItems.filter((item) => item.category === 'additional');
  const settingsItems = sidebarMenuItems.filter((item) => item.category === 'settings');

  const MenuItem = ({ item }) => {
    const active = isActive(item.path);
    const showTicketBadge = item.label === 'Tickets';
    return (
      <Link
        to={item.path}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          active
            ? 'bg-white/15 text-white'
            : 'text-white/80 hover:bg-white/10'
        }`}
      >
        <span className="text-sm">{item.icon}</span>
        <span>{item.label}</span>
        {showTicketBadge && (
          <span className="ml-auto rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {pendingTicketsCount}
          </span>
        )}
      </Link>
    );
  };

  const SectionHeader = ({ label }) => (
    <p className="text-xs font-bold text-white/40 uppercase px-3 mb-2 tracking-wider">
      {label}
    </p>
  );

  return (
    <>
      {/* Dark Overlay - Backdrop Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative left-0 top-0 h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto transition-all duration-300 ease-in-out z-50 ${
          isOpen ? 'w-[260px] translate-x-0' : '-translate-x-full lg:w-0'
        }`}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>

        <div className="relative z-10 flex h-full flex-col">
          {/* Logo Section with Close Button */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 overflow-hidden shadow-lg">
                  <img src={logoIcon} alt="SMMSecure logo" className="h-full w-full object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin</h1>
              </div>

              {/* Close Button - 10% overlap */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute -right-[12px] top-4 flex h-9 w-9 items-center justify-center rounded border border-white/30 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-white/60 ml-12 font-medium">Management Panel</p>
          </div>

          {/* User Card */}
          <div className="mx-3 mt-3 rounded-xl bg-white/10 px-3 py-3 text-center border border-white/10 backdrop-blur">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto text-white font-bold text-lg shadow-lg">
              {adminName?.[0]?.toUpperCase() || 'A'}
            </div>
            <h2 className="mt-2 text-sm font-bold text-white tracking-wide">{adminName}</h2>
            <p className="text-xs text-white/60 mt-0.5">{adminSubtitle}</p>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex-1 px-2 pb-5 space-y-4">
            {/* Main Items */}
            <div>
              <SectionHeader label="Main" />
              <div className="space-y-1">
                {mainItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Additional Items */}
            <div>
              <SectionHeader label="Additional" />
              <div className="space-y-1">
                {additionalItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Settings Items */}
            <div>
              <SectionHeader label="Settings" />
              <div className="space-y-1">
                {settingsItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="px-2 pb-4 space-y-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{isDarkMode ? '🌙' : '☀️'}</span>
                <span className="text-xs font-semibold text-white">
                  {isDarkMode ? 'Dark' : 'Light'} Mode
                </span>
              </div>
            </button>

            {/* Manager Button */}
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95">
              <span>👤</span>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
