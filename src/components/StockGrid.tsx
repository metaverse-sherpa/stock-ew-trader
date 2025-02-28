import React from 'react';
import { Stock } from '../lib/types';
import MiniChart from './MiniChart';

interface StockGridProps {
  stocks: Stock[];
  onStockSelect: (symbol: string, historicalData: any[]) => void;
}

const StockGrid = ({ stocks = [], onStockSelect }: StockGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stocks.map((stock) => {
        const priceChangeColor = stock.priceChange >= 0 ? 'text-green-500' : 'text-red-500';
        
        // Ensure historical data is properly formatted
        const chartData = stock.historicalData.map((d) => ({
          time: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));

        return (
          <div
            key={stock.symbol}
            className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
            onClick={() => onStockSelect(stock.symbol, stock.historicalData)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{stock.name}</h3>
              <span className="text-sm text-gray-500">{stock.symbol}</span>
            </div>
            <div className="mt-2">
              <p className="text-lg font-semibold">${stock.currentPrice?.toFixed(2)}</p>
              <p className={`text-sm ${priceChangeColor}`}>
                {stock.priceChange?.toFixed(2)} ({stock.percentChange?.toFixed(2)}%)
              </p>
              <p className="text-sm text-gray-500">Open: ${stock.openPrice?.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                Timeframe: {stock.timeframe} | Wave: {stock.waveStatus}
              </p>
            </div>
            <div className="mt-2">
              <MiniChart data={chartData} height={80} width={200} timeframe={stock.timeframe} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StockGrid;
