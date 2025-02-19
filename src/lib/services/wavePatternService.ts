import { supabase } from "../supabase";
import type { Timeframe, WaveStatus, StockPrice } from "../types";

export class WavePatternService {
  static async generateWavePattern(symbol: string, timeframe: Timeframe) {
    // Get historical prices ordered by time
    const { data: prices } = await supabase
      .from("stock_prices")
      .select("*")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .order("timestamp", { ascending: true });

    if (!prices?.length) return;

    // Find significant price swings to identify wave points
    const pivots = this.findPriceSwings(prices);
    console.log(`Found ${pivots.length} pivots for ${symbol} ${timeframe}`);

    if (pivots.length < 3) {
      console.log(
        `Not enough pivots (${pivots.length}) to generate wave pattern for ${symbol} ${timeframe}`,
      );
      return;
    }

    // Identify potential wave 1 start
    let wave1StartIndex = -1;
    for (let i = 0; i < pivots.length - 2; i++) {
      const potential1 = pivots[i];
      const potential2 = pivots[i + 1];
      const potential3 = pivots[i + 2];

      // Look for impulsive wave pattern (up-down-up or down-up-down)
      if (
        (potential1.isHigh && !potential2.isHigh && potential3.isHigh) ||
        (!potential1.isHigh && potential2.isHigh && !potential3.isHigh)
      ) {
        wave1StartIndex = i;
        break;
      }
    }

    if (wave1StartIndex === -1) {
      console.log("No valid wave 1 pattern found");
      return;
    }

    const currentPrice = prices[prices.length - 1].close;

    // Map out the waves based on available pivot points
    const waves = {
      wave1_start: pivots[wave1StartIndex].price,
      wave1_end: pivots[wave1StartIndex + 1].price,
      wave2_start: pivots[wave1StartIndex + 1].price,
      wave2_end: pivots[wave1StartIndex + 2]?.price,
      wave3_start: pivots[wave1StartIndex + 2]?.price,
      wave3_end: pivots[wave1StartIndex + 3]?.price,
      wave4_start: pivots[wave1StartIndex + 3]?.price,
      wave4_end: pivots[wave1StartIndex + 4]?.price,
      wave5_start: pivots[wave1StartIndex + 4]?.price,
      wave5_end: pivots[wave1StartIndex + 5]?.price,
      wave_a_start: pivots[wave1StartIndex + 5]?.price,
      wave_a_end: pivots[wave1StartIndex + 6]?.price,
      wave_b_start: pivots[wave1StartIndex + 6]?.price,
      wave_b_end: pivots[wave1StartIndex + 7]?.price,
      wave_c_start: pivots[wave1StartIndex + 7]?.price,
      wave_c_end: null, // This will be set if the pattern completes
    };

    // Validate all wave points exist
    if (
      !waves.wave1_start ||
      !waves.wave1_end ||
      !waves.wave2_end ||
      !waves.wave3_end ||
      !waves.wave4_end ||
      !waves.wave5_start
    ) {
      console.log("Invalid wave points detected");
      return;
    }

    // Calculate confidence based on pattern adherence
    const confidence = this.calculateConfidence({
      prices,
      waves,
    });

    // Determine wave status
    const status = this.determineWaveStatus({
      currentPrice,
      waves,
      prices,
    });

    // Find the timestamp of Wave 1 start
    const wave1StartTimestamp = pivots[wave1StartIndex].timestamp;

    // First, reset all wave1_start flags for this symbol and timeframe
    await supabase
      .from("stock_prices")
      .update({ wave1_start: false })
      .eq("symbol", symbol)
      .eq("timeframe", timeframe);

    // Then, set wave1_start flag for the actual Wave 1 start point
    await supabase
      .from("stock_prices")
      .update({ wave1_start: true })
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .eq("timestamp", wave1StartTimestamp);

    const pattern = {
      id: `${symbol}-${timeframe}`, // Create a unique ID
      symbol,
      timeframe,
      exchange: "NYSE",
      status,
      confidence,
      current_price: currentPrice,
      start_time: wave1StartTimestamp,
      wave1_start: waves.wave1_start,
      wave1_end: waves.wave1_end,
      wave2_start: waves.wave2_start,
      wave2_end: waves.wave2_end,
      wave3_start: waves.wave3_start,
      wave3_end: waves.wave3_end,
      wave4_start: waves.wave4_start,
      wave4_end: waves.wave4_end,
      wave5_start: waves.wave5_start,
      wave5_end: waves.wave5_end || currentPrice, // Use current price if wave5_end not set
      target_price1: this.calculateTarget(currentPrice, waves.wave5_start, 1),
      target_price2: this.calculateTarget(currentPrice, waves.wave5_start, 2),
      target_price3: this.calculateTarget(currentPrice, waves.wave5_start, 3),
      wave_a_start: waves.wave_a_start || null,
      wave_a_end: waves.wave_a_end || null,
      wave_b_start: waves.wave_b_start || null,
      wave_b_end: waves.wave_b_end || null,
      wave_c_start: waves.wave_c_start || null,
      wave_c_end: waves.wave_c_end || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`Generated pattern for ${symbol} ${timeframe}:`, pattern);

    const { error } = await supabase.from("wave_patterns").upsert(pattern);
    if (error) {
      console.error(
        `Error upserting wave pattern for ${symbol} ${timeframe}:`,
        error,
      );
      return;
    }
    console.log(`Successfully stored wave pattern for ${symbol} ${timeframe}`);
  }

  private static findPriceSwings(
    prices: StockPrice[],
  ): Array<{ price: number; timestamp: string; isHigh: boolean }> {
    if (!prices || prices.length === 0) {
      console.log("No prices provided to findPriceSwings");
      return [];
    }

    const pivots: Array<{ price: number; timestamp: string; isHigh: boolean }> =
      [];

    // Find the lowest point in the first third of the data for Wave 1 start
    const firstThird = prices.slice(0, Math.floor(prices.length / 3));
    const wave1StartIndex = firstThird.reduce(
      (minIdx, price, idx) =>
        price.low < firstThird[minIdx].low ? idx : minIdx,
      0,
    );

    // Wave 1 start (low)
    pivots.push({
      price: firstThird[wave1StartIndex].low,
      timestamp: firstThird[wave1StartIndex].timestamp,
      isHigh: false,
    });

    // Find Wave 1 end (high)
    const afterWave1Start = prices.slice(wave1StartIndex + 1);
    let currentIndex = wave1StartIndex + 1;
    let wave1EndIndex = currentIndex;
    let wave1High = afterWave1Start[0].high;

    for (let i = 1; i < afterWave1Start.length; i++) {
      if (afterWave1Start[i].high > wave1High) {
        wave1High = afterWave1Start[i].high;
        wave1EndIndex = currentIndex + i;
      }
      // Stop if we find a significant drop
      if (afterWave1Start[i].low < afterWave1Start[i - 1].low * 0.98) break;
    }

    // Wave 1 end (high)
    pivots.push({
      price: prices[wave1EndIndex].high,
      timestamp: prices[wave1EndIndex].timestamp,
      isHigh: true,
    });

    // Find subsequent waves
    let isLookingForHigh = false; // Start looking for a low (Wave 2)
    let lastPivotIndex = wave1EndIndex;
    let remainingPrices = prices.slice(wave1EndIndex + 1);

    while (pivots.length < 8 && remainingPrices.length > 0) {
      let extremeValue = isLookingForHigh ? -Infinity : Infinity;
      let extremeIndex = 0;
      let windowSize = Math.floor(remainingPrices.length / 3);

      for (let i = 0; i < windowSize; i++) {
        const price = remainingPrices[i];
        if (isLookingForHigh) {
          if (price.high > extremeValue) {
            extremeValue = price.high;
            extremeIndex = i;
          }
        } else {
          if (price.low < extremeValue) {
            extremeValue = price.low;
            extremeIndex = i;
          }
        }
      }

      pivots.push({
        price: isLookingForHigh ? extremeValue : extremeValue,
        timestamp: remainingPrices[extremeIndex].timestamp,
        isHigh: isLookingForHigh,
      });

      lastPivotIndex += extremeIndex + 1;
      remainingPrices = prices.slice(lastPivotIndex + 1);
      isLookingForHigh = !isLookingForHigh;
    }

    return pivots;
  }

  private static calculateVolatility(prices: StockPrice[]): number {
    const returns = prices.slice(1).map((price, i) => {
      return (price.close - prices[i].close) / prices[i].close;
    });
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;
    return Math.sqrt(variance);
  }

  private static findPriceSwingsAlternative(
    prices: StockPrice[],
  ): Array<{ price: number; timestamp: string; isHigh: boolean }> {
    const pivots: Array<{ price: number; timestamp: string; isHigh: boolean }> =
      [];
    const segments = 8; // We need 8 points for Elliott Wave + ABC
    const segmentSize = Math.floor(prices.length / segments);

    // Find local extremes in each segment
    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize;
      const end = i === segments - 1 ? prices.length : (i + 1) * segmentSize;
      const segment = prices.slice(start, end);

      if (segment.length === 0) continue;

      // Alternate between finding highs and lows
      const isHigh = i % 2 === 0;
      const extreme = isHigh
        ? Math.max(...segment.map((p) => p.high))
        : Math.min(...segment.map((p) => p.low));

      // Find the timestamp where this extreme occurred
      const extremePoint =
        segment.find((p) =>
          isHigh ? p.high === extreme : p.low === extreme,
        ) || segment[Math.floor(segment.length / 2)];

      pivots.push({
        price: extreme,
        timestamp: extremePoint.timestamp,
        isHigh,
      });
    }

    return pivots;
  }

  private static calculateConfidence(params: {
    prices: StockPrice[];
    waves: {
      wave1_start: number;
      wave1_end: number;
      wave2_end?: number;
      wave3_end?: number;
      wave4_end?: number;
      wave5_end?: number;
      wave_a_end?: number;
      wave_b_end?: number;
      wave_c_end?: number;
    };
  }): number {
    const { waves } = params;
    let confidence = 100;
    let completedWaves = 0;

    // Basic wave completion confidence
    if (waves.wave1_end) completedWaves++;
    if (waves.wave2_end) completedWaves++;
    if (waves.wave3_end) completedWaves++;
    if (waves.wave4_end) completedWaves++;
    if (waves.wave5_end) completedWaves++;

    // ABC wave completion
    if (waves.wave_a_end) completedWaves++;
    if (waves.wave_b_end) completedWaves++;
    if (waves.wave_c_end) completedWaves++;

    // Base confidence on wave completion
    confidence = Math.round(Math.min(confidence, (completedWaves / 8) * 100));

    // Validate impulse waves (1, 3, 5, B) are moving up
    if (waves.wave1_end && waves.wave1_end <= waves.wave1_start)
      confidence -= 25;
    if (waves.wave3_end && waves.wave3_end <= waves.wave2_end!)
      confidence -= 25;
    if (waves.wave5_end && waves.wave5_end <= waves.wave4_end!)
      confidence -= 25;
    if (waves.wave_b_end && waves.wave_b_end <= waves.wave_a_end!)
      confidence -= 25;

    // Validate corrective waves (2, 4, A, C) are moving down
    if (waves.wave2_end && waves.wave2_end >= waves.wave1_end) confidence -= 25;
    if (waves.wave4_end && waves.wave4_end >= waves.wave3_end!)
      confidence -= 25;
    if (waves.wave_a_end && waves.wave_a_end >= waves.wave5_end!)
      confidence -= 25;
    if (waves.wave_c_end && waves.wave_c_end >= waves.wave_b_end!)
      confidence -= 25;

    // Elliott Wave Rules
    if (waves.wave2_end) {
      // Rule 1: Wave 2 never retraces more than 100% of Wave 1
      if (waves.wave2_end <= waves.wave1_start) confidence -= 20;
    }

    if (waves.wave3_end) {
      // Rule 2: Wave 3 is typically the longest and most powerful
      const wave1Size = Math.abs(waves.wave1_end - waves.wave1_start);
      const wave3Size = Math.abs(waves.wave3_end - waves.wave2_end!);
      if (wave3Size < wave1Size) confidence -= 15;
    }

    if (waves.wave4_end && waves.wave1_end) {
      // Rule 3: Wave 4 never enters Wave 1's price territory
      if (waves.wave4_end <= waves.wave1_end) confidence -= 20;
    }

    return Math.max(confidence, 0);
  }

  private static determineWaveStatus(params: {
    currentPrice: number;
    waves: {
      wave1_end: number;
      wave2_end: number;
      wave3_end: number;
      wave4_end: number;
      wave5_end?: number;
      wave_a_end?: number;
      wave_b_end?: number;
      wave_c_end?: number;
    };
    prices: StockPrice[];
  }): WaveStatus {
    const { currentPrice, waves, prices } = params;
    const recentPrices = prices.slice(-5);
    const trend =
      recentPrices[recentPrices.length - 1].close > recentPrices[0].close;

    // Determine which wave we're in based on completed waves
    if (!waves.wave2_end) return "Wave 1";
    if (!waves.wave3_end) return "Wave 2";
    if (!waves.wave4_end) return "Wave 3";
    if (!waves.wave5_end) return "Wave 4";
    if (!waves.wave_a_end) return trend ? "Wave 5 Bullish" : "Wave 5 Bearish";
    if (!waves.wave_b_end) return "Wave A";
    if (!waves.wave_c_end) return "Wave B";
    if (waves.wave_c_end) return "Wave C";

    return "Completed";
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

    const timeframes: Timeframe[] = ["1h", "4h", "1d"];

    for (const { symbol } of stocks) {
      for (const timeframe of timeframes) {
        await this.generateWavePattern(symbol, timeframe);
      }
    }
  }
}
