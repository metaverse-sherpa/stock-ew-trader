import React from 'react';
import { Stock } from '../lib/types';

interface StockGridProps {
  stocks: Stock[];
  onStockSelect: (symbol: string) => void;
}

const StockGrid: React.FC<StockGridProps> = ({ stocks, onStockSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stocks.map((stock) => (
        <div
          key={stock.symbol}
          className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
          onClick={() => onStockSelect(stock.symbol)}
        >
          <h3 className="font-bold">{stock.symbol}</h3>
          <p>{stock.name}</p>
          <p>Wave Status: {stock.waveStatus}</p>
        </div>
      ))}
    </div>
  );
};

export default StockGrid;
