import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe, WaveStatus } from "../types";
import { globalCache } from "../cache";
import { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';

const INITIAL_BATCH_SIZE = 10;
const SUBSEQUENT_BATCH_SIZE = 20;

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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchStocksProgressively = useCallback(async (pageNumber: number) => {
    const cacheKey = `stocks_${selectedTimeframe}_${waveStatus}_${pageNumber}`;
    const cachedData = globalCache.get<(Stock & { wavePattern: WavePattern | null; prices: any[] })[]>(cacheKey);

    if (cachedData) {
      setStocks(prev => [...prev, ...cachedData]);
      setLoading(false);
      return;
    }

    try {
      // Calculate offset based on page number
      const offset = pageNumber * (pageNumber === 0 ? INITIAL_BATCH_SIZE : SUBSEQUENT_BATCH_SIZE);
      const limit = pageNumber === 0 ? INITIAL_BATCH_SIZE : SUBSEQUENT_BATCH_SIZE;

      // First get stocks with pagination
      const { data: stocksData, error: stocksError } = await supabase
        .from("stocks")
        .select("*")
        .range(offset, offset + limit - 1);

      if (stocksError) throw stocksError;
      if (!stocksData?.length) {
        setHasMore(false);
        return;
      }

      // Get wave patterns for these stocks
      const { data: wavePatterns, error: waveError } = await supabase
        .from("wave_patterns")
        .select("*")
        .in("symbol", stocksData.map(s => s.symbol))
        .eq("timeframe", selectedTimeframe)
        .order("confidence", { ascending: false });

      if (waveError) throw waveError;

      // Create a map of stocks for easy lookup
      const stocksMap = Object.fromEntries(
        stocksData.map((stock) => [stock.symbol, stock])
      );

      // Create a map to store prices for each symbol
      const stockPrices: Record<string, any[]> = {};

      // Fetch prices for all symbols in parallel
      await Promise.all(
        stocksData.map(async (stock) => {
          const cacheKey = `${stock.symbol}_${selectedTimeframe}`;

          if (priceCache[cacheKey]) {
            stockPrices[stock.symbol] = priceCache[cacheKey];
            return;
          }

          const { data, error } = await supabase
            .from("stock_prices")
            .select()
            .eq("symbol", stock.symbol)
            .eq("timeframe", selectedTimeframe)
            .order("timestamp", { ascending: true })
            .limit(100);

          if (error) throw error;

          const prices = data?.map((price) => ({
            ...price,
            timeframe: price.timeframe,
          })) || [];

          setPriceCache(prev => ({
            ...prev,
            [cacheKey]: prices,
          }));

          globalCache.set(`_prices_${cacheKey}`, prices);
          stockPrices[stock.symbol] = prices;
        })
      );

      // Transform the data
      const patternsBySymbol = wavePatterns?.reduce(
        (acc, pattern) => {
          if (!acc[pattern.symbol]) {
            acc[pattern.symbol] = {};
          }
          acc[pattern.symbol][pattern.timeframe] = pattern;
          return acc;
        },
        {} as Record<string, Record<Timeframe, any>>
      );

      let stocksWithPatterns = [];

      if (waveStatus === "all") {
        // For "all" waves, get the most recent pattern for each wave status
        const patternsBySymbolAndStatus: Record<string, WavePattern> = {};

        wavePatterns?.forEach((pattern) => {
          const key = `${pattern.symbol}_${pattern.status}`;
          if (
            !patternsBySymbolAndStatus[key] ||
            new Date(pattern.wave1_start_time) >
              new Date(patternsBySymbolAndStatus[key].wave1_start_time)
          ) {
            patternsBySymbolAndStatus[key] = pattern;
          }
        });

        stocksWithPatterns = Object.values(patternsBySymbolAndStatus)
          .filter(pattern => stocksMap[pattern.symbol])
          .map((pattern) => ({
            ...stocksMap[pattern.symbol],
            wavePattern: pattern,
            prices: stockPrices[pattern.symbol] || [],
            wave1StartTime: pattern?.wave1_start_time
              ? new Date(pattern.wave1_start_time).getTime()
              : 0,
          }));
      } else {
        // For specific wave status
        stocksWithPatterns = stocksData
          .map(stock => {
            const pattern = patternsBySymbol?.[stock.symbol]?.[selectedTimeframe];
            if (!pattern || pattern.status !== waveStatus) return null;
            
            return {
              ...stock,
              wavePattern: pattern,
              prices: stockPrices[stock.symbol] || [],
              wave1StartTime: pattern?.wave1_start_time
                ? new Date(pattern.wave1_start_time).getTime()
                : 0,
            };
          })
          .filter(Boolean);
      }

      // Sort by wave1_start_time desc (most recent first)
      stocksWithPatterns.sort((a, b) => b.wave1StartTime - a.wave1StartTime);

      // Store in cache
      globalCache.set(cacheKey, stocksWithPatterns);
      
      // Update state
      setStocks(prev => [...prev, ...stocksWithPatterns]);
      setHasMore(stocksWithPatterns.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch stocks"));
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe, waveStatus, priceCache]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    // Reset state when timeframe or wave status changes
    setStocks([]);
    setPage(0);
    setHasMore(true);
    fetchStocksProgressively(0);
  }, [selectedTimeframe, waveStatus, fetchStocksProgressively]);

  useEffect(() => {
    if (page > 0) {
      fetchStocksProgressively(page);
    }
  }, [page, fetchStocksProgressively]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel("wave_patterns_changes")
      .on<RealtimePostgresChangesPayload<WavePattern>>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: "*",
          schema: "public",
          table: "wave_patterns",
          filter: `timeframe=eq.${selectedTimeframe}`,
        },
        (payload) => {
          setStocks((current) => {
            const updated = [...current];
            const newPattern = payload.new as WavePattern;
            const index = updated.findIndex(
              (s) => s.symbol === newPattern.symbol
            );

            if (index >= 0 && (waveStatus === "all" || newPattern.status === waveStatus)) {
              updated[index] = {
                ...updated[index],
                wavePattern: newPattern,
              };
            } else if (waveStatus === newPattern.status) {
              // Clear cache to force a refresh on next render
              const cacheKey = `stocks_${selectedTimeframe}_${waveStatus}_0`;
              globalCache.delete(cacheKey);
              // Reset pagination and reload
              setStocks([]);
              setPage(0);
              setHasMore(true);
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedTimeframe, waveStatus]);

  return { stocks, loading, error, hasMore, loadMore };
}
