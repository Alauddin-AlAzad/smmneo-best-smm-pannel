import React from 'react';

const StatsCard = ({ title, count, icon, color, trend, trendUp }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-600 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{count}</h3>
        </div>
        <div className={`${color} rounded-lg p-3 text-xl`}>{icon}</div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1">
        <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
        <span className="text-xs text-slate-500">from last month</span>
      </div>
    </div>
  );
};

export default StatsCard;
