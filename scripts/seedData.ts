import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceKey } from "./env";
import type { Timeframe } from "../src/lib/types";

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY (service role key) is required");
}

console.log("Starting data seeding process...");
console.log("Using service key:", supabaseServiceKey.slice(0, 10) + "...");

const supabase = createClient(supabaseUrl!, supabaseServiceKey);

async function fetchStockData(symbol: string) {
  // Get data for the last 30 days
  const to = Math.floor(Date.now() / 1000);
  const from = to - 365 * 24 * 60 * 60; // 365 days ago

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${from}&period2=${to}&interval=1h`;
  console.log(`Fetching from URL: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Yahoo: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("API Response received");

  if (!data.chart?.result?.[0]?.timestamp) {
    throw new Error(`Invalid API response: ${JSON.stringify(data)}`);
  }

  const result = data.chart.result[0];
  return {
    timestamp: result.timestamp,
    open: result.indicators.quote[0].open,
    high: result.indicators.quote[0].high,
    low: result.indicators.quote[0].low,
    close: result.indicators.quote[0].close,
    volume: result.indicators.quote[0].volume,
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

  console.log(`Aggregation complete for interval ${interval}:`, {
    outputCandles: aggregated.length,
    firstAggregated: aggregated[0],
    lastAggregated: aggregated[aggregated.length - 1],
  });
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

      // Fetch hourly data
      const data = await fetchStockData(symbol);

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

      // Generate and insert data for each timeframe
      for (const timeframe of timeframes) {
        console.log(`Processing ${timeframe} data for ${symbol}...`);

        let timeframeData;
        if (timeframe === "1h") {
          timeframeData = hourlyCandles;
        } else {
          const interval = timeframe === "4h" ? 4 : 24; // 24 hours in a day
          timeframeData = aggregateCandles(hourlyCandles, interval);
        }

        // Add symbol and timeframe to each candle
        const priceData = timeframeData.map((candle) => ({
          ...candle,
          symbol,
          timeframe,
        }));

        console.log(`Generated ${priceData.length} candles for ${timeframe}`);

        console.log(`Inserting ${timeframe} data for ${symbol}:`, {
          count: priceData.length,
          first: priceData[0],
          last: priceData[priceData.length - 1],
        });

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

        // Verify the insert
        const { data: verifyData, error: verifyError } = await supabase
          .from("stock_prices")
          .select("*")
          .eq("symbol", symbol)
          .eq("timeframe", timeframe);

        console.log(`Verification for ${timeframe} ${symbol}:`, {
          insertedCount: verifyData?.length || 0,
          verifyError: verifyError?.message,
        });

        // Generate and insert wave pattern
        const currentPrice = priceData[priceData.length - 1].close;
        const { error: waveError } = await supabase
          .from("wave_patterns")
          .upsert({
            symbol,
            timeframe,
            exchange: "NASDAQ",
            status: "Wave 5 Bullish",
            confidence: Math.floor(Math.random() * 30) + 70,
            current_price: currentPrice,
            start_time: priceData[0].timestamp,
            wave1_start: currentPrice * 0.9,
            wave1_end: currentPrice * 1.1,
            wave2_start: currentPrice * 1.1,
            wave2_end: currentPrice * 1.0,
            wave3_start: currentPrice * 1.0,
            wave3_end: currentPrice * 1.2,
            wave4_start: currentPrice * 1.2,
            wave4_end: currentPrice * 1.15,
            wave5_start: currentPrice * 1.15,
            target_price1: currentPrice * 1.05,
            target_price2: currentPrice * 1.1,
            target_price3: currentPrice * 1.15,
          });

        if (waveError) {
          console.error(
            `Error inserting wave pattern for ${symbol} ${timeframe}:`,
            waveError,
          );
        }

        console.log(`Successfully processed ${timeframe} data for ${symbol}`);
      }

      // Wait 1 second between stocks to respect rate limits
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
