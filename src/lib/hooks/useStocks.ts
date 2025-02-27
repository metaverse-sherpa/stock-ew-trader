import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase.client";
import type { Stock, WavePattern, Timeframe, WaveStatus } from "../types.js";

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
        console.log('Fetching wave patterns for:', { selectedTimeframe, waveStatus });

        // Step 1: Build the query
        const query = supabase
          .from("wave_patterns")
          .select("*")
          .in("timeframe", selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe]);

        if (waveStatus !== "all") {
          query.eq("status", waveStatus);
        }

        console.log('Query built:', query);

        // Step 2: Execute the query
        const { data: wavePatterns, error: waveError } = await query;

        if (waveError) {
          console.error('Supabase wave patterns query error:', {
            message: waveError.message,
            code: waveError.code,
            details: waveError.details,
          });
          throw waveError;
        }

        console.log('Wave patterns fetched:', wavePatterns);

        // Step 3: Get unique symbols
        const symbols = [...new Set(wavePatterns.map(wp => wp.symbol))];
        console.log('Unique symbols:', symbols);

        // Step 4: Handle empty results
        if (symbols.length === 0 && waveStatus === "all") {
          console.log('No wave patterns found, fetching all patterns for timeframe:', selectedTimeframe);
          const { data: allWavePatterns, error: allWaveError } = await supabase
            .from("wave_patterns")
            .select("*")
            .in("timeframe", selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe]);

          if (allWaveError) {
            console.error('Supabase all wave patterns query error:', {
              message: allWaveError.message,
              code: allWaveError.code,
              details: allWaveError.details,
            });
            throw allWaveError;
          }

          symbols.push(...new Set(allWavePatterns.map(wp => wp.symbol)));
          wavePatterns.push(...allWavePatterns);
          console.log('All wave patterns fetched:', allWavePatterns);
        }

        // Step 5: Fetch stock data
        console.log('Fetching stock data for symbols:', symbols);
        const { data: stocks, error: stocksError } = await supabase
          .from("stocks")
          .select("*")
          .in("symbol", symbols);

        if (stocksError) {
          console.error('Supabase stocks query error:', {
            message: stocksError.message,
            code: stocksError.code,
            details: stocksError.details,
          });
          throw stocksError;
        }

        console.log('Stocks fetched:', stocks);

        // Step 6: Fetch price data
        console.log('Fetching price data for wave patterns');
        const stocksWithPrices = await Promise.all(
          wavePatterns.map(async (pattern) => {
            const stock = stocks.find(s => s.symbol === pattern.symbol);
            if (!stock) {
              console.warn('No stock found for symbol:', pattern.symbol);
              return null;
            }

            const { data: prices, error: pricesError } = await supabase
              .from("stock_prices")
              .select("*")
              .eq("symbol", pattern.symbol)
              .eq("timeframe", pattern.timeframe)
              .order("timestamp", { ascending: true });

            if (pricesError) {
              console.error('Supabase stock prices query error:', {
                message: pricesError.message,
                code: pricesError.code,
                details: pricesError.details,
              });
              throw pricesError;
            }

            return {
              ...stock,
              symbol: pattern.symbol,
              prices: prices?.map(price => ({
                ...price,
                timeframe: pattern.timeframe,
              })) || [],
              wavePattern: pattern,
            };
          })
        );

        // Step 7: Filter and cache results
        const validStocksWithPrices = stocksWithPrices
          .filter(Boolean)
          .filter((stock, index, self) => {
            const key = `${stock.symbol}-${stock.wavePattern?.timeframe}-${stock.wavePattern?.status}`;
            return index === self.findIndex(s => 
              `${s.symbol}-${s.wavePattern?.timeframe}-${s.wavePattern?.status}` === key
            );
          });

        console.log('Valid stocks with prices:', validStocksWithPrices);
        dataCache[cacheKey] = validStocksWithPrices;
        setStocks(validStocksWithPrices);
        setLoading(false);
      } catch (err) {
        console.error('Detailed error fetching stocks:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : 'No stack trace',
          cacheKey,
          selectedTimeframe,
          waveStatus,
        });
        setError(
          new Error(
            `Failed to fetch stocks: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
          ),
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
