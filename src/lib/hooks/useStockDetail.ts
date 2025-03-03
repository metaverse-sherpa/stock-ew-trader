import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { WavePattern, StockPrice, Timeframe, WaveStatus } from "../types";
import { globalCache } from "../cache";

export function useStockDetail(
  symbol: string,
  timeframe: Timeframe,
  initialWaveStatus: WaveStatus | "all" = "all"
) {
  const [wavePattern, setWavePattern] = useState<WavePattern | null>(null);
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [waveStatus, setWaveStatus] = useState<WaveStatus | "all">(initialWaveStatus);

  useEffect(() => {
    console.log("useStockDetail effect running for:", { symbol, timeframe });
    const fetchStockDetail = async () => {
      // Check cache first
      const cacheKey = `stock_detail_${symbol}_${timeframe}_${waveStatus || "any"}`;
      const cachedData = globalCache.get<{
        wavePattern: WavePattern | null;
        prices: StockPrice[];
      }>(cacheKey);

      if (cachedData) {
        console.log("Using cached stock detail data");
        setWavePattern(cachedData.wavePattern);
        setPrices(cachedData.prices);
        setLoading(false);
        return;
      }
      try {
        const timeframes = timeframe ? [timeframe] : ["1h", "4h", "1d"];

        // Fetch stock details first
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("*")
          .eq("symbol", symbol)
          .single();

        if (stockError) {
          console.warn("Error fetching stock details:", stockError);
        }

        // Fetch wave pattern
        let query = supabase
          .from("wave_patterns")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe);

        // Add wave status filter if provided and not 'all'
        if (waveStatus && waveStatus !== "all") {
          query = query.eq("status", waveStatus);
        }
        // When 'all' is selected, we don't filter by status and just get the most recent pattern

        const { data: patternData, error: patternError } = await query
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Log the pattern data we found
        console.log("Wave pattern data:", {
          symbol,
          timeframe,
          patternData,
          patternError,
        });

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
          .in("timeframe", timeframes)
          .order("timestamp", { ascending: false })
          .limit(5000);

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
        setWavePattern(
          patternData
            ? {
                ...patternData,
                name: stockData?.name || symbol,
                market_cap: stockData?.market_cap || 0,
              }
            : null,
        );
        // Always set prices if we have them
        setPrices(priceData || []);

        // Store in cache
        globalCache.set(cacheKey, {
          wavePattern: patternData
            ? {
                ...patternData,
                name: stockData?.name || symbol,
                market_cap: stockData?.market_cap || 0,
              }
            : null,
          prices: priceData || [],
        });
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
