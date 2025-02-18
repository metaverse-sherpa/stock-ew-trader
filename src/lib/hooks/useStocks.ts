import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Stock, WavePattern, Timeframe } from "../types";

export function useStocks(timeframe: Timeframe) {
  const [stocks, setStocks] = useState<
    (Stock & { wavePattern: WavePattern | null })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        // Fetch stocks with their latest wave patterns
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

        // Transform the data
        const stocksWithPatterns = wavePatterns.map((pattern) => ({
          symbol: pattern.symbol,
          exchange: pattern.exchange,
          name: pattern.stocks?.name || null,
          created_at: pattern.created_at,
          updated_at: pattern.updated_at,
          wavePattern: pattern,
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
