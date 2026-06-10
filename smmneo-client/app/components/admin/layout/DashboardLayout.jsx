import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getStoredAdminAccessToken } from '../../../services/adminSecureAPI.js';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

const DashboardLayout = ({ children, pageTitle = 'Dashboard' }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getStoredAdminAccessToken();
    if (!token) {
      navigate('/smmsecure/admin/login', { replace: true });
      return;
    }
    setAuthChecked(true);
  }, [navigate]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Fixed positioning, overlays on mobile */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar
          pageTitle={pageTitle}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-auto px-4 md:px-6 lg:px-8 py-6 pt-16">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
