import { useState, useEffect } from 'react';
import { supabase } from '../supabase.client';

interface StockData {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  timeframe: string;
  status: string;
  historicalData: { date: string; price: number }[];
}

export function useStockData() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (timeframe: string, status: string) => {
    try {
      const { data: wavePatterns, error: waveError } = await supabase
        .from('wave_patterns')
        .select('symbol, timeframe, status, wave1_start_time')
        .eq('timeframe', timeframe)
        .eq('status', status);

      if (waveError) throw waveError;

      const symbols = wavePatterns.map((wp: { symbol: string }) => wp.symbol);

      const { data: stocks, error: stockError } = await supabase
        .from('stocks')
        .select('symbol, name, exchange, sector, industry')
        .in('symbol', symbols);

      if (stockError) throw stockError;

      const stockData = await Promise.all(
        stocks.map(async (stock: { symbol: string }) => {
          const { data: prices, error: priceError } = await supabase
            .from('stock_prices')
            .select('timestamp, close')
            .eq('symbol', stock.symbol)
            .gte('timestamp', wavePatterns.find((wp: { symbol: string }) => wp.symbol === stock.symbol)?.wave1_start_time)
            .order('timestamp', { ascending: true });

          if (priceError) throw priceError;

          return {
            ...stock,
            timeframe,
            status,
            historicalData: prices.map((p: { timestamp: string; close: number }) => ({ date: p.timestamp, price: p.close })),
          };
        })
      );

      setData(stockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
} 