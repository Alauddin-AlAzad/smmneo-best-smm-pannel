import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import { FaBars, FaTimes } from "react-icons/fa";
import logoIcon from "../assets/icon.png";

const navItems = [
  { label: "New order", to: "/dashboard" },
  { label: "Mass order", to: "/dashboard" },
  { label: "Orders", to: "/dashboard" },
  { label: "Services", to: "/dashboard/services" },
  { label: "Add funds", to: "/dashboard" },
  { label: "Support Box", to: "/dashboard" },
  { label: "Recently Completed", to: "/dashboard" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      setProfileOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Close profile menu on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ========================================================= */}
      {/* 📱 MOBILE NAVBAR                                           */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Side - Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 overflow-hidden">
              <img src={logoIcon} alt="SMMSecure logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-lg font-bold text-slate-900">SMMSecure</span>
          </Link>

          {/* Right Side - Hamburger Menu */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {dropdownOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Expandable Dropdown Menu */}
        <div
          className={`overflow-hidden bg-white border-t border-slate-200 transition-all duration-300 ease-in-out ${
            dropdownOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Authenticated Links */}
            {user && (
              <div className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}

            {/* Public Links */}
            {!user && (
              <div className="space-y-1">
                <NavLink
                  to="/blog"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Blog
                </NavLink>
                <NavLink
                  to="/about"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  About Us
                </NavLink>
                <NavLink
                  to="/contact"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Contact Us
                </NavLink>
                
                {/* 100% FIXED WEB-APP ROUTING FOR MOBILE */}
                {/* <a
                  href="https://web.telegram.org/k/#@smmsecure_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  📱 Telegram Support
                </a> */}
              </div>
            )}

            {/* Auth Buttons */}
            {!user && (
              <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
                <NavLink
                  to="/"
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className="block rounded-lg bg-violet-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-violet-500"
                  onClick={() => setDropdownOpen(false)}
                >
                  Sign Up
                </NavLink>
              </div>
            )}

            {/* User Details */}
            {user && (
              <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
                <button className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500">
                  BDT ৳
                </button>
                <NavLink
                  to="/dashboard"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 Account
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  💳 Add Fund
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-slate-100"
                >
                  ↩ Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 💻 DESKTOP NAVBAR                                          */}
      {/* ========================================================= */}
      <header className="hidden lg:block sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 overflow-hidden">
              <img src={logoIcon} alt="SMMSecure logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold text-slate-900">SMMSecure</span>
          </Link>

          {/* Nav Items */}
          <div className="ml-auto flex items-center gap-6">
            {!user && (
              <div className="flex items-center gap-6">
                <NavLink to="/blog" className="text-sm font-medium text-slate-700 transition hover:text-violet-700">
                  Blog
                </NavLink>
                <NavLink to="/about" className="text-sm font-medium text-slate-700 transition hover:text-violet-700">
                  About Us
                </NavLink>
                <NavLink to="/contact" className="text-sm font-medium text-slate-700 transition hover:text-violet-700">
                  Contact Us
                </NavLink>
                
                {/* 100% FIXED WEB-APP ROUTING FOR DESKTOP */}
                {/* <a
                  href="https://web.telegram.org/k/#@smmsecure_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-700 transition hover:text-violet-700 flex items-center gap-1"
                >
                  📱 Telegram Support
                </a> */}
              </div>
            )}

            {/* Dashboard Actions */}
            {user ? (
              <>
                <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500">
                  BDT ৳
                </button>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileOpen((prev) => !prev);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="text-sm font-semibold uppercase">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-xs text-slate-500">Logged in as</p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-900 truncate">
                          {user.displayName || user.email}
                        </h3>
                      </div>

                      <div className="space-y-1 px-2 py-2">
                        <Link
                          to="/dashboard"
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          👤 Account
                        </Link>
                        <Link
                          to="/dashboard"
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          💳 Add Fund
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-slate-100"
                        >
                          ↩ Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink
                  to="/"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;