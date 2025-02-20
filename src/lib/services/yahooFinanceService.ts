import yahooFinance from "yahoo-finance2";
import { supabase } from "../supabase";
import type { Timeframe } from "../types";

export class YahooFinanceService {
  static async fetchHistoricalData(symbol: string, timeframe: Timeframe) {
    try {
      // Only fetch daily data
      if (timeframe !== "1d") return;

      const startDate = new Date("2022-01-01");
      const endDate = new Date();

      console.log(
        `Fetching ${timeframe} data for ${symbol} from Yahoo Finance...`,
      );

      // Suppress the deprecation notice
      yahooFinance.suppressNotices(["ripHistorical"]);

      const result = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: "1d",
      });

      if (!result?.length) {
        console.log(`No data returned for ${symbol}`);
        return;
      }

      // Transform the response to match our expected format
      const stockPrices = result
        .filter(
          (quote) =>
            // Filter out any invalid candles or dates
            quote.open &&
            quote.high &&
            quote.low &&
            quote.close &&
            quote.date &&
            !isNaN(quote.date.getTime()),
        )
        .map((quote) => {
          return {
            symbol,
            timeframe,
            timestamp: quote.date.toISOString(),
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            volume: quote.volume || 0,
          };
        });

      // First ensure the stock exists
      await supabase.from("stocks").upsert({
        symbol,
        exchange: "NYSE", // Default exchange
        name: symbol,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Then insert the price data
      const { error } = await supabase.from("stock_prices").upsert(stockPrices);

      if (error) {
        console.error(`Error inserting data for ${symbol}:`, error);
        return;
      }

      console.log(
        `Successfully stored ${stockPrices.length} candles for ${symbol}`,
      );
      return stockPrices;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  static async updateAllStocks() {
    const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]; // Add more symbols as needed

    try {
      // First, clear existing data
      console.log("Clearing existing data...");
      await supabase.from("wave_patterns").delete().neq("id", "dummy");
      await supabase.from("stock_prices").delete().neq("symbol", "dummy");
      await supabase.from("stocks").delete().neq("symbol", "dummy");
      console.log("Existing data cleared");

      // Then fetch new data for each symbol
      for (const symbol of symbols) {
        try {
          await this.fetchHistoricalData(symbol, "1d");
          // Add a delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error updating ${symbol}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error("Error in updateAllStocks:", error);
      throw error;
    }
  }
}
