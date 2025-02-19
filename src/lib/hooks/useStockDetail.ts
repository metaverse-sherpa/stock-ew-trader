import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { WavePattern, StockPrice, Timeframe } from "../types";

export function useStockDetail(symbol: string, timeframe: Timeframe) {
  const [wavePattern, setWavePattern] = useState<WavePattern | null>(null);
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("useStockDetail effect running for:", { symbol, timeframe });
    const fetchStockDetail = async () => {
      try {
        // Fetch wave pattern
        const { data: patternData, error: patternError } = await supabase
          .from("wave_patterns")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe)
          .single();

        // Don't throw on pattern error, just set pattern to null
        if (patternError) {
          console.warn("No wave pattern found:", patternError);
        }

        // Fetch historical prices
        console.log("Fetching prices with params:", { symbol, timeframe });
        const { data: priceData, error: priceError } = await supabase
          .from("stock_prices")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe)
          .order("timestamp", { ascending: true });

        if (!priceData?.length) {
          console.warn("No price data found for:", { symbol, timeframe });
        }

        console.log("Fetched price data:", {
          symbol,
          timeframe,
          priceData,
          priceError,
        });

        if (priceError) throw priceError;

        // Set wave pattern (might be null if not found)
        setWavePattern(patternData || null);
        // Always set prices if we have them
        setPrices(priceData || []);
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
