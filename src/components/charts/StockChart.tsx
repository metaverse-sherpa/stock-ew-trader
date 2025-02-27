import React from 'react';
import type { Timeframe } from '@/lib/types';

interface StockChartProps {
  symbol: string;
  timeframe: Timeframe;
  showVolume?: boolean;
  height?: string;
}

const StockChart = ({ symbol, timeframe, showVolume = false, height = '400px' }: StockChartProps) => {
  return (
    <div style={{ height }}>
      <h2 className="text-xl font-semibold mb-4">{symbol} Chart</h2>
      {/* Add your charting library implementation here */}
      <p>Chart for {timeframe} timeframe</p>
      {showVolume && <p>Volume indicator</p>}
    </div>
  );
};

export default StockChart; 