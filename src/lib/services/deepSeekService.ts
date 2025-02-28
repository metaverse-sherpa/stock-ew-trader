import { supabase } from "../supabase";
import { globalCache } from "../cache";

interface StockNews {
  title: string;
  source: string;
  url: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  date: string;
}

interface StockSentiment {
  symbol: string;
  overallSentiment: "positive" | "negative" | "neutral";
  sentimentScore: number; // -1 to 1
  news: StockNews[];
  socialMedia: {
    source: string;
    count: number;
    sentiment: "positive" | "negative" | "neutral";
  }[];
  upcomingEvents: {
    type: string;
    date: string;
    description: string;
  }[];
}

export class DeepSeekService {
  private static CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private static API_URL = "https://api.deepseek.com/v1";
  private static API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

  /**
   * Get stock sentiment and news data from DeepSeek API
   */
  static async getStockSentiment(
    symbol: string,
  ): Promise<StockSentiment | null> {
    try {
      // Check cache first
      const cacheKey = `deepseek_sentiment_${symbol}`;
      const cachedData = globalCache.get<StockSentiment>(cacheKey);

      if (cachedData) {
        console.log(`Using cached sentiment data for ${symbol}`);
        return cachedData;
      }

      // If no API key is set, return mock data
      if (!this.API_KEY) {
        console.warn("No DeepSeek API key provided, using mock data");
        const mockData = this.getMockSentimentData(symbol);
        globalCache.set(cacheKey, mockData, this.CACHE_TTL);
        return mockData;
      }

      // Make API request to DeepSeek
      const response = await fetch(`${this.API_URL}/sentiment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          symbol: symbol,
          includeNews: true,
          includeSocial: true,
          includeEvents: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      globalCache.set(cacheKey, data, this.CACHE_TTL);

      return data;
    } catch (error) {
      console.error(`Error fetching sentiment data for ${symbol}:`, error);

      // Return mock data on error
      const mockData = this.getMockSentimentData(symbol);
      return mockData;
    }
  }

  /**
   * Generate mock sentiment data for testing when API key is not available
   */
  private static getMockSentimentData(symbol: string): StockSentiment {
    const sentiments = ["positive", "negative", "neutral"] as const;
    const randomSentiment =
      sentiments[Math.floor(Math.random() * sentiments.length)];
    const randomScore = parseFloat((Math.random() * 2 - 1).toFixed(2));

    return {
      symbol,
      overallSentiment: randomSentiment,
      sentimentScore: randomScore,
      news: [
        {
          title: `${symbol} Reports Strong Quarterly Earnings`,
          source: "Financial Times",
          url: "https://example.com/news/1",
          summary: `${symbol} exceeded analyst expectations with quarterly revenue growth of 15% year-over-year.`,
          sentiment: "positive",
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          title: `Analyst Downgrades ${symbol} on Valuation Concerns`,
          source: "Bloomberg",
          url: "https://example.com/news/2",
          summary: `Leading analyst firm has downgraded ${symbol} citing concerns about current valuation levels.`,
          sentiment: "negative",
          date: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          title: `${symbol} Announces New Product Line`,
          source: "Reuters",
          url: "https://example.com/news/3",
          summary: `${symbol} unveiled its new product line expected to launch next quarter.`,
          sentiment: "neutral",
          date: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
      socialMedia: [
        {
          source: "Twitter",
          count: Math.floor(Math.random() * 1000) + 500,
          sentiment: "positive",
        },
        {
          source: "Reddit",
          count: Math.floor(Math.random() * 500) + 100,
          sentiment: "neutral",
        },
        {
          source: "StockTwits",
          count: Math.floor(Math.random() * 300) + 50,
          sentiment: "negative",
        },
      ],
      upcomingEvents: [
        {
          type: "Earnings Call",
          date: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks in future
          description: `${symbol} Q2 Earnings Conference Call`,
        },
        {
          type: "Investor Day",
          date: new Date(Date.now() + 2592000000).toISOString(), // 30 days in future
          description: `${symbol} Annual Investor Conference`,
        },
      ],
    };
  }

  /**
   * Store sentiment data in Supabase for historical tracking
   */
  static async storeSentimentData(
    symbol: string,
    data: StockSentiment,
  ): Promise<void> {
    try {
      // Store the main sentiment record
      const { error } = await supabase.from("stock_sentiment").upsert({
        symbol,
        overall_sentiment: data.overallSentiment,
        sentiment_score: data.sentimentScore,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Store news items
      if (data.news?.length) {
        const newsItems = data.news.map((news) => ({
          symbol,
          title: news.title,
          source: news.source,
          url: news.url,
          summary: news.summary,
          sentiment: news.sentiment,
          news_date: news.date,
          created_at: new Date().toISOString(),
        }));

        const { error: newsError } = await supabase
          .from("stock_news")
          .upsert(newsItems);
        if (newsError) console.error("Error storing news data:", newsError);
      }

      // Store upcoming events
      if (data.upcomingEvents?.length) {
        const events = data.upcomingEvents.map((event) => ({
          symbol,
          event_type: event.type,
          event_date: event.date,
          description: event.description,
          created_at: new Date().toISOString(),
        }));

        const { error: eventsError } = await supabase
          .from("stock_events")
          .upsert(events);
        if (eventsError)
          console.error("Error storing events data:", eventsError);
      }

      console.log(`Successfully stored sentiment data for ${symbol}`);
    } catch (error) {
      console.error(`Error storing sentiment data for ${symbol}:`, error);
      throw error;
    }
  }
}
