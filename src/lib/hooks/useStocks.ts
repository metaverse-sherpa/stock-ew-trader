import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe, WaveStatus } from "../types";

// Cache object to store data for each timeframe + waveStatus combination
const dataCache: Record<string, any> = {};

export function useStocks(
  selectedTimeframe: Timeframe,
  waveStatus: WaveStatus | "all" = "Wave 5 Bullish",
) {
  // Cache prices for mini charts
  const [priceCache, setPriceCache] = useState<Record<string, any[]>>({});

  // Only fetch the selected timeframe
  const timeframes: Timeframe[] = [selectedTimeframe];
  console.log("useStocks hook called with timeframe:", selectedTimeframe);
  const [stocks, setStocks] = useState<
    (Stock & { wavePattern: WavePattern | null; prices: any[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create a cache key from timeframe and waveStatus
  const cacheKey = useMemo(() => `${selectedTimeframe}-${waveStatus}`, [selectedTimeframe, waveStatus]);

  useEffect(() => {
    if (dataCache[cacheKey]) {
      setStocks(dataCache[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchStocks = async () => {
      try {
        // Get all wave pattern data, not just symbols
        const { data: wavePatterns, error: waveError } = await supabase
          .from("wave_patterns")
          .select("*") // Select all fields
          .eq("status", waveStatus)
          .in("timeframe", selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe]);

        if (waveError) throw waveError;

        const { data: stocks, error: stocksError } = await supabase
          .from("stocks")
          .select("*")
          .in("symbol", wavePatterns.map(wp => wp.symbol));

        if (stocksError) throw stocksError;

        const stocksWithPrices = await Promise.all(stocks.map(async (stock) => {
          const { data: prices, error: pricesError } = await supabase
            .from("stock_prices")
            .select("*")
            .eq("symbol", stock.symbol)
            .in("timeframe", selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe])
            .order("timestamp", { ascending: true });

          if (pricesError) {
            console.error(`Error fetching prices for ${stock.symbol}:`, pricesError);
            return { ...stock, prices: [] };
          }

          // Add console.log to debug the prices data
          console.log(`Prices for ${stock.symbol}:`, prices);

          return {
            ...stock,
            prices: prices || [],
            wavePattern: wavePatterns.find(wp => wp.symbol === stock.symbol)
          };
        }));

        dataCache[cacheKey] = stocksWithPrices;
        setStocks(stocksWithPrices);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch stocks"),
        );
        setLoading(false);
      }
    };

    fetchStocks();

    // Set up real-time subscription
    const subscription = supabase
      .channel("wave_patterns_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wave_patterns",
          filter: `timeframe=eq.${selectedTimeframe}${waveStatus !== "all" ? ` and status=eq.${waveStatus}` : ""}`,
        },
        (payload) => {
          // Update the stocks list when wave patterns change
          setStocks((current) => {
            const updated = [...current];
            const index = updated.findIndex(
              (s) => s.symbol === payload.new.symbol,
            );

            if (index >= 0) {
              updated[index] = {
                ...updated[index],
                wavePattern: payload.new as WavePattern,
              };
            }

            return updated;
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedTimeframe, waveStatus]);

  return { stocks, loading, error };
}
