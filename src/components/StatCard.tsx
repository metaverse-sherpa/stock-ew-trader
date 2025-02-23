import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

const StatCard = ({ title, value, change, isPositive }: StatCardProps) => {
  return (
    <div className="p-4 rounded-lg bg-card border">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {change && (
          <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard; 