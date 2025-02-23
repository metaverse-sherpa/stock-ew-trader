import { config } from "dotenv";
config();

import yahooFinance from 'yahoo-finance2';
import { supabase } from "../src/lib/supabase";

async function getAllSymbols() {
  const allSymbols = new Set<string>();
  const processedSymbols = new Set<string>();
  let initialSymbolCount = 0;
  
  try {
    // First, get all existing symbols from our database
    const { data: existingStocks, error } = await supabase
      .from('stocks')
      .select('symbol, processed');

    if (error) {
      console.error('Error fetching existing stocks:', error);
      return [];
    }

    // Add all existing symbols to allSymbols
    existingStocks.forEach(stock => {
      allSymbols.add(stock.symbol);
      // Add already processed symbols to processedSymbols
      if (stock.processed) {
        processedSymbols.add(stock.symbol);
      }
    });

    initialSymbolCount = allSymbols.size;
    const alreadyProcessedCount = processedSymbols.size;
    console.log(`Starting with ${initialSymbolCount} existing symbols in database`);
    console.log(`${alreadyProcessedCount} symbols already processed`);
    console.log(`${initialSymbolCount - alreadyProcessedCount} symbols remaining to process`);

    // Keep track of how many symbols we had in the last iteration
    let lastCount = 0;
    let noNewSymbolsCount = 0;
    const MAX_ATTEMPTS_WITHOUT_NEW = 3;

    // Continue searching until we stop finding new symbols
    while (noNewSymbolsCount < MAX_ATTEMPTS_WITHOUT_NEW) {
      const symbolsToProcess = Array.from(allSymbols)
        .filter(symbol => !processedSymbols.has(symbol));

      if (symbolsToProcess.length === 0) {
        console.log('All symbols have been processed!');
        break;
      }

      console.log(`Processing ${symbolsToProcess.length} unprocessed symbols...`);

      for (const symbol of symbolsToProcess) {
        try {
          console.log(`Finding related stocks for ${symbol}...`);
          
          const result = await yahooFinance.search(symbol, {
            newsCount: 0,
            quotesCount: 250,
            enableFuzzyQuery: false,
            enableNavLinks: false,
            enableEnhancedTrivialQuery: true
          });

          if (result.quotes) {
            const foundSymbols = result.quotes
              .filter(quote => 
                quote.symbol &&
                quote.quoteType === 'EQUITY' &&
                !quote.symbol.includes('.') &&
                ['NMS', 'NYQ', 'NCM', 'NGM'].includes(quote.exchange || '')
              )
              .map(quote => quote.symbol);

            foundSymbols.forEach(sym => allSymbols.add(sym));
          }

          // Mark this symbol as processed in both our Set and the database
          processedSymbols.add(symbol);
          await supabase
            .from('stocks')
            .update({ processed: true })
            .eq('symbol', symbol);

          // Add a delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Error processing ${symbol}:`, error);
          // Still mark errored symbols as processed
          processedSymbols.add(symbol);
          await supabase
            .from('stocks')
            .update({ processed: true })
            .eq('symbol', symbol);
          continue;
        }
      }

      // Check if we found any new symbols
      if (allSymbols.size === lastCount) {
        noNewSymbolsCount++;
        console.log(`No new symbols found. Attempt ${noNewSymbolsCount} of ${MAX_ATTEMPTS_WITHOUT_NEW}`);
      } else {
        noNewSymbolsCount = 0;
        console.log(`Found ${allSymbols.size - lastCount} new symbols in this iteration`);
      }

      lastCount = allSymbols.size;
      console.log(`Total unique symbols so far: ${allSymbols.size}`);
    }

    const finalSymbolCount = allSymbols.size;
    const newSymbolsFound = finalSymbolCount - initialSymbolCount;
    const percentageIncrease = ((finalSymbolCount - initialSymbolCount) / initialSymbolCount * 100).toFixed(1);

    console.log('\nSymbol Discovery Statistics:');
    console.log(`Initial symbol count: ${initialSymbolCount}`);
    console.log(`New symbols found: ${newSymbolsFound}`);
    console.log(`Final symbol count: ${finalSymbolCount}`);
    console.log(`Percentage increase: ${percentageIncrease}%`);

  } catch (error) {
    console.error('Error in symbol discovery:', error);
  }

  const uniqueSymbols = Array.from(allSymbols);
  return uniqueSymbols;
}

async function populateStocks() {
  try {
    console.log("Starting stock population process...");
    
    // Get initial count
    const { count: initialCount } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true });

    console.log(`Initial database count: ${initialCount} stocks`);
    
    // Get all symbols
    console.log("Fetching stock symbols...");
    const symbols = await getAllSymbols();
    console.log(`Found ${symbols.length} total symbols to process`);

    // Process in batches to avoid rate limits
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
    
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(symbols.length/BATCH_SIZE)}`);

      await Promise.all(batch.map(async (symbol) => {
        try {
          // Fetch quote and company info
          const [quote, profile] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.quoteSummary(symbol, { 
              modules: ['summaryProfile', 'price', 'defaultKeyStatistics'] 
            })
          ]);

          // Skip if no valid quote data
          if (!quote || !quote.regularMarketPrice) {
            console.log(`Skipping ${symbol} - no valid quote data`);
            return;
          }

          // Prepare stock data
          const stockData = {
            symbol,
            name: quote.longName || quote.shortName,
            sector: profile.summaryProfile?.sector || null,
            industry: profile.summaryProfile?.industry || null,
            market_cap: quote.marketCap || null,
            volume: quote.regularMarketVolume || null,
            price: quote.regularMarketPrice || null,
            exchange: quote.exchange || null,
            updated_at: new Date().toISOString()
          };

          // Upsert into stocks table
          const { error } = await supabase
            .from('stocks')
            .upsert(stockData, {
              onConflict: 'symbol'
            });

          if (error) {
            console.error(`Error upserting ${symbol}:`, error);
          } else {
            console.log(`Successfully added/updated ${symbol}`);
          }

        } catch (error) {
          console.error(`Error processing ${symbol}:`, error);
        }
      }));

      // Wait between batches to avoid rate limits
      if (i + BATCH_SIZE < symbols.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Get final count
    const { count: finalCount } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true });

    console.log('\nFinal Database Statistics:');
    console.log(`Initial database count: ${initialCount} stocks`);
    console.log(`Final database count: ${finalCount} stocks`);
    console.log(`Newly added stocks: ${finalCount - initialCount}`);
    console.log(`Percentage increase: ${((finalCount - initialCount) / initialCount * 100).toFixed(1)}%`);

    console.log("Stock population completed successfully!");
  } catch (error) {
    console.error("Error in stock population:", error);
    throw error;
  }
}

// Execute the population function
populateStocks().catch((error) => {
  console.error("Population failed:", error);
  process.exit(1);
}); 