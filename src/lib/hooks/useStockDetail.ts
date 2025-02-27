import { useEffect, useState } from "react";
import { supabase } from "../supabase.client";
import type { WavePattern, StockPrice, Timeframe, WaveStatus, Stock } from "../types";

export function useStockDetail(
  symbol: string, 
  timeframe: string,
  waveStatus: WaveStatus | "all"
) {
  const [wavePattern, setWavePattern] = useState<WavePattern | null>(null);
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stockDetail, setStockDetail] = useState<Stock | null>(null);

  useEffect(() => {
    console.log('useStockDetail effect running for:', { symbol, timeframe, waveStatus });
    
    const fetchStockDetail = async () => {
      try {
        setLoading(true);
        
        // Fetch wave pattern for specific timeframe and wave status
        const { data: wavePatterns, error: waveError } = await supabase
          .from("wave_patterns")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe)
          .eq("status", waveStatus);

        if (waveError) throw waveError;

        // Fetch prices for the specific timeframe
        const { data: prices, error: pricesError } = await supabase
          .from("stock_prices")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe)
          .order("timestamp", { ascending: true });

        if (pricesError) throw pricesError;

        setStockDetail({
          symbol,
          timeframe,
          waveStatus,
          wavePattern: wavePatterns?.[0] || null, // Take first wave pattern if exists
          prices: prices || []
        });
        
      } catch (err) {
        console.error('Stock detail fetch error:', err);
        setError(err instanceof Error ? err : new Error("Failed to fetch stock detail"));
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetail();

    // Set up real-time subscriptions
    const waveSubscription = supabase
      .channel("wave_pattern_detail")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wave_patterns",
          filter: `symbol=eq.${symbol}`,
        },
        (payload) => {
          setWavePattern(payload.new as WavePattern);
        },
      )
      .subscribe();

    const priceSubscription = supabase
      .channel("stock_prices_detail")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stock_prices",
          filter: `symbol=eq.${symbol}`,
        },
        (payload) => {
          setPrices((current) => [payload.new as StockPrice, ...current]);
        },
      )
      .subscribe();

    return () => {
      waveSubscription.unsubscribe();
      priceSubscription.unsubscribe();
    };
  }, [symbol, timeframe, waveStatus]);

  return { stockDetail, loading, error };
}
