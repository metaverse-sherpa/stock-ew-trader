import { useState } from 'react';
import { fetchStockData } from '../lib/api';

export function useStockData() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStockData = async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const stockData = await fetchStockData(symbol);
      setData(stockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, getStockData };
} 