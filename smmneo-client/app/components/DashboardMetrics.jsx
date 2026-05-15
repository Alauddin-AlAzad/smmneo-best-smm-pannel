import React from "react";
import { useAuth } from "./AuthContext.jsx";
import userDetails from "../assets/user_details.png";
import userBalance from "../assets/user_balance.png";
import userSpend from "../assets/user_spend.png";
import orders from "../assets/orders.png";

const DashboardMetrics = () => {
  const { user } = useAuth();

  // Get username based on auth method
  const getUsername = () => {
    if (!user) return "";
    
    // Check if user logged in via Google
    const isGoogleLogin = user.providerData?.some(
      (provider) => provider.providerId === "google.com"
    );

    if (isGoogleLogin && user.email) {
      // Extract username before @ for Google login
      return user.email.split("@")[0];
    }
    
    // For email/password login, show displayName or email
    return user.displayName || user.email;
  };

  const metrics = [
    { label: "Balance", value: "≈ ৳910.189713", img: userBalance },
    { label: "Total Spend", value: "≈ ৳5197.8965638", img: userSpend },
    { label: "Your Orders", value: "77", img: orders },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-4">
      {/* Username Card */}
      <div className="border border-slate-200/70 bg-white/95 p-[10px] text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <img
            src={userDetails}
            alt="User"
            className="w-10 h-10 border border-gray-300 rounded"
          />
          <div>
            <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900 leading-tight">
              {getUsername()}
            </h3>
            <p className="text-[14px] md:text-[16px] text-slate-500">Username</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="border border-slate-200/70 bg-white/95 p-[10px] text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-center gap-3">
            <img
              src={metric.img}
              alt={metric.label}
              className="w-10 h-10 border border-gray-300 rounded"
            />
            <div>
              <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900 leading-tight">
                {metric.value}
              </h3>
              <p className="text-[14px] md:text-[16px] text-slate-500">{metric.label}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default DashboardMetrics;