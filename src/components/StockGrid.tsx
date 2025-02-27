import React from 'react';
import { Stock } from '../lib/types';

interface StockGridProps {
  stocks: Array<{
    symbol: string;
    name: string;
    price: number;
    // Add other properties as needed
  }>;
  onStockSelect: (symbol: string) => void;
}

const StockGrid = ({ stocks = [], onStockSelect }: StockGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stocks.map((stock) => (
        <div
          key={stock.symbol}
          className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
          onClick={() => onStockSelect(stock.symbol)}
        >
          <h3 className="font-bold">{stock.name}</h3>
          <p>Price: {stock.price}</p>
        </div>
      ))}
    </div>
  );
};

export default StockGrid;
