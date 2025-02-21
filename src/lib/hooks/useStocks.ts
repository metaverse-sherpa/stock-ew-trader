import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe } from "../types";

export function useStocks(
  selectedTimeframe: Timeframe,
  waveStatus: WaveStatus | "all" = "Wave 5 Bullish",
) {
  // Always fetch all timeframes for mini charts
  const timeframes: Timeframe[] =
    selectedTimeframe === "all" ? ["1h", "4h", "1d"] : [selectedTimeframe];
  console.log("useStocks hook called with timeframe:", selectedTimeframe);
  const [stocks, setStocks] = useState<
    (Stock & { wavePattern: WavePattern | null; prices: any[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("Fetching stocks for timeframe:", selectedTimeframe);
    const fetchStocks = async () => {
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

        // Then get wave patterns
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

        // Then get prices for each stock
        const pricesPromises = wavePatterns.map((pattern) =>
          supabase
            .from("stock_prices")
            .select()
            .eq("symbol", pattern.symbol)
            .in("timeframe", timeframes)
            .order("timestamp", { ascending: true })
            .limit(100)
            .then(({ data, error }) => {
              if (error) throw error;
              return (
                data?.map((price) => ({
                  ...price,
                  timeframe: price.timeframe, // Use the timeframe from the price object
                })) || []
              );
            }),
        );

        const pricesResults = await Promise.all(pricesPromises);
        console.log("Prices results:", pricesResults);

        const stockPrices = Object.fromEntries(
          pricesResults.map((prices, index) => [
            wavePatterns[index].symbol,
            prices,
          ]),
        );

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

        // Create stock entries for all patterns when 'all' is selected, or filter by timeframe
        const stocksWithPatterns = Object.entries(patternsBySymbol)
          .filter(([_, patterns]) => {
            // First check timeframe
            const hasTimeframe =
              selectedTimeframe === "all" ? true : patterns[selectedTimeframe];
            if (!hasTimeframe) return false;

            // Then check wave status
            const pattern =
              selectedTimeframe === "all"
                ? Object.values(patterns)[0]
                : patterns[selectedTimeframe];
            return waveStatus === "all" ? true : pattern.status === waveStatus;
          })
          .map(([symbol, patterns]) => {
            const pattern =
              selectedTimeframe === "all"
                ? Object.values(patterns)[0]
                : patterns[selectedTimeframe];
            return {
              symbol,
              exchange: stocksMap[symbol]?.exchange || "NYSE",
              name: stocksMap[symbol]?.name || symbol,
              created_at: stocksMap[symbol]?.created_at,
              updated_at: stocksMap[symbol]?.updated_at,
              symbol,
              exchange: stocksMap[symbol]?.exchange || "NYSE",
              name: stocksMap[symbol]?.name || symbol,
              created_at: stocksMap[symbol]?.created_at,
              updated_at: stocksMap[symbol]?.updated_at,
              wavePattern: pattern,
              prices: stockPrices[symbol] || [],
              wave4EndTime: pattern?.wave4_end_time
                ? new Date(pattern.wave4_end_time).getTime()
                : 0,
            };
          })
          .sort((a, b) => b.wave4EndTime - a.wave4EndTime); // Sort by wave4_end_time desc

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
