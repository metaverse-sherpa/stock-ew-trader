import { NextApiRequest, NextApiResponse } from 'next';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Symbol is required' });
    }

    const uppercaseSymbol = symbol.toUpperCase();
    
    // Fetch data from Yahoo Finance
    const [quote, profile] = await Promise.all([
      yahooFinance.quote(uppercaseSymbol),
      yahooFinance.quoteSummary(uppercaseSymbol, {
        modules: ['summaryProfile', 'price', 'defaultKeyStatistics']
      })
    ]);

    // Prepare response data
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
} 