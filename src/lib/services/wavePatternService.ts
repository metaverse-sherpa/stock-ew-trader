import { supabase } from "../supabase";
import type { Timeframe, WaveStatus, StockPrice } from "../types";

export class WavePatternService {
  static async generateWavePattern(symbol: string, timeframe: Timeframe) {
    // Get historical prices ordered by time
    const { data: prices } = await supabase
      .from("stock_prices")
      .select("*")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .order("timestamp", { ascending: true });

    if (!prices?.length) return;

    // Find significant price swings to identify wave points
    const swings = this.findPriceSwings(prices);
    console.log(`Found ${swings.length} swings for ${symbol} ${timeframe}`);

    if (swings.length < 5) {
      console.log(
        `Not enough swings (${swings.length}) to generate wave pattern for ${symbol} ${timeframe}`,
      );
      return;
    }

    const currentPrice = prices[prices.length - 1].close;
    const startPrice = swings[0].price;

    // Ensure we have all the required points
    const wave1_start = swings[0].price;
    const wave1_end = swings[1].price;
    const wave2_start = wave1_end;
    const wave2_end = swings[2].price;
    const wave3_start = wave2_end;
    const wave3_end = swings[3].price;
    const wave4_start = wave3_end;
    const wave4_end = swings[4].price;
    const wave5_start = wave4_end;

    // Validate all wave points exist
    if (
      !wave1_start ||
      !wave1_end ||
      !wave2_end ||
      !wave3_end ||
      !wave4_end ||
      !wave5_start
    ) {
      console.log("Invalid wave points detected");
      return;
    }

    // Calculate confidence based on pattern adherence
    const confidence = this.calculateConfidence({
      prices,
      wave1: { start: wave1_start, end: wave1_end },
      wave2: { start: wave2_start, end: wave2_end },
      wave3: { start: wave3_start, end: wave3_end },
      wave4: { start: wave4_start, end: wave4_end },
      wave5: { start: wave5_start, end: currentPrice },
    });

    // Determine wave status
    const status = this.determineWaveStatus({
      currentPrice,
      wave4End: wave4_end,
      wave5Start: wave5_start,
      prices,
    });

    const pattern = {
      symbol,
      timeframe,
      exchange: "NYSE",
      status,
      confidence,
      current_price: currentPrice,
      start_time: prices[0].timestamp,
      wave1_start,
      wave1_end,
      wave2_start,
      wave2_end,
      wave3_start,
      wave3_end,
      wave4_start,
      wave4_end,
      wave5_start,
      target_price1: this.calculateTarget(currentPrice, wave5_start, 1),
      target_price2: this.calculateTarget(currentPrice, wave5_start, 2),
      target_price3: this.calculateTarget(currentPrice, wave5_start, 3),
    };

    console.log(`Generated pattern for ${symbol} ${timeframe}:`, pattern);

    await supabase.from("wave_patterns").upsert(pattern);
  }

  private static findPriceSwings(
    prices: StockPrice[],
  ): Array<{ price: number; timestamp: string }> {
    if (!prices || prices.length === 0) {
      console.log("No prices provided to findPriceSwings");
      return [];
    }
    const swings: Array<{ price: number; timestamp: string }> = [];

    // Adjust window size based on timeframe and data length
    let windowSize: number;
    const timeframe = prices[0]?.timeframe;
    switch (timeframe) {
      case "1h":
        windowSize = Math.floor(prices.length * 0.05); // 5% for hourly
        break;
      case "4h":
        windowSize = Math.floor(prices.length * 0.1); // 10% for 4-hour
        break;
      case "1d":
        windowSize = Math.floor(prices.length * 0.15); // 15% for daily
        break;
      default:
        windowSize = Math.floor(prices.length * 0.1);
    }

    // Ensure minimum window size
    windowSize = Math.max(windowSize, 3);

    // Track volatility for adaptive threshold
    const volatility = this.calculateVolatility(prices);
    const threshold =
      volatility * (timeframe === "1h" ? 0.3 : timeframe === "4h" ? 0.5 : 0.7);

    let lastSwing = null;
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      const before = prices.slice(i - windowSize, i);
      const after = prices.slice(i + 1, i + windowSize + 1);
      const current = prices[i];

      // Calculate local volatility
      const localHigh = Math.max(
        ...before.map((p) => p.high),
        ...after.map((p) => p.high),
      );
      const localLow = Math.min(
        ...before.map((p) => p.low),
        ...after.map((p) => p.low),
      );

      // Check if this is a significant local maximum or minimum
      const isMax =
        before.every((p) => p.high <= current.high) &&
        after.every((p) => p.high <= current.high) &&
        current.high - localLow > threshold;

      const isMin =
        before.every((p) => p.low >= current.low) &&
        after.every((p) => p.low >= current.low) &&
        localHigh - current.low > threshold;

      // Ensure minimum distance between swings
      if (
        (isMax || isMin) &&
        (!lastSwing || Math.abs(i - lastSwing) > windowSize)
      ) {
        swings.push({
          price: isMax ? current.high : current.low,
          timestamp: current.timestamp,
        });
        lastSwing = i;
      }
    }

    // If we don't have enough swings, try to find more significant ones
    if (swings.length < 5) {
      console.log(
        `Not enough swings found (${swings.length}), trying alternative method`,
      );
      return this.findPriceSwingsAlternative(prices);
    }

    return swings;
  }

  private static calculateVolatility(prices: StockPrice[]): number {
    const returns = prices.slice(1).map((price, i) => {
      return (price.close - prices[i].close) / prices[i].close;
    });
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;
    return Math.sqrt(variance);
  }

  private static findPriceSwingsAlternative(
    prices: StockPrice[],
  ): Array<{ price: number; timestamp: string }> {
    const swings: Array<{ price: number; timestamp: string }> = [];
    const segments = 5; // We need exactly 5 points for Elliott Wave
    const segmentSize = Math.floor(prices.length / segments);

    // Find local extremes in each segment
    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize;
      const end = i === segments - 1 ? prices.length : (i + 1) * segmentSize;
      const segment = prices.slice(start, end);

      if (segment.length === 0) continue;

      // Alternate between finding highs and lows
      const extreme =
        i % 2 === 0
          ? Math.max(...segment.map((p) => p.high))
          : Math.min(...segment.map((p) => p.low));

      // Find the timestamp where this extreme occurred
      const extremePoint =
        segment.find((p) =>
          i % 2 === 0 ? p.high === extreme : p.low === extreme,
        ) || segment[Math.floor(segment.length / 2)];

      swings.push({
        price: extreme,
        timestamp: extremePoint.timestamp,
      });
    }

    return swings;
  }

  private static calculateConfidence(params: {
    prices: StockPrice[];
    wave1: { start: number; end: number };
    wave2: { start: number; end: number };
    wave3: { start: number; end: number };
    wave4: { start: number; end: number };
    wave5: { start: number; end: number };
  }): number {
    const { wave1, wave2, wave3, wave4, wave5 } = params;
    let confidence = 100;

    // Elliott Wave Rules
    // 1. Wave 2 never retraces more than 100% of Wave 1
    if (wave2.end <= wave1.start) confidence -= 20;

    // 2. Wave 3 is never the shortest among waves 1, 3, and 5
    const wave1Size = Math.abs(wave1.end - wave1.start);
    const wave3Size = Math.abs(wave3.end - wave3.start);
    const wave5Size = Math.abs(wave5.end - wave5.start);
    if (wave3Size < wave1Size || wave3Size < wave5Size) confidence -= 20;

    // 3. Wave 4 never enters Wave 1's price territory
    if (wave4.end <= wave1.end) confidence -= 20;

    return Math.max(confidence, 0);
  }

  private static determineWaveStatus(params: {
    currentPrice: number;
    wave4End: number;
    wave5Start: number;
    prices: StockPrice[];
  }): WaveStatus {
    const { currentPrice, wave4End, wave5Start, prices } = params;
    const recentPrices = prices.slice(-5);
    const trend =
      recentPrices[recentPrices.length - 1].close > recentPrices[0].close;

    if (currentPrice > wave4End && trend) {
      return "Wave 5 Bullish";
    } else if (currentPrice < wave4End && !trend) {
      return "Wave 5 Bearish";
    } else {
      return "Wave 5 Bullish"; // Default to bullish if uncertain
    }
  }

  private static calculateTarget(
    currentPrice: number,
    wave5Start: number,
    targetLevel: number,
  ): number {
    const wave5Move = Math.abs(currentPrice - wave5Start);
    const fibonacci = [1.618, 2.618, 3.618]; // Common Fibonacci extension levels
    const extension = fibonacci[targetLevel - 1] || 1.618;

    return currentPrice + wave5Move * extension;
  }

  static async generateAllPatterns(): Promise<void> {
    const { data: stocks } = await supabase.from("stocks").select("symbol");

    if (!stocks) return;

    const timeframes: Timeframe[] = ["1h", "4h", "1d"];

    for (const { symbol } of stocks) {
      for (const timeframe of timeframes) {
        await this.generateWavePattern(symbol, timeframe);
      }
    }
  }
}
