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
        // Get wave patterns for each timeframe
        const query = supabase
          .from("wave_patterns")
          .select("*")
          // Only query specific timeframe unless "all" is selected
          .in("timeframe", selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe]);

        // Only add the status filter if not "all"
        if (waveStatus !== "all") {
          query.eq("status", waveStatus);
        }

        const { data: wavePatterns, error: waveError } = await query;

        if (waveError) throw waveError;

        // Get unique symbols from wave patterns
        const symbols = [...new Set(wavePatterns.map(wp => wp.symbol))];

        // If no wave patterns found and waveStatus is "all", fetch all stocks for the timeframe
        if (symbols.length === 0 && waveStatus === "all") {
          const { data: allWavePatterns, error: allWaveError } = await supabase
            .from("wave_patterns")
            .select("*")
            .in("timeframe", selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe]);

          if (allWaveError) throw allWaveError;
          symbols.push(...new Set(allWavePatterns.map(wp => wp.symbol)));
          wavePatterns.push(...allWavePatterns);
        }

        // Fetch all stocks data for these symbols
        const { data: stocks, error: stocksError } = await supabase
          .from("stocks")
          .select("*")
          .in("symbol", symbols);

        if (stocksError) throw stocksError;

        // For each wave pattern, fetch its corresponding price data
        const stocksWithPrices = await Promise.all(
          wavePatterns.map(async (pattern) => {
            const stock = stocks.find(s => s.symbol === pattern.symbol);
            if (!stock) return null;

            // Fetch prices for this specific symbol and timeframe
            const { data: prices, error: pricesError } = await supabase
              .from("stock_prices")
              .select("*")
              .eq("symbol", pattern.symbol)
              .eq("timeframe", pattern.timeframe)
              .order("timestamp", { ascending: true });

            if (pricesError) throw pricesError;

            return {
              ...stock,
              symbol: pattern.symbol,
              prices: prices?.map(price => ({
                ...price,
                timeframe: pattern.timeframe
              })) || [],
              wavePattern: pattern
            };
          })
        );

        // Filter out any null values and ensure unique combinations
        const validStocksWithPrices = stocksWithPrices
          .filter(Boolean)
          // Remove duplicates based on symbol + timeframe + status combination
          .filter((stock, index, self) => {
            const key = `${stock.symbol}-${stock.wavePattern?.timeframe}-${stock.wavePattern?.status}`;
            return index === self.findIndex(s => 
              `${s.symbol}-${s.wavePattern?.timeframe}-${s.wavePattern?.status}` === key
            );
          });

        dataCache[cacheKey] = validStocksWithPrices;
        setStocks(validStocksWithPrices);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch stocks"));
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
