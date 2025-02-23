import React from 'react';
import type { Timeframe } from '@/lib/types';

interface TechnicalAnalysisProps {
  symbol: string;
  timeframe: Timeframe;
}

const TechnicalAnalysis = ({ symbol, timeframe }: TechnicalAnalysisProps) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Technical Analysis for {symbol}</h2>
      {/* Add your technical analysis content here */}
      <p>Technical analysis content for {timeframe} timeframe</p>
    </div>
  );
};

export default TechnicalAnalysis; 