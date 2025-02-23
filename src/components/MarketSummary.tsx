import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MarketSummary = () => {
  return (
    <div className="flex gap-4 items-center p-2 rounded-lg bg-card">
      <div className="market-index">
        <span className="text-sm font-medium">S&P 500</span>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold">4,783.45</span>
          <span className="text-green-500 flex items-center text-sm">
            <ArrowUpRight className="h-4 w-4" />
            1.2%
          </span>
        </div>
      </div>
      <div className="border-r h-8" />
      <div className="market-index">
        <span className="text-sm font-medium">NASDAQ</span>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold">15,003.22</span>
          <span className="text-green-500 flex items-center text-sm">
            <ArrowUpRight className="h-4 w-4" />
            1.5%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketSummary; 