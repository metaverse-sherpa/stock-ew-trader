import { supabase } from "../supabase";
import type { Timeframe, WaveStatus, StockPrice } from "../types";
import { generateUUID } from "../utils";

export class WavePatternService {
  static async generateAllPatterns(onProgress?: (message: string) => void) {
    console.log("Starting pattern generation...");
    try {
      onProgress?.("Fetching stocks...");
      console.log("Fetching stocks from database...");
      const { data: stocks, error: stocksError } = await supabase
        .from("stocks")
        .select("*");

      if (stocksError) {
        console.error("Error fetching stocks:", stocksError);
        throw stocksError;
      }

      console.log(`Found ${stocks?.length || 0} stocks`);
      if (!stocks?.length) return;

      onProgress?.("Clearing existing patterns...");
      console.log("Clearing existing wave patterns...");
      const { error: deleteError } = await supabase
        .from("wave_patterns")
        .delete()
        .neq("id", "dummy");

      if (deleteError) {
        console.error("Error clearing patterns:", deleteError);
        throw deleteError;
      }

      console.log("Existing patterns cleared successfully.");

      const timeframes: Timeframe[] = ["1h", "4h", "1d"];

      for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        onProgress?.(
          `Analyzing ${stock.symbol} (${i + 1}/${stocks.length})...`,
        );
        for (const timeframe of timeframes) {
          // Get prices for this stock and timeframe
          console.log(`Fetching prices for ${stock.symbol} (${timeframe})...`);
          const { data: prices, error: pricesError } = await supabase
            .from("stock_prices")
            .select("*")
            .eq("symbol", stock.symbol)
            .eq("timeframe", timeframe)
            .order("timestamp", { ascending: true });

          if (pricesError) {
            console.error(
              `Error fetching prices for ${stock.symbol}:`,
              pricesError,
            );
            continue;
          }

          if (!prices?.length) {
            console.log(`No prices found for ${stock.symbol} (${timeframe})`);
            continue;
          }

          console.log(
            `Found ${prices.length} price points for ${stock.symbol} (${timeframe})`,
          );

          // Find pivot points
          console.log(`Finding pivot points for ${stock.symbol}...`);
          const pivots = this.findPivotPoints(prices);
          console.log(`Found ${pivots.length} pivot points`);

          // Find wave patterns
          console.log(`Finding Elliott Wave patterns for ${stock.symbol}...`);
          const patterns = this.findElliottWavePatterns(pivots, prices);
          console.log(`Found ${patterns.length} potential patterns`);

          // Store each pattern
          for (const pattern of patterns) {
            console.log(`Storing pattern for ${stock.symbol}:`, pattern);
            const { error: insertError } = await supabase
              .from("wave_patterns")
              .insert({
                id: generateUUID(), // Add UUID for the id field
                symbol: stock.symbol,
                timeframe,
                exchange: stock.exchange,
                status: pattern.status,
                confidence: pattern.confidence || 0,
                current_price: prices[prices.length - 1].close,
                start_time: pattern.wave1_start_time,
                wave1_start: pattern.wave1_start,
                wave1_start_time: pattern.wave1_start_time,
                wave1_end: pattern.wave1_end,
                wave1_end_time: pattern.wave1_end_time,
                wave2_start: pattern.wave1_end,
                wave2_end: pattern.wave2_end,
                wave2_end_time: pattern.wave2_end_time,
                wave3_start: pattern.wave2_end,
                wave3_end: pattern.wave3_end,
                wave3_end_time: pattern.wave3_end_time,
                wave4_start: pattern.wave3_end,
                wave4_end: pattern.wave4_end,
                wave4_end_time: pattern.wave4_end_time,
                wave5_start: pattern.wave5_start,
                wave5_end: pattern.wave5_end,
                wave5_end_time: pattern.wave5_end_time,
                wave_a_start: pattern.wave_a_start,
                wave_a_end: pattern.wave_a_end,
                wave_a_end_time: pattern.wave_a_end_time,
                wave_b_start: pattern.wave_b_start,
                wave_b_end: pattern.wave_b_end,
                wave_b_end_time: pattern.wave_b_end_time,
                wave_c_start: pattern.wave_c_start,
                wave_c_end: pattern.wave_c_end,
                wave_c_end_time: pattern.wave_c_end_time,
                target_price1: pattern.target_price1 || 0,
                target_price2: pattern.target_price2 || 0,
                target_price3: pattern.target_price3 || 0,
              });

            if (insertError) {
              console.error(
                `Error inserting pattern for ${stock.symbol}:`,
                insertError,
              );
              continue;
            }

            console.log(`Successfully stored pattern for ${stock.symbol}`);
          }
        }
      }
    } catch (error) {
      console.error("Error generating patterns:", error);
      throw error;
    }
  }

  private static findPivotPoints(prices: StockPrice[]) {
    const pivots: Array<{ price: number; timestamp: string; isHigh: boolean }> =
      [];
    const lookback = 3; // Number of bars to look back/forward

    for (let i = lookback; i < prices.length - lookback; i++) {
      const currentHigh = prices[i].high;
      const currentLow = prices[i].low;

      // Check for high pivot
      let isHighPivot = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        if (prices[j].high > currentHigh) {
          isHighPivot = false;
          break;
        }
      }

      // Check for low pivot
      let isLowPivot = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        if (prices[j].low < currentLow) {
          isLowPivot = false;
          break;
        }
      }

      if (isHighPivot) {
        pivots.push({
          price: currentHigh,
          timestamp: prices[i].timestamp,
          isHigh: true,
        });
      }
      if (isLowPivot) {
        pivots.push({
          price: currentLow,
          timestamp: prices[i].timestamp,
          isHigh: false,
        });
      }
    }

    return pivots;
  }

  private static isValidWave5Pattern(
    pattern: any,
    currentPrice: number,
    prices: StockPrice[],
  ): boolean {
    // First check: Has price fallen below Wave 1 start at any point?
    const wave1StartPrice = pattern.wave1_start.price;
    const wave4EndIndex = prices.findIndex(
      (p) => p.timestamp === pattern.wave4_end.timestamp,
    );
    const pricesSinceWave1 = prices.slice(wave4EndIndex);

    // If price has fallen below Wave 1 start at any point, invalidate the pattern
    const hasInvalidated = pricesSinceWave1.some(
      (p) => p.low < wave1StartPrice,
    );
    if (hasInvalidated) return false;

    // Find all prices since Wave 4 ended
    const pricesSinceWave4 = prices.slice(wave4EndIndex);

    // Find the highest price since Wave 4 ended
    const highestPrice = Math.max(...pricesSinceWave4.map((p) => p.high));
    const highestPriceIndex = pricesSinceWave4.findIndex(
      (p) => p.high === highestPrice,
    );

    // Find the lowest price after the highest point
    const pricesAfterHigh = pricesSinceWave4.slice(highestPriceIndex);
    const lowestAfterHigh = Math.min(...pricesAfterHigh.map((p) => p.low));

    // Calculate Wave 5 size and retracement
    const wave5Size = highestPrice - pattern.wave4_end.price;
    const retracement = highestPrice - lowestAfterHigh;
    const retracementPercent = (retracement / wave5Size) * 100;

    // Consider Wave 5 complete if:
    // 1. We've retraced more than 23.6% of Wave 5
    // 2. The retracement has lasted at least 3 bars
    // 3. The current price is below the high
    const isWave5Complete =
      retracementPercent > 23.6 &&
      pricesAfterHigh.length >= 3 &&
      currentPrice < highestPrice;

    if (isWave5Complete) {
      // Start looking for ABC waves
      pattern.wave5_end = highestPrice;
      pattern.wave5_end_time = pricesSinceWave4.find(
        (p) => p.high === highestPrice,
      )?.timestamp;
      pattern.wave_a_start = highestPrice;

      // Look for Wave A end within 8 bars after Wave 5 peak
      const wave5EndIndex = prices.findIndex(
        (p) => p.timestamp === pattern.wave5_end_time,
      );
      const pricesForWaveA = prices.slice(wave5EndIndex, wave5EndIndex + 8);
      const waveLow = Math.min(...pricesForWaveA.map((p) => p.low));
      const waveLowIndex = pricesForWaveA.findIndex((p) => p.low === waveLow);

      if (waveLow < pattern.wave4_end) {
        pattern.wave_a_end = waveLow;
        pattern.wave_a_end_time = prices.find(
          (p) => p.low === waveLow,
        )?.timestamp;

        // Look for Wave B (retracement up) within next 4-8 bars
        const waveAEndIndex = wave5EndIndex + waveLowIndex;
        const pricesAfterA = prices.slice(waveAEndIndex, waveAEndIndex + 8);

        if (pricesAfterA.length > 0) {
          pattern.wave_b_start = waveLow;
          const waveBHigh = Math.max(...pricesAfterA.map((p) => p.high));
          const waveBHighIndex = pricesAfterA.findIndex(
            (p) => p.high === waveBHigh,
          );

          // Wave B should retrace at least 38.2% of Wave A
          const waveASize = pattern.wave_a_start - waveLow;
          const waveBRetracement = waveBHigh - waveLow;
          const waveBRetracementPercent = (waveBRetracement / waveASize) * 100;

          if (waveBRetracement >= waveASize * 0.382) {
            pattern.wave_b_end = waveBHigh;
            pattern.wave_b_end_time = pricesAfterA[waveBHighIndex].timestamp;

            // Look for Wave C (move down) within next 4-8 bars after Wave B
            const waveBEndIndex = waveAEndIndex + waveBHighIndex;
            const pricesAfterB = prices.slice(waveBEndIndex, waveBEndIndex + 8);

            if (pricesAfterB.length > 0) {
              pattern.wave_c_start = waveBHigh;
              const waveCLow = Math.min(...pricesAfterB.map((p) => p.low));
              const waveCLowIndex = pricesAfterB.findIndex(
                (p) => p.low === waveCLow,
              );

              // Wave C should be at least as long as Wave A
              const waveCSize = waveBHigh - waveCLow;
              const waveCPercent = (waveCSize / waveASize) * 100;

              if (waveCSize >= waveASize * 0.618) {
                pattern.wave_c_end = waveCLow;
                pattern.wave_c_end_time = pricesAfterB[waveCLowIndex].timestamp;
                pattern.status = "Completed";
              }
            }
          }
        }
        return true;
      }
    }

    // If Wave 5 isn't complete, check if it's still valid
    const wave5Move = currentPrice - pattern.wave5_start;

    // Wave 5 should be moving in the right direction
    if (wave5Move <= 0) return false;

    // Wave 5 can extend beyond Wave 1, but we'll use 2.618 as an absolute maximum
    const wave1Size = pattern.wave1_end - pattern.wave1_start;
    if (wave5Move > wave1Size * 2.618) return false;

    // Wave 5 cannot dip below where Wave 4 started
    if (currentPrice < pattern.wave4_start) return false;

    return true;
  }

  private static findElliottWavePatterns(
    pivots: Array<{ price: number; timestamp: string; isHigh: boolean }>,
    prices: StockPrice[],
  ) {
    const patterns = [];
    if (!prices?.length) return patterns;

    // Limit the number of patterns to analyze
    const MAX_PATTERNS = 10;
    const MAX_LOOKBACK = 50; // Only look at recent pivots

    // Use recent pivots only
    pivots = pivots.slice(-MAX_LOOKBACK);

    const minWaveSize =
      (prices[prices.length - 1].close - prices[0].close) * 0.01; // 1% of total range

    // Find all potential Wave 1 starts (significant lows)
    const potentialStarts = [];
    for (let i = 0; i < pivots.length - 20; i++) {
      if (!pivots[i].isHigh) {
        // Only consider lows for Wave 1 starts
        potentialStarts.push(i);
      }
    }

    // For each potential start, check if price ever goes below that point
    // If it does, invalidate all waves before that point and start fresh
    let validStarts = [];
    for (const startIndex of potentialStarts) {
      const startPrice = pivots[startIndex].price;
      const startTime = new Date(pivots[startIndex].timestamp).getTime();

      // Check all future prices
      let isValid = true;
      for (let j = startIndex + 1; j < pivots.length; j++) {
        if (pivots[j].price < startPrice) {
          // Found a new low - invalidate this wave count
          isValid = false;
          break;
        }
      }

      if (isValid) {
        validStarts.push(startIndex);
      }
    }

    // Take only the most recent valid starts
    validStarts = validStarts.slice(-MAX_PATTERNS);

    // For each valid start point, look for wave patterns
    for (const startIndex of validStarts) {
      // Initialize base pattern
      let pattern = {
        wave1_start: pivots[startIndex].price,
        wave1_start_time: pivots[startIndex].timestamp,
        wave1_end: pivots[startIndex].price, // Set initial end same as start
        wave1_end_time: pivots[startIndex].timestamp,
        wave2_start: pivots[startIndex].price,
        wave2_end: pivots[startIndex].price,
        wave3_start: pivots[startIndex].price,
        wave2_end_time: pivots[startIndex].timestamp,
        wave3_end: pivots[startIndex].price,
        wave3_end_time: pivots[startIndex].timestamp,
        wave4_start: pivots[startIndex].price,
        wave4_end: pivots[startIndex].price,
        wave4_end_time: pivots[startIndex].timestamp,
        wave5_start: pivots[startIndex].price,
        wave5_end: null,
        wave5_end_time: null,
        wave_a_start: null,
        wave_a_end: null,
        wave_a_end_time: null,
        wave_b_start: null,
        wave_b_end: null,
        wave_b_end_time: null,
        wave_c_start: null,
        wave_c_end: null,
        wave_c_end_time: null,
        status: "Wave 1" as WaveStatus,
        confidence: 0,
        current_price: prices[prices.length - 1].close,
        target_price1: pivots[startIndex].price,
        target_price2: pivots[startIndex].price,
        target_price3: pivots[startIndex].price,
      };

      // Save Wave 1 start
      patterns.push({ ...pattern });

      // Look for Wave 1 end (next high after start)
      for (let i = startIndex + 1; i < pivots.length; i++) {
        if (pivots[i].isHigh) {
          pattern.wave1_end = pivots[i].price;
          pattern.wave1_end_time = pivots[i].timestamp;
          const wave1Size = pattern.wave1_end - pattern.wave1_start;

          // Wave 1 must be significant
          if (wave1Size < minWaveSize) continue;

          // Update and save Wave 1 completion
          pattern.status = "Wave 2";
          patterns.push({ ...pattern });

          // Look for Wave 2 end (next low after Wave 1 end)
          for (let j = i + 1; j < pivots.length; j++) {
            if (!pivots[j].isHigh) {
              pattern.wave2_end = pivots[j].price;
              pattern.wave2_end_time = pivots[j].timestamp;

              // Wave 2 cannot go below Wave 1 start
              if (pattern.wave2_end <= pattern.wave1_start) break;

              // Update and save Wave 2 completion
              pattern.status = "Wave 3";
              patterns.push({ ...pattern });

              // Look for Wave 3 end (next high after Wave 2)
              for (let k = j + 1; k < pivots.length; k++) {
                if (pivots[k].isHigh) {
                  pattern.wave3_end = pivots[k].price;
                  pattern.wave3_end_time = pivots[k].timestamp;

                  // Wave 3 must be longer than Wave 1
                  const wave3Size = pattern.wave3_end - pattern.wave2_end;
                  if (wave3Size <= wave1Size) break;

                  // Update and save Wave 3 completion
                  pattern.status = "Wave 4";
                  patterns.push({ ...pattern });

                  // Look for Wave 4 end (next low after Wave 3)
                  for (let l = k + 1; l < pivots.length; l++) {
                    if (!pivots[l].isHigh) {
                      pattern.wave4_end = pivots[l].price;
                      pattern.wave4_end_time = pivots[l].timestamp;

                      // Wave 4 cannot overlap Wave 1
                      if (pattern.wave4_end <= pattern.wave1_end) break;

                      // Wave 4 retracement should be less than Wave 2
                      const wave4Size = pattern.wave3_end - pattern.wave4_end;
                      const wave2Size = pattern.wave1_end - pattern.wave2_end;
                      if (wave4Size >= wave2Size) break;

                      // Update and save Wave 4 completion
                      pattern.status = "Wave 5 Bullish";
                      patterns.push({ ...pattern });

                      // Found a valid Wave 4, now look for Wave 5
                      pattern.wave5_start = pattern.wave4_end;
                      pattern.status = "Wave 5 Bullish";

                      // Calculate target prices using Fibonacci extensions
                      const wave1Size = pattern.wave1_end - pattern.wave1_start;
                      pattern.target_price1 =
                        pattern.wave5_start + wave1Size * 0.618; // Conservative
                      pattern.target_price2 = pattern.wave5_start + wave1Size; // Moderate
                      pattern.target_price3 =
                        pattern.wave5_start + wave1Size * 1.618; // Aggressive

                      // Calculate confidence score based on pattern quality
                      const confidenceFactors = [
                        wave3Size > wave1Size * 1.618 ? 20 : 10, // Extended Wave 3
                        wave4Size < wave2Size * 0.618 ? 20 : 10, // Shallow Wave 4
                        Math.abs(
                          wave2Size / wave1Size - wave4Size / wave3Size,
                        ) > 0.3
                          ? 20
                          : 10, // Good alternation
                        wave1Size > minWaveSize * 2 ? 20 : 10, // Strong Wave 1
                        pattern.wave4_end > pattern.wave1_end * 1.1 ? 20 : 10, // Clear trend
                      ];
                      pattern.confidence = confidenceFactors.reduce(
                        (a, b) => a + b,
                        0,
                      );

                      // Check if this Wave 5 pattern is valid
                      if (
                        this.isValidWave5Pattern(
                          pattern,
                          prices[prices.length - 1].close,
                          prices,
                        )
                      ) {
                        patterns.push({ ...pattern });
                        // Exit early if we have enough patterns
                        if (patterns.length >= MAX_PATTERNS) {
                          return patterns;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return patterns;
  }
}
