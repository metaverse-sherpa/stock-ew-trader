import { supabase } from "../supabase";
import type { Timeframe, WaveStatus, StockPrice } from "../types";

export class WavePatternService {
  static async generateWavePattern(symbol: string, timeframe: Timeframe) {
    // Only analyze daily timeframe
    if (timeframe !== "1d") {
      console.log(`Skipping ${timeframe} timeframe - only analyzing daily`);
      return;
    }

    // Get historical prices from Jan 2022
    const startDate = new Date("2022-01-01").toISOString();

    // Get historical prices ordered by time
    const { data: prices } = await supabase
      .from("stock_prices")
      .select("*")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .gte("timestamp", startDate)
      .order("timestamp", { ascending: true });

    if (!prices?.length) return;

    // Find pivot points
    const pivots = this.findPivots(prices);

    // Find potential Elliott Wave patterns
    const patterns = this.findElliottWavePatterns(pivots, prices);

    // Only keep patterns that are currently in Wave 5
    const wave5Patterns = patterns.filter((p) =>
      this.isValidWave5Pattern(p, prices[prices.length - 1].close),
    );

    if (wave5Patterns.length === 0) {
      console.log(`No valid Wave 5 patterns found for ${symbol}`);
      return;
    }

    // Use the most recent Wave 5 pattern
    const selectedPattern = wave5Patterns[wave5Patterns.length - 1];
    const currentPrice = prices[prices.length - 1].close;

    const pattern = {
      id: `${symbol}-${timeframe}`,
      symbol,
      timeframe,
      exchange: "NYSE",
      status: "Wave 5 Bullish",
      confidence: this.calculateConfidence({
        prices,
        waves: selectedPattern,
      }),
      current_price: currentPrice,
      start_time: selectedPattern.wave1_start.timestamp,
      wave1_start: selectedPattern.wave1_start.price,
      wave1_start_time: selectedPattern.wave1_start.timestamp,
      wave1_end: selectedPattern.wave1_end.price,
      wave1_end_time: selectedPattern.wave1_end.timestamp,
      wave2_start: selectedPattern.wave1_end.price,
      wave2_end: selectedPattern.wave2_end.price,
      wave2_end_time: selectedPattern.wave2_end.timestamp,
      wave3_start: selectedPattern.wave2_end.price,
      wave3_end: selectedPattern.wave3_end.price,
      wave3_end_time: selectedPattern.wave3_end.timestamp,
      wave4_start: selectedPattern.wave3_end.price,
      wave4_end: selectedPattern.wave4_end.price,
      wave4_end_time: selectedPattern.wave4_end.timestamp,
      wave5_start: selectedPattern.wave5_start.price,
      wave5_end: currentPrice,
      wave5_end_time: prices[prices.length - 1].timestamp,
      target_price1: this.calculateTarget(
        currentPrice,
        selectedPattern.wave5_start.price,
        1,
      ),
      target_price2: this.calculateTarget(
        currentPrice,
        selectedPattern.wave5_start.price,
        2,
      ),
      target_price3: this.calculateTarget(
        currentPrice,
        selectedPattern.wave5_start.price,
        3,
      ),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`Generated Wave 5 pattern for ${symbol}:`, pattern);

    const { error } = await supabase.from("wave_patterns").upsert(pattern);
    if (error) {
      console.error(`Error upserting wave pattern for ${symbol}:`, error);
      return;
    }

    console.log(`Successfully stored Wave 5 pattern for ${symbol}`);
  }

  private static findPivots(
    prices: StockPrice[],
  ): Array<{ price: number; timestamp: string; isHigh: boolean }> {
    if (prices.length < 20) return []; // Need enough data for analysis

    const pivots: Array<{ price: number; timestamp: string; isHigh: boolean }> =
      [];

    // Use specified lookback periods
    const lookbackPeriods = [4, 8, 16];

    for (const lookback of lookbackPeriods) {
      for (let i = lookback; i < prices.length - lookback; i++) {
        let isHigh = true;
        let isLow = true;

        // Check if this is a pivot high or low
        for (let j = i - lookback; j <= i + lookback; j++) {
          if (j === i) continue;
          if (prices[j].high > prices[i].high) isHigh = false;
          if (prices[j].low < prices[i].low) isLow = false;
        }

        if (isHigh || isLow) {
          const existingPivot = pivots.find(
            (p) => p.timestamp === prices[i].timestamp,
          );
          if (!existingPivot) {
            pivots.push({
              price: isHigh ? prices[i].high : prices[i].low,
              timestamp: prices[i].timestamp,
              isHigh,
            });
          }
        }
      }
    }

    return pivots.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  private static findElliottWavePatterns(
    pivots: Array<{ price: number; timestamp: string; isHigh: boolean }>,
    prices: StockPrice[],
  ) {
    const patterns = [];
    const minWaveSize =
      (prices[prices.length - 1].close - prices[0].close) * 0.03; // 3% of total range

    // Look for potential Wave 1 starts (significant lows)
    for (let i = 0; i < pivots.length - 20; i++) {
      // Ensure enough room for all waves
      // Allow more flexibility in finding waves
      for (let w1e = i + 1; w1e < Math.min(i + 5, pivots.length - 16); w1e++) {
        // Wave 1 end
        for (
          let w2e = w1e + 1;
          w2e < Math.min(w1e + 5, pivots.length - 12);
          w2e++
        ) {
          // Wave 2 end
          for (
            let w3e = w2e + 1;
            w3e < Math.min(w2e + 5, pivots.length - 8);
            w3e++
          ) {
            // Wave 3 end
            for (
              let w4e = w3e + 1;
              w4e < Math.min(w3e + 5, pivots.length - 4);
              w4e++
            ) {
              // Validate all indices before creating pattern
              if (
                i >= pivots.length ||
                w1e >= pivots.length ||
                w2e >= pivots.length ||
                w3e >= pivots.length ||
                w4e >= pivots.length
              )
                continue;
              // Wave 4 end
              const potentialPattern = {
                wave1_start: pivots[i],
                wave1_end: pivots[w1e],
                wave2_end: pivots[w2e],
                wave3_end: pivots[w3e],
                wave4_end: pivots[w4e],
                wave5_start: pivots[w4e],
              };

              // Check minimum wave sizes
              const wave1Size = Math.abs(
                potentialPattern.wave1_end.price -
                  potentialPattern.wave1_start.price,
              );
              const wave2Size = Math.abs(
                potentialPattern.wave2_end.price -
                  potentialPattern.wave1_end.price,
              );
              const wave3Size = Math.abs(
                potentialPattern.wave3_end.price -
                  potentialPattern.wave2_end.price,
              );
              const wave4Size = Math.abs(
                potentialPattern.wave4_end.price -
                  potentialPattern.wave3_end.price,
              );

              if (
                wave1Size < minWaveSize ||
                wave2Size < minWaveSize ||
                wave3Size < minWaveSize ||
                wave4Size < minWaveSize
              )
                continue;

              if (this.isValidWavePattern(potentialPattern)) {
                patterns.push(potentialPattern);
              }
            }
          }
        }
      }
    }

    return patterns;
  }

  private static isValidWavePattern(pattern: any): boolean {
    // Get wave sizes
    const wave1Size = pattern.wave1_end.price - pattern.wave1_start.price;
    const wave2Size = pattern.wave1_end.price - pattern.wave2_end.price;
    const wave3Size = pattern.wave3_end.price - pattern.wave2_end.price;

    // Rule 1: Wave 2 cannot retrace more than 100% of Wave 1
    if (wave2Size / wave1Size > 1) return false;

    // Rule 2: Wave 4 cannot overlap Wave 1's territory
    if (pattern.wave4_end.price < pattern.wave1_end.price) return false;

    // Additional validation: Check wave directions
    if (pattern.wave1_end.price <= pattern.wave1_start.price) return false; // Wave 1 must go up
    if (pattern.wave2_end.price >= pattern.wave1_end.price) return false; // Wave 2 must go down
    if (pattern.wave3_end.price <= pattern.wave2_end.price) return false; // Wave 3 must go up
    if (pattern.wave4_end.price >= pattern.wave3_end.price) return false; // Wave 4 must go down

    return true;
  }

  private static isValidWave5Pattern(
    pattern: any,
    currentPrice: number,
  ): boolean {
    // Check if we're in Wave 5
    const wave5Move = currentPrice - pattern.wave5_start.price;

    // Wave 5 should be developing and moving in the right direction
    if (wave5Move <= 0) return false;

    // Wave 5 shouldn't be extended too far (typical max is 1.618 * Wave 1)
    const wave1Size = pattern.wave1_end.price - pattern.wave1_start.price;
    if (wave5Move > wave1Size * 1.618) return false;

    return true;
  }

  private static calculateConfidence(params: {
    prices: StockPrice[];
    waves: any;
  }): number {
    const { waves } = params;
    let confidence = 100;

    // Basic wave validation
    if (!waves.wave1_start || !waves.wave1_end) confidence -= 20;
    if (!waves.wave2_end) confidence -= 20;
    if (!waves.wave3_end) confidence -= 20;
    if (!waves.wave4_end) confidence -= 20;
    if (!waves.wave5_start) confidence -= 20;

    // Elliott Wave Rules validation
    const wave1Size = waves.wave1_end.price - waves.wave1_start.price;
    const wave2Retracement = waves.wave1_end.price - waves.wave2_end.price;
    const wave3Size = waves.wave3_end.price - waves.wave2_end.price;
    const wave4Retracement = waves.wave3_end.price - waves.wave4_end.price;

    // Rule 1: Wave 2 cannot retrace more than 100% of Wave 1
    if (wave2Retracement / wave1Size > 0.9) confidence -= 10;

    // Rule 2: Wave 4 cannot overlap Wave 1
    if (waves.wave4_end.price <= waves.wave1_end.price) confidence -= 20;

    // Additional guidelines
    // Wave 3 should be at least 1.618 times Wave 1
    if (wave3Size < wave1Size * 1.618) confidence -= 5;

    // Wave 4 should not retrace more than 38.2% of Wave 3
    if (wave4Retracement / wave3Size > 0.382) confidence -= 5;

    return Math.max(confidence, 0);
  }

  private static calculateTarget(
    currentPrice: number,
    wave5Start: number,
    targetLevel: number,
  ): number {
    const wave5Move = Math.abs(currentPrice - wave5Start);
    const fibonacci = [1.618, 2.618, 3.618]; // Common Fibonacci extension levels
    const extension = fibonacci[targetLevel - 1] || 1.618;

    return currentPrice + wave5Move * extension;
  }

  static async generateAllPatterns(): Promise<void> {
    const { data: stocks } = await supabase.from("stocks").select("symbol");
    if (!stocks) return;

    for (const { symbol } of stocks) {
      await this.generateWavePattern(symbol, "1d");
      // Add a small delay between processing each stock
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
