import express from 'express';  
import yahooFinance from 'yahoo-finance2';
import { WavePatternService } from './src/lib/services/wavePatternService.ts';
import { supabase } from './src/lib/supabase.ts';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 5174;

app.use(express.json());

// API Endpoints
app.post('/api/validateStock', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Symbol required' });
    
    const [quote, profile] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ['summaryProfile', 'price', 'defaultKeyStatistics']
      })
    ]);

    res.json({
      symbol,
      name: quote.displayName || quote.shortName || '',
      sector: profile.summaryProfile?.sector || '',
      industry: profile.summaryProfile?.industry || '',
      market_cap: quote.marketCap || null,
      volume: quote.regularMarketVolume || null,
      price: quote.regularMarketPrice || null,
      exchange: quote.exchange || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wave Pattern Analysis Endpoint
app.post('/api/analyzeWaves', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Initialize progress tracking
    let progress = {
      message: 'Starting analysis...',
      symbol: '',
      timeframe: '',
      completed: 0,
      total: 0
    };

    // Send initial progress
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const sendProgress = (message: string, progressData?: {
      symbol: string;
      timeframe: string;
      completed: number;
      total: number;
    }) => {
      if (progressData) {
        progress = {
          ...progress,
          ...progressData
        };
      }
      res.write(`data: ${JSON.stringify({
        ...progress,
        message
      })}\n\n`);
    };

    await WavePatternService.generateAllPatterns(sendProgress);

    const endTime = Date.now();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);

    res.write(`data: ${JSON.stringify({
      message: `Analysis complete! Time elapsed: ${timeElapsed} seconds`,
      completed: progress.total,
      total: progress.total
    })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ 
      message: 'Failed to complete wave analysis',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
}); 