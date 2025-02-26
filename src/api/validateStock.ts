import yahooFinance from 'yahoo-finance2';
import express from 'express';

const router = express.Router();

router.post('/validateStock', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Symbol is required' });
    }

    const uppercaseSymbol = symbol.toUpperCase();
    
    const [quote, profile] = await Promise.all([
      yahooFinance.quote(uppercaseSymbol),
      yahooFinance.quoteSummary(uppercaseSymbol, {
        modules: ['summaryProfile', 'price', 'defaultKeyStatistics']
      })
    ]);

    const stockData = {
      symbol: uppercaseSymbol,
      name: quote.displayName || quote.shortName || '',
      sector: profile.summaryProfile?.sector || '',
      industry: profile.summaryProfile?.industry || '',
      market_cap: quote.marketCap || null,
      volume: quote.regularMarketVolume || null,
      price: quote.regularMarketPrice || null,
      exchange: quote.exchange || '',
    };

    return res.status(200).json(stockData);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

export default router; 