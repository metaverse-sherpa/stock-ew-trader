import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe } from "../types";

export function useStocks(selectedTimeframe: Timeframe) {
  // Always fetch all timeframes for mini charts
  const timeframes: Timeframe[] = ["1h", "4h", "1d"];
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

        // Then get wave patterns
        const { data: wavePatterns, error: waveError } = await supabase
          .from("wave_patterns")
          .select("*")
          .in("timeframe", timeframes)
          .order("confidence", { ascending: false });

        // Create a map of stocks for easy lookup
        const stocksMap = Object.fromEntries(
          stocks.map((stock) => [stock.symbol, stock]),
        );

        if (waveError) throw waveError;

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

        // Create stock entries for the selected timeframe's patterns
        const stocksWithPatterns = Object.entries(patternsBySymbol)
          .filter(([_, patterns]) => patterns[selectedTimeframe])
          .map(([symbol, patterns]) => ({
            symbol,
            exchange: patterns[selectedTimeframe].exchange,
            name: stocksMap[symbol]?.name || symbol,
            created_at: patterns[selectedTimeframe].created_at,
            updated_at: patterns[selectedTimeframe].updated_at,
            wavePattern: patterns[selectedTimeframe],
            // Include prices for all timeframes
            prices: stockPrices[symbol] || [],
          }));

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
  }, [selectedTimeframe]);

  return { stocks, loading, error };
}
