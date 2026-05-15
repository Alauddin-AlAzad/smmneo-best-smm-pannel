import React from 'react';
import StatsCard from './StatsCard.jsx';

const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <StatsCard
          key={stat.id}
          title={stat.title}
          count={stat.count}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
          trendUp={stat.trendUp}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
