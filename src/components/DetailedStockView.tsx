import React from 'react';
import { Button } from './ui/button';
import TradingViewChart from './TradingViewChart'; // Ensure this matches the export
import { Stock } from '../lib/types';

interface DetailedStockViewProps {
  stock: Stock;
  historicalData: Array<{ timestamp: string; open: number; high: number; low: number; close: number }>; // Accept historical data as a prop
  onClose: () => void;
}

const DetailedStockView: React.FC<DetailedStockViewProps> = ({ stock, historicalData, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">{stock.name} ({stock.symbol})</h2>
        <p>Current Price: ${stock.currentPrice?.toFixed(2)}</p>
        <p>Wave Status: {stock.waveStatus}</p>
        <p>Timeframe: {stock.timeframe}</p>

        <div className="mt-4">
          <TradingViewChart
            symbol={stock.symbol}
            timeframe={stock.timeframe}
            historicalData={historicalData} // Pass historical data as a prop
          />
        </div>

        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    </div>
  );
};

export default DetailedStockView; 