import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

const DashboardLayout = ({ children, pageTitle = 'Dashboard' }) => {
  // Sidebar starts visible on desktop, hidden on mobile
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

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
