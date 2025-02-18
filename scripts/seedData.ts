import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey, alphaVantageApiKey } from "./env";

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

const BASE_URL = "https://www.alphavantage.co/query";

async function fetchStockData(symbol: string) {
  const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&outputsize=full&apikey=${alphaVantageApiKey}`;
  console.log(`Fetching from URL: ${url}`);
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      `Failed to fetch from Alpha Vantage: ${response.statusText}`,
    );
  const data = await response.json();
  console.log("API Response:", JSON.stringify(data, null, 2));

  if (!data["Time Series (60min)"]) {
    throw new Error(`Invalid API response format: ${JSON.stringify(data)}`);
  }

  return data;
}

async function seedData() {
  try {
    console.log("Starting data seeding process...");
    const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"];
    const timeframes = ["1h", "4h", "1d", "1w"];

    for (const symbol of symbols) {
      console.log(`Fetching data for ${symbol}...`);

      // Insert stock
      const { error: stockError } = await supabase.from("stocks").upsert({
        symbol,
        exchange: "NYSE",
        name: symbol,
      });

      if (stockError) {
        console.error(`Error inserting stock ${symbol}:`, stockError);
        continue;
      }

      // Fetch and insert price data
      const data = await fetchStockData(symbol);
      const prices = Object.entries(data["Time Series (60min)"]).map(
        ([timestamp, values]: [string, any]) => ({
          symbol,
          timeframe: "1h",
          timestamp,
          open: parseFloat(values["1. open"]),
          high: parseFloat(values["2. high"]),
          low: parseFloat(values["3. low"]),
          close: parseFloat(values["4. close"]),
          volume: parseInt(values["5. volume"]),
        }),
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
        const currentPrice = prices[0].close;
        const { error: waveError } = await supabase
          .from("wave_patterns")
          .upsert({
            symbol,
            timeframe,
            exchange: "NYSE",
            status: "Wave 5 Bullish",
            confidence: Math.floor(Math.random() * 30) + 70,
            current_price: currentPrice,
            start_time: prices[prices.length - 1].timestamp,
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
      // Wait 12 seconds between API calls
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

seedData();
