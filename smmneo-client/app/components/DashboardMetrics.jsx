import React from "react";
import { useAuth } from "./AuthContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import userDetails from "../assets/user_details.png";
import userBalance from "../assets/user_balance.png";
import userSpend from "../assets/user_spend.png";
import orders from "../assets/orders.png";
import { getDisplayName } from "../utils/userDisplayName.js";

const DashboardMetrics = () => {
  const { user } = useAuth();
  const { balanceUSD } = useAuth();
  const { currency, formatCurrency } = useCurrency();

  const metrics = [
    { label: "Balance", value: `≈ ${formatCurrency(balanceUSD || 0, currency)}`, img: userBalance },
    { label: "Total Spend", value: "≈ ৳0.00", img: userSpend },
    { label: "Your Orders", value: "0", img: orders },
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
              {getDisplayName(user)}
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