import { config } from "dotenv";
config(); // Load environment variables

console.log("Starting seed process...");

// Import other modules
import { WavePatternService } from "../src/lib/services/wavePatternService";
import type { Timeframe } from "../src/lib/types";
import { supabase } from "../src/lib/supabase";

console.log("Starting data seeding process...");

async function generateSyntheticData(symbol: string) {
  const now = new Date();
  const data = [];
  const hoursBack = 365 * 24; // Generate 1 year of hourly data
  const basePrice = 100; // Starting price

  // Wave parameters
  const wave1Strength = 0.15; // 15% up
  const wave2Strength = -0.08; // 8% down
  const wave3Strength = 0.25; // 25% up
  const wave4Strength = -0.05; // 5% down
  const wave5Progress = 0.6; // Wave 5 is 60% complete
  const wave5TargetStrength = 0.2; // 20% up target

  let currentPrice = basePrice;
  let waveStartPrice = basePrice;

  for (let i = 0; i < hoursBack; i++) {
    const timestamp = new Date(
      now.getTime() - (hoursBack - i) * 60 * 60 * 1000,
    );

    const progress = i / hoursBack;
    let priceChange = 0;

    // Add some random noise
    const noise = (Math.random() - 0.5) * 0.002 * currentPrice;

    // Define wave boundaries
    const wave1End = 0.2;
    const wave2End = 0.35;
    const wave3End = 0.6;
    const wave4End = 0.75;
    // Wave 5 is in progress

    if (progress < wave1End) {
      // Wave 1 - Strong upward movement
      priceChange = (wave1Strength / wave1End) * currentPrice * 0.01;
    } else if (progress < wave2End) {
      // Wave 2 - Partial retracement
      priceChange =
        (wave2Strength / (wave2End - wave1End)) * currentPrice * 0.01;
    } else if (progress < wave3End) {
      // Wave 3 - Strongest upward movement
      priceChange =
        (wave3Strength / (wave3End - wave2End)) * currentPrice * 0.01;
    } else if (progress < wave4End) {
      // Wave 4 - Shallow retracement
      priceChange =
        (wave4Strength / (wave4End - wave3End)) * currentPrice * 0.01;
    } else {
      // Wave 5 - Final upward movement (in progress)
      const wave5StrengthSoFar = wave5TargetStrength * wave5Progress;
      priceChange = (wave5StrengthSoFar / (1 - wave4End)) * currentPrice * 0.01;
    }

    currentPrice += priceChange + noise;

    // Generate OHLC data with some randomness
    const volatility = Math.abs(priceChange) * 2;
    const open = currentPrice - volatility * (Math.random() - 0.5);
    const close = currentPrice;
    const high = Math.max(open, close) + volatility * Math.random();
    const low = Math.min(open, close) - volatility * Math.random();
    const volume = Math.floor(100000 + Math.random() * 900000);

    data.push({
      timestamp: Math.floor(timestamp.getTime() / 1000),
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return {
    timestamp: data.map((d) => d.timestamp),
    open: data.map((d) => d.open),
    high: data.map((d) => d.high),
    low: data.map((d) => d.low),
    close: data.map((d) => d.close),
    volume: data.map((d) => d.volume),
  };
}

function aggregateCandles(candles: any[], interval: number) {
  console.log(`Aggregating candles for interval ${interval}:`, {
    inputCandles: candles.length,
    firstCandle: candles[0],
    lastCandle: candles[candles.length - 1],
  });

  const aggregated = [];
  let currentGroup = [];
  let currentTimestamp = new Date(candles[0].timestamp);

  // Reset timestamp to the start of its period
  currentTimestamp.setMinutes(0, 0, 0);
  if (interval === 24 || interval === 168) {
    // For daily and weekly
    currentTimestamp.setHours(0);
    if (interval === 168) {
      // For weekly, set to start of week
      const day = currentTimestamp.getDay();
      currentTimestamp.setDate(currentTimestamp.getDate() - day);
    }
  }

  for (const candle of candles) {
    const candleTime = new Date(candle.timestamp);
    const shouldStartNewGroup =
      interval === 4
        ? // For 4h, check if we've crossed a 4-hour boundary
          Math.floor(candleTime.getHours() / 4) !==
          Math.floor(currentTimestamp.getHours() / 4)
        : interval === 24
          ? // For daily, check if it's a new day
            candleTime.getDate() !== currentTimestamp.getDate()
          : interval === 168
            ? // For weekly, check if we've crossed into a new week
              candleTime.getDay() < currentTimestamp.getDay()
            : // For hourly (shouldn't reach here as we don't aggregate 1h)
              false;

    if (shouldStartNewGroup && currentGroup.length > 0) {
      aggregated.push({
        timestamp: currentTimestamp.toISOString(),
        open: currentGroup[0].open,
        high: Math.max(...currentGroup.map((c) => c.high)),
        low: Math.min(...currentGroup.map((c) => c.low)),
        close: currentGroup[currentGroup.length - 1].close,
        volume: currentGroup.reduce((sum, c) => sum + c.volume, 0),
      });
      currentGroup = [];
      currentTimestamp = new Date(candle.timestamp);
      // Reset timestamp for the new group
      currentTimestamp.setMinutes(0, 0, 0);
      if (interval === 24 || interval === 168) {
        currentTimestamp.setHours(0);
        if (interval === 168) {
          const day = currentTimestamp.getDay();
          currentTimestamp.setDate(currentTimestamp.getDate() - day);
        }
      }
    }
    currentGroup.push(candle);
  }

  // Don't forget to add the last group
  if (currentGroup.length > 0) {
    aggregated.push({
      timestamp: currentTimestamp.toISOString(),
      open: currentGroup[0].open,
      high: Math.max(...currentGroup.map((c) => c.high)),
      low: Math.min(...currentGroup.map((c) => c.low)),
      close: currentGroup[currentGroup.length - 1].close,
      volume: currentGroup.reduce((sum, c) => sum + c.volume, 0),
    });
  }

  return aggregated;
}

async function seedData() {
  try {
    console.log("Starting data seeding process...");
    const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"];
    const timeframes: Timeframe[] = ["1h", "4h", "1d"];

    // Clear existing data
    console.log("Clearing existing data...");

    // Delete in correct order due to foreign key constraints
    const { error: waveError } = await supabase
      .from("wave_patterns")
      .delete()
      .not("symbol", "is", null);
    if (waveError) {
      console.error("Error deleting wave patterns:", waveError);
      throw waveError;
    } else {
      console.info("Wave patterns deleted successfully");
    }

    const { error: priceError } = await supabase
      .from("stock_prices")
      .delete()
      .not("symbol", "is", null);
    if (priceError) {
      console.error("Error deleting stock prices:", priceError);
      throw priceError;
    } else {
      console.info("Stock prices deleted");
    }

    const { error: stockError } = await supabase
      .from("stocks")
      .delete()
      .not("symbol", "is", null);
    if (stockError) {
      console.error("Error deleting stocks:", stockError);
      throw stockError;
    } else {
      console.info("Stocks deleted");
    }

    console.log("Existing data cleared successfully");

    for (const symbol of symbols) {
      console.log(`Processing ${symbol}...`);

      // Insert stock
      const { error: stockError } = await supabase.from("stocks").upsert({
        symbol,
        exchange: "NASDAQ",
        name: symbol,
      });

      if (stockError) {
        console.error(`Error inserting stock ${symbol}:`, stockError);
        continue;
      }

      // Generate synthetic data with clear Elliott Wave patterns
      const data = await generateSyntheticData(symbol);

      // Create base hourly candles
      const hourlyCandles = data.timestamp
        .map((timestamp, index) => ({
          timestamp: new Date(timestamp * 1000).toISOString(),
          open: data.open[index],
          high: data.high[index],
          low: data.low[index],
          close: data.close[index],
          volume: data.volume[index],
        }))
        .filter(
          (candle) =>
            candle.open !== null &&
            candle.high !== null &&
            candle.low !== null &&
            candle.close !== null &&
            candle.volume !== null,
        );

      console.log(`Base hourly candles for ${symbol}:`, {
        count: hourlyCandles.length,
        first: hourlyCandles[0],
        last: hourlyCandles[hourlyCandles.length - 1],
      });

      // Process each timeframe
      for (const timeframe of timeframes) {
        console.log(`Processing ${timeframe} data for ${symbol}...`);

        // Generate timeframe-specific data
        const timeframeData =
          timeframe === "1h"
            ? hourlyCandles
            : aggregateCandles(hourlyCandles, timeframe === "4h" ? 4 : 24);

        // Add symbol and timeframe to each candle
        const priceData = timeframeData.map((candle) => ({
          ...candle,
          symbol,
          timeframe,
        }));

        console.log(`Generated ${priceData.length} candles for ${timeframe}`);

        // Insert price data
        const { error: insertError } = await supabase
          .from("stock_prices")
          .upsert(priceData);

        if (insertError) {
          console.error(
            `Error inserting ${timeframe} data for ${symbol}:`,
            insertError,
          );
          continue;
        }

        // Generate wave patterns
        try {
          console.log(`Generating wave pattern for ${symbol} ${timeframe}`);
          await WavePatternService.generateWavePattern(symbol, timeframe);
          console.log(
            `Successfully generated wave pattern for ${symbol} ${timeframe}`,
          );
        } catch (error) {
          console.error(
            `Error generating wave pattern for ${symbol} ${timeframe}:`,
            error,
          );
        }

        // Wait between operations
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Wait between stocks
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

// Execute the seed function
seedData().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
