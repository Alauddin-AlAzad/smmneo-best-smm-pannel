import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import userImage from "../assets/userimage.png";

// Ensure Font Awesome is in index.html:
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

const DEMO_AVATAR = userImage;

const DashboardTopbar = ({ sidebarOpen, setSidebarOpen, darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  return (
    <div
      className={`fixed top-0 z-30 lg:z-50 h-16 w-full border-b border-slate-200 bg-white transition-all duration-300 ${
        sidebarOpen ? "lg:left-[260px] lg:w-[calc(100%-260px)]" : "left-0 w-full"
      }`}
    >
      <div className="flex h-full items-center justify-between px-3 sm:px-4">

        {/* ── Left ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {!sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white">
                S
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-wide text-slate-900">SMMNEO</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400">Dashboard</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-1.5">

          {/* BDT static badge */}
          <span className="hidden sm:inline-flex items-center rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white select-none">
            BDT ৳
          </span>

          {/* Telegram */}
          <a
            href="https://t.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#229ED9] text-white text-base transition hover:bg-[#1e87c2]"
            aria-label="Telegram"
          >
            <i className="fab fa-telegram" />
          </a>

          {/* Dark mode */}
          <button
            onClick={() => setDarkMode?.((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-white text-base transition hover:bg-slate-700"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <i className="fas fa-sun" />
            ) : (
              <i className="fas fa-moon" />
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex h-9 w-9 overflow-hidden rounded-full border-2 border-violet-400 transition hover:border-violet-600"
              aria-label="Profile menu"
            >
              <img src={DEMO_AVATAR} alt="avatar" className="h-full w-full object-cover" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-11 z-50 w-52 bg-white shadow-md"
                style={{ border: "1px solid #d1d5db", borderRadius: "3px" }}
              >
                {/* User info header */}
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ borderBottom: "1px solid #d1d5db" }}
                >
                  <img
                    src={DEMO_AVATAR}
                    alt="avatar"
                    className="h-9 w-9 flex-shrink-0 rounded-full border border-violet-300 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800 leading-snug">
                      {user?.displayName || user?.email || "User"}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug">৳ 851.11</p>
                  </div>
                </div>

                {/* Menu links */}
                <div className="py-0.5">
                  <NavLink
                    to="/dashboard/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <i className="fas fa-circle-user text-slate-400 text-xs w-3.5" />
                    Account
                  </NavLink>

                  <NavLink
                    to="/dashboard/add-fund"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <i className="fas fa-credit-card text-slate-400 text-xs w-3.5" />
                    Add Fund
                  </NavLink>

                  <NavLink
                    to="/dashboard/terms"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <i className="fas fa-file-lines text-slate-400 text-xs w-3.5" />
                    Terms &amp; Conditions
                  </NavLink>

                  <div style={{ borderTop: "1px solid #d1d5db" }} className="mt-0.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium text-red-500 hover:bg-slate-50 transition-colors"
                    >
                      <i className="fas fa-right-from-bracket text-xs w-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTopbar;