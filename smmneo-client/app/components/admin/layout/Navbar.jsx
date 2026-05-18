import React, { useEffect, useState } from 'react';
import { fetchAdminSettings } from '../../../services/adminDashboardAPI.js';
import { getAdminDisplayName, getAdminSubtitle } from '../../../utils/adminProfile.js';

const Navbar = ({ pageTitle, isOpen, setIsOpen }) => {
  const [settings, setSettings] = useState(null);

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

  const adminName = getAdminDisplayName(settings);
  const adminSubtitle = getAdminSubtitle(settings);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <h2 className="text-lg font-bold text-slate-900 hidden sm:block">{pageTitle}</h2>
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-80 hover:border-violet-300 transition-colors focus-within:ring-2 focus-within:ring-violet-100">
            <span className="text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent ml-2 outline-none text-sm w-full text-slate-900 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Right Section - Profile & Actions */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 group">
          <div className="text-right hidden sm:block cursor-pointer">
            <p className="text-sm font-semibold text-slate-900">{adminName}</p>
            <p className="text-xs text-slate-500">{adminSubtitle}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer">
            {adminName?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
