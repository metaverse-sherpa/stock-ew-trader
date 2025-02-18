import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { WavePattern, StockPrice, Timeframe } from "../types";

export function useStockDetail(symbol: string, timeframe: Timeframe) {
  const [wavePattern, setWavePattern] = useState<WavePattern | null>(null);
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStockDetail = async () => {
      try {
        // Fetch wave pattern
        const { data: patternData, error: patternError } = await supabase
          .from("wave_patterns")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe)
          .single();

        if (patternError) throw patternError;

        // Fetch historical prices
        const { data: priceData, error: priceError } = await supabase
          .from("stock_prices")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe)
          .order("timestamp", { ascending: false })
          .limit(1000);

        if (priceError) throw priceError;

        setWavePattern(patternData);
        setPrices(priceData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch stock detail"),
        );
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
  }, [symbol, timeframe]);

  return { wavePattern, prices, loading, error };
}
