import yahooFinance from 'yahoo-finance2';
import { supabase } from "../shared/lib/supabase.server.ts";

export async function getHistoricalData(symbols: string[]) {
  const timeframes = [
    { interval: '1h', period: '7d' },  // 1 hour data for last 7 days
    { interval: '4h', period: '60d' }, // 4 hour data for last 60 days
    { interval: '1d', period: '730d' } // 1 day data for last 2 years
  ];

  for (const symbol of symbols) {
    try {
      for (const timeframe of timeframes) {
        const data = await yahooFinance.historical(symbol, {
          period1: new Date(Date.now() - (parseInt(timeframe.period) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          interval: timeframe.interval
        });

        const stockPrices = data.map(quote => ({
          symbol,
          timeframe: timeframe.interval,
          date: quote.date,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume
        }));

        await supabase
          .from('stock_prices')
          .upsert(stockPrices, {
            onConflict: 'symbol,timeframe,date'
          });

        console.log(`Loaded ${timeframe.interval} historical data for ${symbol}`);
      }
    } catch (error) {
      console.error(`Error loading data for ${symbol}:`, error);
    }
  }
} 