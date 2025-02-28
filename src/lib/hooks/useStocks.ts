import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe, WaveStatus } from "../types";
import { globalCache } from "../cache";

export function useStocks(
  selectedTimeframe: Timeframe,
  waveStatus: WaveStatus | "all" = "Wave 5 Bullish",
) {
  // Use global cache for prices to persist between renders
  const [priceCache, setPriceCache] = useState<Record<string, any[]>>(() => {
    const cachedPrices = {};
    // Pre-populate from global cache if available
    for (const key of Object.keys(globalCache.getAll() || {})) {
      if (key.includes("_prices_")) {
        cachedPrices[key.replace("_prices_", "")] = globalCache.get(key);
      }
    }
    return cachedPrices;
  });

  // Only fetch the selected timeframe
  const timeframes: Timeframe[] = [selectedTimeframe];
  // Remove unnecessary console.log
  const [stocks, setStocks] = useState<
    (Stock & { wavePattern: WavePattern | null; prices: any[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Remove unnecessary console.log
    const fetchStocks = async () => {
      // Check cache first
      const cacheKey = `stocks_${selectedTimeframe}_${waveStatus}`;
      const cachedData =
        globalCache.get<
          (Stock & { wavePattern: WavePattern | null; prices: any[] })[]
        >(cacheKey);

      if (cachedData) {
        console.log("Using cached stock data");
        setStocks(cachedData);
        setLoading(false);
        return;
      }
      try {
        // First get wave patterns with stocks
        // Fetch wave patterns for all timeframes
        // First get all stocks
        const { data: stocks, error: stocksError } = await supabase
          .from("stocks")
          .select("*");

        if (stocksError) throw stocksError;
        if (!stocks?.length) {
          setStocks([]);
          return;
        }

        // Get all wave patterns for the selected timeframe
        const { data: wavePatterns, error: waveError } = await supabase
          .from("wave_patterns")
          .select("*")
          .in("timeframe", timeframes)
          .order("confidence", { ascending: false });

        if (waveError) throw waveError;
        if (!wavePatterns?.length) {
          setStocks([]);
          return;
        }

        // Create a map of stocks for easy lookup
        const stocksMap = Object.fromEntries(
          stocks.map((stock) => [stock.symbol, stock]),
        );

        // Create a map to store prices for each symbol
        const stockPrices = {};

        // Get unique symbols from wave patterns to reduce database queries
        const uniqueSymbols = [
          ...new Set(wavePatterns.map((pattern) => pattern.symbol)),
        ];

        // Fetch prices for all symbols in parallel instead of sequentially
        await Promise.all(
          uniqueSymbols.map(async (symbol) => {
            const cacheKey = `${symbol}_${selectedTimeframe}`;

            // Use cached data if available
            if (priceCache[cacheKey]) {
              stockPrices[symbol] = priceCache[cacheKey];
              return; // Use return instead of continue in async callback
            }

            const { data, error } = await supabase
              .from("stock_prices")
              .select()
              .eq("symbol", symbol)
              .eq("timeframe", selectedTimeframe)
              .order("timestamp", { ascending: true })
              .limit(100);

            if (error) throw error;

            const prices =
              data?.map((price) => ({
                ...price,
                timeframe: price.timeframe,
              })) || [];

            // Update both local and global cache
            setPriceCache((prev) => ({
              ...prev,
              [cacheKey]: prices,
            }));

            // Store in global cache with a specific prefix
            globalCache.set(`_prices_${cacheKey}`, prices);

            stockPrices[symbol] = prices;
          }),
        );

        // stockPrices is now populated from the batch queries above

        // Transform the data
        // Group patterns by symbol
        const patternsBySymbol = wavePatterns.reduce(
          (acc, pattern) => {
            if (!acc[pattern.symbol]) {
              acc[pattern.symbol] = {};
            }
            acc[pattern.symbol][pattern.timeframe] = pattern;
            return acc;
          },
          {} as Record<string, Record<Timeframe, any>>,
        );

        // For specific wave status, get the most recent pattern for each stock
        let stocksWithPatterns = [];

        if (waveStatus === "all") {
          // For "all" waves, get the most recent pattern for each wave status for each stock
          // Group by symbol and status
          const patternsBySymbolAndStatus = {};

          wavePatterns.forEach((pattern) => {
            const key = `${pattern.symbol}_${pattern.status}`;
            if (
              !patternsBySymbolAndStatus[key] ||
              new Date(pattern.wave1_start_time) >
                new Date(patternsBySymbolAndStatus[key].wave1_start_time)
            ) {
              patternsBySymbolAndStatus[key] = pattern;
            }
          });

          // Convert to array
          stocksWithPatterns = Object.values(patternsBySymbolAndStatus).map(
            (pattern) => ({
              symbol: pattern.symbol,
              exchange: stocksMap[pattern.symbol]?.exchange || "NYSE",
              name: stocksMap[pattern.symbol]?.name || pattern.symbol,
              created_at: stocksMap[pattern.symbol]?.created_at,
              updated_at: stocksMap[pattern.symbol]?.updated_at,
              wavePattern: pattern,
              prices: stockPrices[pattern.symbol] || [],
              wave1StartTime: pattern?.wave1_start_time
                ? new Date(pattern.wave1_start_time).getTime()
                : 0,
            }),
          );
        } else {
          // For specific wave status, get the most recent pattern for each stock
          const patternsBySymbol = {};

          wavePatterns
            .filter((pattern) => pattern.status === waveStatus)
            .forEach((pattern) => {
              if (
                !patternsBySymbol[pattern.symbol] ||
                new Date(pattern.wave1_start_time) >
                  new Date(patternsBySymbol[pattern.symbol].wave1_start_time)
              ) {
                patternsBySymbol[pattern.symbol] = pattern;
              }
            });

          // Convert to array
          stocksWithPatterns = Object.values(patternsBySymbol).map(
            (pattern) => ({
              symbol: pattern.symbol,
              exchange: stocksMap[pattern.symbol]?.exchange || "NYSE",
              name: stocksMap[pattern.symbol]?.name || pattern.symbol,
              created_at: stocksMap[pattern.symbol]?.created_at,
              updated_at: stocksMap[pattern.symbol]?.updated_at,
              wavePattern: pattern,
              prices: stockPrices[pattern.symbol] || [],
              wave1StartTime: pattern?.wave1_start_time
                ? new Date(pattern.wave1_start_time).getTime()
                : 0,
            }),
          );
        }

        // Sort by wave1_start_time desc (most recent first)
        stocksWithPatterns.sort((a, b) => b.wave1StartTime - a.wave1StartTime);

        // Store in cache
        globalCache.set(cacheKey, stocksWithPatterns);
        setStocks(stocksWithPatterns);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch stocks"),
        );
      } finally {
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
          filter: `timeframe=eq.${selectedTimeframe}`,
        },
        (payload) => {
          // Update the stocks list when wave patterns change
          setStocks((current) => {
            const updated = [...current];
            const index = updated.findIndex(
              (s) => s.symbol === payload.new.symbol,
            );

            // Only update if the status matches our filter
            if (
              index >= 0 &&
              (waveStatus === "all" || payload.new.status === waveStatus)
            ) {
              updated[index] = {
                ...updated[index],
                wavePattern: payload.new as WavePattern,
              };
            } else if (waveStatus === payload.new.status) {
              // This is a new stock that matches our filter, we should refresh the data
              // Clear cache to force a refresh on next render
              const cacheKey = `stocks_${selectedTimeframe}_${waveStatus}`;
              globalCache.delete(cacheKey);
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
