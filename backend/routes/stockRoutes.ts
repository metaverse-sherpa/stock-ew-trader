import express from 'express';
import yahooFinance from 'yahoo-finance2';
import { supabase } from '../../shared/lib/supabase.server.ts'; // Add .ts extension
import { subDays, formatISO } from 'date-fns';
import wavePatternService from '../../shared/lib/services/wavePatternService.ts';

const router = express.Router();

// Test endpoint
router.get('/test', (req: express.Request, res: express.Response) => {  
  console.log('Test endpoint hit');
  res.json({ message: 'Stock routes are working!' });
});

// Validate stock endpoint
router.post('/validateStock', async (req: express.Request, res: express.Response) => {
  console.log('ValidateStock endpoint hit with symbol:', req.body.symbol);
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Symbol required' });

    const quote = await yahooFinance.quote(symbol);

    const [profile] = await Promise.all([
      yahooFinance.quoteSummary(symbol, {
        modules: ['summaryProfile', 'price', 'defaultKeyStatistics']
      })
    ]);

    res.json({
      symbol,
      name: quote.longName || quote.shortName || '',
      sector: profile.summaryProfile?.sector || '',
      industry: profile.summaryProfile?.industry || '',
      market_cap: quote.marketCap || null,
      volume: quote.regularMarketVolume || null,
      price: quote.regularMarketPrice || null,
      exchange: quote.exchange || '',
    });
  } catch (error) {
    console.error('Error in validateStock:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Save stock endpoint
router.post('/saveStock', async (req: express.Request, res: express.Response) => {
  console.log('SaveStock endpoint hit with symbol:', req.body.symbol);
  try {
    const { symbol } = req.body;
    if (!symbol) {
      console.error('Symbol is required');
      return res.status(400).json({ message: 'Symbol required' });
    }

    console.log('Validating stock symbol:', symbol); // Log symbol validation

    // Validate the stock symbol
    const quote = await yahooFinance.quote(symbol); 

    const [profile] = await Promise.all([
      yahooFinance.quoteSummary(symbol, {
        modules: ['summaryProfile', 'price', 'defaultKeyStatistics']
      })
    ]);

    const stockData = {
      symbol,
      name: quote.longName || quote.shortName || '',
      sector: profile.summaryProfile?.sector || '',
      industry: profile.summaryProfile?.industry || '',
      market_cap: quote.marketCap || null,
      volume: quote.regularMarketVolume || null,
      price: quote.regularMarketPrice || null,
      exchange: quote.exchange || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Stock data to save:', stockData); // Log stock data

    // Save the stock data to Supabase
    const { data, error } = await supabase
      .from('stocks')
      .upsert([stockData], { onConflict: 'symbol' }); // Update if the symbol already exists

    if (error) {
      console.error('Supabase error:', error); // Log Supabase error
      throw error;
    }

    console.log('Stock saved successfully:', data); // Log success
    res.status(200).json({ message: 'Stock saved successfully', data });
  } catch (error) {
    console.error('Error in saveStock:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});


// Add this new endpoint
router.post('/updateHistoricalData', async (req: express.Request, res: express.Response) => {
  try {
    // Get all stocks that need updating
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol');

    if (stocksError) throw stocksError;
    if (!stocks || stocks.length === 0) {
      return res.status(200).json({ message: 'No stocks found' });
    }

    const symbols = stocks.map((stock: { symbol: string }) => stock.symbol);
    console.log(`Processing ${symbols.length} symbols:`, symbols); // Log symbols being processed

    const timeframes = [
      { interval: '1d', period: 730 },
      { interval: '1wk', period: 730 },
      { interval: '1mo', period: 1430 }
    ];

    const results = [];

    for (const symbol of symbols) {
      try {
        console.log(`Processing symbol: ${symbol}`); // Log current symbol
        const symbolResults = [];
        
        for (const timeframe of timeframes) {
          console.log(`Fetching ${timeframe.interval} data for ${symbol}`); // Log timeframe
          const data = await yahooFinance.historical(symbol, {
            period1: formatISO(subDays(new Date(), timeframe.period), { representation: 'date' }),
            interval: timeframe.interval as '1d' | '1wk' | '1mo'
          });

          const stockPrices = data.map(quote => ({
            symbol,
            timeframe: timeframe.interval,
            timestamp: quote.date,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            volume: quote.volume
          }));

          const { error } = await supabase
            .from('stock_prices')
            .upsert(stockPrices, {
              onConflict: 'symbol,timeframe,timestamp'
            });

          if (error) throw error;

          symbolResults.push({
            symbol,
            timeframe: timeframe.interval,
            count: stockPrices.length,
            status: 'success'
          });
        }

        results.push(...symbolResults);
        console.log(`Completed processing for ${symbol}`); // Log completion
      } catch (error) {
        console.error(`Error updating ${symbol}:`, error);
        results.push({
          symbol,
          status: 'error',
          message: (error as Error).message
        });
      }
    }

    console.log('Historical data update completed'); // Log overall completion
    res.status(200).json({
      message: 'Historical data update completed',
      results
    });
  } catch (error) {
    console.error('Error in /updateHistoricalData:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});


export default router; 