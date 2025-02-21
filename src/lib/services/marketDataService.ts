import yahooFinance from "yahoo-finance2";
import { supabase } from "../supabase";

export class MarketDataService {
  static async getTop100Stocks() {
    try {
      // First try to get from database
      const { data: stocks, error } = await supabase
        .from("stocks")
        .select("*")
        .order("market_cap", { ascending: false });

      if (error) throw error;

      // If we have 100 or more stocks, just return the top 100
      if (stocks?.length >= 100) {
        console.log("Found existing stocks in database, using top 100");
        return stocks
          .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
          .slice(0, 100)
          .map((s) => s.symbol);
      }

      console.log(
        `Only found ${stocks?.length || 0} stocks in database, fetching new data...`,
      );

      // If not in database, fetch top stocks by market cap
      const topStocks = [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "NVDA",
        "META",
        "BRK-B",
        "LLY",
        "AVGO",
        "TSLA",
        "V",
        "UNH",
        "JPM",
        "XOM",
        "MA",
        "JNJ",
        "PG",
        "HD",
        "ORCL",
        "MRK",
        "CVX",
        "KO",
        "PEP",
        "ABBV",
        "COST",
        "BAC",
        "TMO",
        "ADBE",
        "MCD",
        "CRM",
        "ACN",
        "DHR",
        "ABT",
        "WMT",
        "LIN",
        "AMD",
        "CSCO",
        "NFLX",
        "CMCSA",
        "VZ",
      ];

      const stockDetails = [];
      for (const symbol of topStocks) {
        try {
          const quote = await yahooFinance.quote(symbol);
          stockDetails.push({
            symbol,
            name: quote.longName || quote.shortName || symbol,
            exchange: quote.exchange || "NYSE",
            market_cap: quote.marketCap || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching details for ${symbol}:`, error);
        }
      }

      const sp500Components = stockDetails
        .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
        .map((quote) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          exchange: quote.exchange || "NYSE",
          market_cap: quote.marketCap || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      // Store in database
      await supabase.from("stocks").upsert(sp500Components);

      return sp500Components.map((s) => s.symbol);
    } catch (error) {
      console.error("Error fetching top 100 stocks:", error);
      // Fallback to a default list of major stocks if all else fails
      return [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "META",
        "NVDA",
        "BRK-B",
        "TSLA",
        "UNH",
        "JNJ",
        "XOM",
        "JPM",
        "V",
        "PG",
        "MA",
        "HD",
        "CVX",
        "ABBV",
        "MRK",
        "LLY",
      ];
    }
  }
}
