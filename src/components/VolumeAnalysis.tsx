import React from 'react';
import type { Timeframe } from '@/lib/types';

interface VolumeAnalysisProps {
  symbol: string;
  timeframe: Timeframe;
}

const VolumeAnalysis = ({ symbol, timeframe }: VolumeAnalysisProps) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Volume Analysis for {symbol}</h2>
      {/* Add your volume analysis content here */}
      <p>Volume profile for {timeframe} timeframe</p>
    </div>
  );
};

export default VolumeAnalysis; 