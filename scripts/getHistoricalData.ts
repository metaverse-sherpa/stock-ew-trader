import yahooFinance from 'yahoo-finance2';
import { supabase } from "../src/lib/supabase";

export async function getHistoricalData(symbols: string[]) {
  for (const symbol of symbols) {
    try {
      const data = await yahooFinance.historical(symbol, {
        period1: '2020-01-01',
        interval: '1d'
      });

      const stockPrices = data.map(quote => ({
        symbol,
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
          onConflict: 'symbol,date'
        });

      console.log(`Loaded historical data for ${symbol}`);
    } catch (error) {
      console.error(`Error loading data for ${symbol}:`, error);
    }
  }
} 