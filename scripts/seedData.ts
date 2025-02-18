import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Use service role key for admin operations like deletion
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_ANON_KEY (service role key) is required");
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey);

interface YahooCandle {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

async function fetchStockData(symbol: string): Promise<YahooCandle> {
  // Get data for the last 30 days
  const to = Math.floor(Date.now() / 1000);
  const from = to - 30 * 24 * 60 * 60; // 30 days ago

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

async function seedData() {
  try {
    console.log("Starting data seeding process...");
    const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"];
    const timeframes = ["1h", "4h", "1d", "1w"];

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
    }

    const { error: priceError } = await supabase
      .from("stock_prices")
      .delete()
      .not("symbol", "is", null);
    if (priceError) {
      console.error("Error deleting stock prices:", priceError);
      throw priceError;
    }

    const { error: stockError } = await supabase
      .from("stocks")
      .delete()
      .not("symbol", "is", null);
    if (stockError) {
      console.error("Error deleting stocks:", stockError);
      throw stockError;
    }

    console.log("Existing data cleared successfully");

    for (const symbol of symbols) {
      console.log(`Fetching data for ${symbol}...`);

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

      // Fetch and insert price data
      const data = await fetchStockData(symbol);

      const prices = data.timestamp
        .map((timestamp, index) => ({
          symbol,
          timeframe: "1h",
          timestamp: new Date(timestamp * 1000).toISOString(),
          open: data.open[index],
          high: data.high[index],
          low: data.low[index],
          close: data.close[index],
          volume: data.volume[index],
        }))
        .filter(
          (price) =>
            price.open !== null &&
            price.high !== null &&
            price.low !== null &&
            price.close !== null &&
            price.volume !== null,
        );

      const { error: priceError } = await supabase
        .from("stock_prices")
        .upsert(prices);
      if (priceError) {
        console.error(`Error inserting prices for ${symbol}:`, priceError);
        continue;
      }

      // Generate wave patterns
      for (const timeframe of timeframes) {
        const currentPrice = prices[prices.length - 1].close;
        const { error: waveError } = await supabase
          .from("wave_patterns")
          .upsert({
            symbol,
            timeframe,
            exchange: "NASDAQ",
            status: "Wave 5 Bullish",
            confidence: Math.floor(Math.random() * 30) + 70,
            current_price: currentPrice,
            start_time: prices[0].timestamp,
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
      }

      console.log(`Successfully processed ${symbol}`);
      // Wait 1 second between API calls to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

export { seedData };
