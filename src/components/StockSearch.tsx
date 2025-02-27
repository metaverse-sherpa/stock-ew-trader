import React, { useState } from 'react';
import { fetchStockData } from '../lib/api';
import StockInfo from './StockInfo';

function StockSearch() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);

  const handleSearch = async () => {
    const data = await fetchStockData(symbol);
    setStockData(data);
  };

  return (
    <div>
      <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      {stockData && <StockInfo data={stockData} />}
    </div>
  );
}

export default StockSearch; 