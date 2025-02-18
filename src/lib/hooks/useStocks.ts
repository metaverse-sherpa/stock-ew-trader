import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe } from "../types";

export function useStocks(timeframe: Timeframe) {
  console.log("useStocks hook called with timeframe:", timeframe);
  const [stocks, setStocks] = useState<
    (Stock & { wavePattern: WavePattern | null; prices: any[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("Fetching stocks for timeframe:", timeframe);
    const fetchStocks = async () => {
      try {
        // First get wave patterns with stocks
        const { data: wavePatterns, error: waveError } = await supabase
          .from("wave_patterns")
          .select(
            `
            *,
            stocks (*)
          `,
          )
          .eq("timeframe", timeframe)
          .order("confidence", { ascending: false });

        if (waveError) throw waveError;

        // Then get prices for each stock
        const pricesPromises = wavePatterns.map((pattern) =>
          supabase
            .from("stock_prices")
            .select()
            .eq("symbol", pattern.symbol)
            .eq("timeframe", timeframe)
            .order("timestamp", { ascending: true })
            .limit(100)
            .then(({ data, error }) => {
              if (error) throw error;
              return (
                data?.map((price) => ({
                  ...price,
                  timeframe, // Add timeframe to each price object
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
        const stocksWithPatterns = wavePatterns.map((pattern) => ({
          symbol: pattern.symbol,
          exchange: pattern.exchange,
          name: pattern.stocks?.name || null,
          created_at: pattern.created_at,
          updated_at: pattern.updated_at,
          wavePattern: pattern,
          prices: stockPrices[pattern.symbol] || [],
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
          filter: `timeframe=eq.${timeframe}`,
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
  }, [timeframe]);

  return { stocks, loading, error };
}
