import { Navigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../components/AuthContext.jsx";
import DashboardTopbar from "../components/DashboardTopbar.jsx";
import DashboardSidebar from "../components/DashboardSidebar.jsx";
import DashboardMetrics from "../components/DashboardMetrics.jsx";
import DashboardCategoryTabs from "../components/DashboardCategoryTabs.jsx";
import DashboardOrderPanel from "../components/DashboardOrderPanel.jsx";
import DashboardServices from "../components/DashboardServices.jsx";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Everything");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? "dashboard-sidebar-open" : "dashboard-sidebar-closed"}`}>
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`dashboard-main min-w-0 px-[10px] py-6 pt-[96px] transition-all duration-300 ${sidebarOpen ? "lg:ml-[260px] lg:w-[calc(100%-260px)]" : "lg:ml-0 lg:w-full"}`}>
        <DashboardMetrics />
        <DashboardCategoryTabs onCategoryChange={setSelectedCategory} />
        <DashboardOrderPanel selectedCategory={selectedCategory} />
        <DashboardServices />
      </main>
    </div>
  );
};

export default Dashboard;
