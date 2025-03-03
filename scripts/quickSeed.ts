import { config } from "dotenv";
config();

import { supabase } from "../src/lib/supabase";
import { WavePatternService } from "../src/lib/services/wavePatternService";
import { generateUUID } from "../src/lib/utils";

async function quickSeed() {
  try {
    console.log("Starting quick seed process...");

    // Get stock symbols from the stocks table
    console.log("Fetching stocks from database...");
    const { data: stocks, error: stocksError } = await supabase
      .from("stocks")
      .select("*");

    if (stocksError) {
      console.error("Error fetching stocks:", stocksError);
      throw stocksError;
    }

    if (!stocks || stocks.length === 0) {
      console.error("No stocks found in the database");
      return;
    }

    console.log(`Found ${stocks.length} stocks in the database`);

    // Process each stock
    const timeframes = ["1d", "1wk", "1mo"];

    for (const stock of stocks) {
      console.log(`Processing ${stock.symbol}...`);

      for (const timeframe of timeframes) {
        // Get historical price data for this stock and timeframe
        console.log(
          `Fetching price data for ${stock.symbol} (${timeframe})...`,
        );
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

        if (!prices || prices.length === 0) {
          console.log(
            `No price data found for ${stock.symbol} (${timeframe}), skipping...`,
          );
          continue;
        }

        console.log(
          `Found ${prices.length} price points for ${stock.symbol} (${timeframe})`,
        );

        // Find pivot points
        console.log(`Finding pivot points for ${stock.symbol}...`);
        const pivots = findPivotPoints(prices);
        console.log(`Found ${pivots.length} pivot points`);

        // Find wave patterns
        console.log(`Finding Elliott Wave patterns for ${stock.symbol}...`);
        const patterns = findElliottWavePatterns(pivots, prices);
        console.log(`Found ${patterns.length} potential patterns`);

        // Store each pattern
        for (const pattern of patterns) {
          console.log(`Storing pattern for ${stock.symbol}:`, pattern);
          const { error: insertError } = await supabase
            .from("wave_patterns")
            .upsert({
              id: generateUUID(),
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

    console.log("Quick seed completed successfully!");
  } catch (error) {
    console.error("Error during quick seed:", error);
    throw error;
  }
}

// Helper function to find pivot points in price data
function findPivotPoints(prices) {
  const pivots = [];
  const lookback = 5; // Increased lookback for more significant pivots

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

// Helper function to find Elliott Wave patterns
function findElliottWavePatterns(pivots, prices) {
  const patterns = [];
  if (!prices?.length) return patterns;

  const MAX_PATTERNS = 10;
  const MAX_LOOKBACK = 100; // Increased lookback for longer-term patterns
  pivots = pivots.slice(-MAX_LOOKBACK);

  const minWaveSize =
    (prices[prices.length - 1].close - prices[0].close) * 0.02; // 2% of total range

  // Find potential Wave 1 starts (significant lows)
  for (let i = 0; i < pivots.length - 20; i++) {
    if (!pivots[i].isHigh) {
      // Check if price ever goes below this potential Wave 1 start
      const wave1StartTime = pivots[i].timestamp;
      const wave1StartIndex = prices.findIndex(
        (p) => p.timestamp === wave1StartTime,
      );
      const pricesAfterWave1Start = prices.slice(wave1StartIndex);
      const invalidated = pricesAfterWave1Start.some(
        (p) => p.low < pivots[i].price,
      );
      if (invalidated) continue;

      let pattern = {
        wave1_start: pivots[i].price,
        wave1_start_time: pivots[i].timestamp,
        wave1_end: null,
        wave1_end_time: null,
        wave2_end: null,
        wave2_end_time: null,
        wave3_end: null,
        wave3_end_time: null,
        wave4_end: null,
        wave4_end_time: null,
        wave5_start: null,
        wave5_end: null,
        wave5_end_time: null,
        status: "Wave 1",
        confidence: 0,
      };

      // Look for Wave 1 end (next significant high)
      for (let j = i + 1; j < pivots.length; j++) {
        if (pivots[j].isHigh) {
          pattern.wave1_end = pivots[j].price;
          pattern.wave1_end_time = pivots[j].timestamp;
          const wave1Size = pattern.wave1_end - pattern.wave1_start;

          if (wave1Size < minWaveSize) continue;

          // Look for Wave 2 end (next significant low)
          for (let k = j + 1; k < pivots.length; k++) {
            if (!pivots[k].isHigh) {
              const wave2End = pivots[k].price;
              if (wave2End <= pattern.wave1_start) continue; // Wave 2 can't go below Wave 1 start

              pattern.wave2_end = wave2End;
              pattern.wave2_end_time = pivots[k].timestamp;
              const wave2Size = pattern.wave1_end - wave2End;

              // Wave 2 should retrace between 38.2% and 78.6% of Wave 1
              const wave2Retracement = (wave2Size / wave1Size) * 100;
              if (wave2Retracement < 38.2 || wave2Retracement > 78.6) continue;

              // Look for Wave 3 end (next significant high)
              for (let l = k + 1; l < pivots.length; l++) {
                if (pivots[l].isHigh) {
                  const wave3End = pivots[l].price;
                  const wave3Size = wave3End - pattern.wave2_end;

                  // Wave 3 must be at least 1.618 times Wave 1
                  if (wave3Size < wave1Size * 1.618) continue;

                  // Wave 3 must be the highest point so far
                  const isHighestPoint = pivots
                    .slice(i, l + 1)
                    .every((pivot) => pivot.price <= wave3End);
                  if (!isHighestPoint) continue;

                  pattern.wave3_end = wave3End;
                  pattern.wave3_end_time = pivots[l].timestamp;

                  // Look for Wave 4 end (next significant low)
                  for (let m = l + 1; m < pivots.length; m++) {
                    if (!pivots[m].isHigh) {
                      const wave4End = pivots[m].price;

                      // Wave 4 must end lower than where it started (Wave 3 end)
                      if (wave4End >= wave3End) continue;

                      // Wave 4 must retrace at least 23.6% but not more than 38.2% of Wave 3
                      const wave4Retracement =
                        ((wave3End - wave4End) / wave3Size) * 100;
                      if (wave4Retracement < 23.6 || wave4Retracement > 38.2)
                        continue;

                      pattern.wave4_end = wave4End;
                      pattern.wave4_end_time = pivots[m].timestamp;
                      pattern.wave5_start = wave4End;
                      pattern.status = "Wave 5 Bullish";

                      // Calculate Wave 5 target prices using Fibonacci extensions
                      // Wave 5 targets are measured from Wave 4 end, using Wave 1 size
                      // Common Fibonacci extension levels for Wave 5: 1.618, 2.618, 4.236
                      const wave5StartPrice = wave4End;
                      pattern.target_price1 =
                        wave5StartPrice + wave1Size * 1.618; // Minimum target (161.8%)
                      pattern.target_price2 =
                        wave5StartPrice + wave1Size * 2.618; // Typical target (261.8%)
                      pattern.target_price3 =
                        wave5StartPrice + wave1Size * 4.236; // Extended target (423.6%)

                      // Calculate confidence score
                      const confidenceFactors = [
                        wave3Size > wave1Size * 1.618 ? 20 : 10, // Extended Wave 3
                        wave4Retracement < 38.2 ? 20 : 10, // Shallow Wave 4
                        wave2Retracement > 50 ? 20 : 10, // Deep Wave 2
                        wave1Size > minWaveSize * 2 ? 20 : 10, // Strong Wave 1
                        pattern.wave4_end > pattern.wave1_end * 1.1 ? 20 : 10, // Clear trend
                      ];
                      pattern.confidence = confidenceFactors.reduce(
                        (a, b) => a + b,
                        0,
                      );

                      if (
                        isValidWave5Pattern(
                          pattern,
                          prices[prices.length - 1].close,
                          prices,
                        )
                      ) {
                        patterns.push({ ...pattern });
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
  }

  return patterns;
}

// Helper function to validate Wave 5 patterns
function isValidWave5Pattern(pattern, currentPrice, prices) {
  // If current price drops below Wave 4 end (Wave 5 start), pattern is invalidated
  if (currentPrice < pattern.wave4_end) {
    return false;
  }
  // Check if Wave 4 has retraced into Wave 1 territory
  if (pattern.wave4_end <= pattern.wave1_end) return false;

  // Find Wave 5 high point
  const wave4EndIndex = prices.findIndex(
    (p) => p.timestamp === pattern.wave4_end_time,
  );
  const pricesSinceWave4 = prices.slice(wave4EndIndex);
  const highestPrice = Math.max(...pricesSinceWave4.map((p) => p.high));
  const highestPriceIndex = pricesSinceWave4.findIndex(
    (p) => p.high === highestPrice,
  );

  // Wave 5 must exceed Wave 3's high
  if (highestPrice <= pattern.wave3_end) {
    // If we haven't exceeded Wave 3's high, this isn't a valid pattern
    return false;
  }

  // Wave 5 is still in progress if current price hasn't exceeded Wave 3
  // and hasn't dropped below Wave 4 end
  if (currentPrice <= pattern.wave3_end && currentPrice >= pattern.wave4_end) {
    pattern.status = "Wave 5 Bullish";
    return true;
  }

  // Wave 5 should be at least 0.618 times Wave 1
  const wave1Size = pattern.wave1_end - pattern.wave1_start;
  const wave5Size = highestPrice - pattern.wave4_end;
  if (wave5Size < wave1Size * 0.618) return false;

  // Wave 5 shouldn't extend beyond 2.618 times Wave 1
  const wave5Move = currentPrice - pattern.wave4_end;
  if (wave5Move > wave1Size * 2.618) return false;

  return true;
}

// Execute the seed function
quickSeed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
