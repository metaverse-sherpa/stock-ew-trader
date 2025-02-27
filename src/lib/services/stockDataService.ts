import { supabase } from "../supabase.client";
import type { Timeframe } from "../types.js";

const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

interface AlphaVantageResponse {
  "Time Series (60min)": Record<
    string,
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    }
  >;
}

export class StockDataService {
  private static async shouldUpdateStock(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("stock_prices")
      .select("timestamp")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (!data) return true;

    const lastUpdate = new Date(data.timestamp);
    const now = new Date();
    const hoursSinceLastUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // Update if more than 24 hours have passed
    return hoursSinceLastUpdate >= 24;
  }

  private static async fetchAlphaVantageData(
    symbol: string,
  ): Promise<AlphaVantageResponse> {
    const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch from Alpha Vantage");
    return response.json();
  }

  private static async insertStockData(
    symbol: string,
    timeframe: Timeframe,
    data: any,
  ) {
    // First ensure the stock exists
    await supabase.from("stocks").upsert({
      symbol,
      exchange: "NYSE", // Default exchange, you might want to fetch this from somewhere
      name: symbol,
    });

    // Then insert the price data
    const priceData = Object.entries(data["Time Series (60min)"]).map(
      ([timestamp, values]) => ({
        symbol,
        timeframe,
        timestamp,
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseInt(values["5. volume"]),
      }),
    );

    await supabase.from("stock_prices").upsert(priceData);
  }

  static async updateStockData(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<void> {
    try {
      const needsUpdate = await this.shouldUpdateStock(symbol, timeframe);
      if (!needsUpdate) {
        console.log(`Stock ${symbol} data is up to date`);
        return;
      }

      console.log(`Fetching new data for ${symbol}`);
      const data = await this.fetchAlphaVantageData(symbol);
      await this.insertStockData(symbol, timeframe, data);
      console.log(`Successfully updated ${symbol} data`);
    } catch (error) {
      console.error(`Error updating ${symbol} data:`, error);
      throw error;
    }
  }

  static async seedInitialData(): Promise<void> {
    const initialStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"];
    const timeframes: Timeframe[] = ["1h", "4h", "1d", "1w"];

    for (const symbol of initialStocks) {
      for (const timeframe of timeframes) {
        await this.updateStockData(symbol, timeframe);
        // Sleep for 12 seconds between API calls to respect Alpha Vantage's rate limit
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }
  }
}
