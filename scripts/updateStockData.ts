import { config } from 'dotenv';
config();

import yahooFinance from 'yahoo-finance2';
import { supabase } from '../src/lib/supabase';
import { getHistoricalData } from './getHistoricalData';
import { analyzeWaves } from './analyzeWaves';

async function updateStockData() {
  try {
    console.log('Starting stock data update...');

    // Find stocks with needs_update = true
    const { data: stocks, error } = await supabase
      .from('stocks')
      .select('symbol')
      .eq('needs_update', true);

    if (error) throw error;

    console.log(`Found ${stocks.length} stocks to update.`);

    // Update each stock with additional data
    for (const stock of stocks) {
      try {
        console.log(`Updating data for ${stock.symbol}...`);

        // Fetch additional data from Yahoo Finance
        const [quote, profile] = await Promise.all([
          yahooFinance.quote(stock.symbol),
          yahooFinance.quoteSummary(stock.symbol, {
            modules: ['summaryProfile', 'price', 'defaultKeyStatistics'],
          }),
        ]);

        // Log fetched data for debugging
        console.log('Fetched quote:', quote);
        console.log('Fetched profile:', profile);

        // Prepare stock data
        const stockData = {
          symbol: stock.symbol,
          name: quote.longName || quote.shortName || '',
          sector: profile.summaryProfile?.sector || '',
          industry: profile.summaryProfile?.industry || '',
          market_cap: quote.marketCap || null,
          volume: quote.regularMarketVolume || null,
          price: quote.regularMarketPrice || null,
          exchange: quote.exchange || '',
          currency: quote.currency || '',
          country: profile.summaryProfile?.country || '',
          needs_update: false, // Mark as updated
        };

        // Log the data to be updated
        console.log('Updating stock with data:', stockData);

        // Update the stock in the database
        const { error: updateError } = await supabase
          .from('stocks')
          .update(stockData)
          .eq('symbol', stock.symbol);

        if (updateError) throw updateError;

        console.log(`Updated data for ${stock.symbol}.`);
      } catch (err) {
        console.error(`Error updating ${stock.symbol}:`, err);
      }
    }

    // Load historical data for the last 2 years
    console.log('Loading historical data...');
    await getHistoricalData(stocks.map((s) => s.symbol));

    // Analyze waves
    console.log('Analyzing waves...');
    await analyzeWaves();

    console.log('Stock data update completed successfully!');
  } catch (error) {
    console.error('Error updating stock data:', error);
    throw error;
  }
}

// Execute the update function
updateStockData().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
}); 