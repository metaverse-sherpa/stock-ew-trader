import { supabase } from "../supabase";
import { sleep } from "../utils";
import type { Timeframe } from "../types";

export class YahooFinanceService {
  private static async fetchWithRetry(
    symbol: string,
    options: any,
    retries = 3,
  ) {
    for (let i = 0; i < retries; i++) {
      try {
        // Add a delay between retries
        if (i > 0) {
          await sleep(2000 * i); // Exponential backoff
        }

        const yahooFinance = await import("yahoo-finance2");
        const result = await yahooFinance.default.historical(symbol, {
          ...options,
          fetchOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          },
        });

        return result;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed for ${symbol}:`, error);
        if (i === retries - 1) throw error;
      }
    }
  }

  static async fetchHistoricalData(symbol: string, timeframe: Timeframe) {
    try {
      // Always fetch daily data and aggregate for smaller timeframes
      const interval = "1d";

      const startDate = new Date("2020-01-01");
      const endDate = new Date();

      console.log(
        `Fetching ${timeframe} data for ${symbol} from Yahoo Finance...`,
      );

      const yahooFinance = await import("yahoo-finance2");
      // Suppress the deprecation notice
      yahooFinance.default.suppressNotices(["ripHistorical"]);

      const result = await this.fetchWithRetry(symbol, {
        period1: startDate,
        period2: endDate,
        interval: interval,
      });

      if (!result?.length) {
        console.log(`No data returned for ${symbol}`);
        return;
      }

      let stockPrices = result
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
        .map((quote) => ({
          symbol,
          timeframe,
          timestamp: quote.date.toISOString(),
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume || 0,
        }));

      // Initialize intradayPrices array
      let intradayPrices: any[] = [];

      // For smaller timeframes, simulate intraday data from daily data
      if (timeframe === "1wk" || timeframe === "1mo" || timeframe === "1d") {
        // Generate 7 hourly candles per day (market hours)
        for (const dailyPrice of stockPrices) {
          const date = new Date(dailyPrice.timestamp);
          const range = dailyPrice.high - dailyPrice.low;
          const step = range / 6; // 7 points including start

          // Generate hourly prices for market hours (9:30 AM - 4:00 PM)
          for (let hour = 9; hour <= 16; hour++) {
            // Skip 9:00, start at 9:30
            if (hour === 9) {
              date.setHours(9, 30, 0, 0);
            } else {
              date.setHours(hour, 0, 0, 0);
            }

            // Generate a price within the day's range
            const hourlyPrice = {
              symbol,
              timeframe: "1h",
              timestamp: new Date(date).toISOString(),
              open:
                hour === 9
                  ? dailyPrice.open
                  : dailyPrice.low + step * (hour - 9),
              high: dailyPrice.low + step * (hour - 8.5),
              low: dailyPrice.low + step * (hour - 9.5),
              close:
                hour === 16
                  ? dailyPrice.close
                  : dailyPrice.low + step * (hour - 8),
              volume: Math.floor(dailyPrice.volume / 7),
            };

            intradayPrices.push(hourlyPrice);
          }
        }

        // Use the hourly data directly
        stockPrices = intradayPrices;
      }

      // Get stock details from Yahoo Finance
      const stockDetails = await yahooFinance.default.quote(symbol);

      // First ensure the stock exists with updated details
      await supabase.from("stocks").upsert({
        symbol,
        exchange: stockDetails.exchange || "NYSE",
        name: stockDetails.longName || stockDetails.shortName || symbol,
        market_cap: stockDetails.marketCap || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Clear existing data for this symbol and timeframe
      await supabase
        .from("stock_prices")
        .delete()
        .eq("symbol", symbol)
        .eq("timeframe", timeframe);

      // Then insert the new price data
      const { error } = await supabase.from("stock_prices").insert(stockPrices);

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
    const { MarketDataService } = await import("./marketDataService");
    const symbols = await MarketDataService.getTop100Stocks();

    try {
      // First, clear existing data
      console.log("Clearing existing data...");
      await supabase.from("wave_patterns").delete().neq("id", "dummy");
      await supabase.from("stock_prices").delete().neq("symbol", "dummy");
      await supabase.from("stocks").delete().neq("symbol", "dummy");
      console.log("Existing data cleared");

      const timeframes: Timeframe[] = ["1d", "1wk", "1mo"];

      // Then fetch new data for each symbol and timeframe
      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          try {
            await this.fetchHistoricalData(symbol, timeframe);
            // Add a delay to avoid rate limiting
            await sleep(2000);
          } catch (error) {
            console.error(`Error updating ${symbol} ${timeframe}:`, error);
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error in updateAllStocks:", error);
      throw error;
    }
  }
}
