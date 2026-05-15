import React, { useState } from "react";
import { NavLink } from "react-router";
import {
  FaShoppingCart,
  FaBoxes,
  FaHistory,
  FaLayerGroup,
  FaWallet,
  FaInbox,
  FaChartBar,
  FaRedo,
  FaMoneyBillWave,
  FaUsers,
  FaTachometerAlt,
  FaCode,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

import spaceBg from "../assets/space-slidebar-bg.jpg";
import demoAvatar from "../assets/userimage.png"; // add demo avatar image

const topItems = [
  { label: "New order", icon: <FaShoppingCart />, to: "/dashboard" },
  { label: "Mass order", icon: <FaBoxes />, to: "/dashboard" },
  { label: "Orders", icon: <FaHistory />, to: "/dashboard" },
  { label: "Services", icon: <FaLayerGroup />, to: "/dashboard" },
  { label: "Add funds", icon: <FaWallet />, to: "/dashboard/add-funds" },
  { label: "Support Box", icon: <FaInbox />, to: "/dashboard" },
  { label: "Recently Completed", icon: <FaChartBar />, to: "/dashboard" },
];

const moreItems = [
  { label: "Refill", icon: <FaRedo />, to: "/dashboard" },
  { 
    label: "Refunds", 
    icon: <FaMoneyBillWave />, 
    to: "/dashboard",
    children: [
      { label: "Pending", icon: <FaHistory />, to: "/dashboard/refunds/pending" },
      { label: "Completed", icon: <FaCheckCircle />, to: "/dashboard/refunds/completed" },
      { label: "Rejected", icon: <FaTimes />, to: "/dashboard/refunds/rejected" },
    ]
  },
  { label: "Affiliates", icon: <FaUsers />, to: "/dashboard" },
  { label: "Dashboard", icon: <FaTachometerAlt />, to: "/dashboard" },
  { label: "API", icon: <FaCode />, to: "/dashboard" },
  { label: "Child Pannel", icon: <FaCode />, to: "/dashboard" },
];

const DashboardSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-[260px] overflow-y-auto text-white transition-all duration-300 ${
          sidebarOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        }`}
        style={{
          backgroundImage: `url(${spaceBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#09091f]/85 backdrop-blur-sm"></div>

        <div className="relative z-10 flex h-full flex-col">
          {/* Logo with Close Button */}
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 text-2xl font-black">
                  S
                </div>

                <h1 className="text-2xl font-extrabold tracking-wide">
                  SMMGen
                </h1>
              </div>

              {/* Close Button - 10% overlap */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute -right-[12px] top-3 flex h-9 w-9 items-center justify-center rounded border border-white/30 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          {/* User Card */}
          <div className="mx-2 mt-2 rounded-2xl bg-[#2c2d48] px-3 py-2 text-center shadow-xl">
            <img
              src={demoAvatar}
              alt="User"
              className="mx-auto h-16 w-16 rounded-full border-3 border-white object-cover"
            />

            <div className="mx-auto mt-1 inline-block rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-white">
              ~ ৳10,189713
            </div>

            <h2 className="mt-1 text-sm font-bold tracking-wide">
              alauddin23105101415
            </h2>
          </div>

          {/* Menu */}
          <div className="mt-2 flex-1 px-2 pb-5">
            <nav className="space-y-0.5">
              {topItems.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                      item.label === "Add funds"
                        ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white"
                        : isActive
                        ? "bg-white/10"
                        : "hover:bg-white/10"
                    }`
                  }
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>

                  {item.label === "Support Box" && (
                    <span className="ml-auto rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      1
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* More Menu */}
            <div className="mt-2">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="flex w-full items-center justify-between rounded-lg bg-[#343552] px-3 py-2 text-left text-sm font-medium transition hover:bg-[#404164]"
              >
                <span>More Menu</span>

                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-xs">
                  {moreMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </button>

              {/* Dropdown Items */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  moreMenuOpen
                    ? "mt-1 max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-0.5">
                  {moreItems.map((item, index) => (
                    <div key={index}>
                      <NavLink
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {item.children && (
                          <span 
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedItem(expandedItem === index ? null : index);
                            }}
                            className="flex h-4 w-4 items-center justify-center text-xs"
                          >
                            {expandedItem === index ? <FaChevronUp /> : <FaChevronDown />}
                          </span>
                        )}
                      </NavLink>

                      {/* Child Items */}
                      {item.children && (
                        <div
                          className={`ml-4 overflow-hidden transition-all duration-300 ${
                            expandedItem === index
                              ? "mt-0.5 max-h-[300px] opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="space-y-0.5">
                            {item.children.map((child, childIndex) => (
                              <NavLink
                                key={childIndex}
                                to={child.to}
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                              >
                                <span className="text-sm">{child.icon}</span>
                                <span>{child.label}</span>
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay - Ensures clicks close sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ pointerEvents: 'auto' }}
        ></div>
      )}
    </>
  );
};

export default DashboardSidebar;