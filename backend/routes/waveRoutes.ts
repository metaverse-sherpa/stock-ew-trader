import express from 'express';
import { generateAllPatterns } from '../lib/services/wavePatternService.ts';

const router = express.Router();

// Analyze waves endpoint
router.post('/analyzeWaves', async (req: express.Request, res: express.Response) => {
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

    await generateAllPatterns(sendProgress);

    const endTime = Date.now();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);

    res.write(`data: ${JSON.stringify({
      message: `Analysis complete! Time elapsed: ${timeElapsed} seconds`,
      completed: progress.total,
      total: progress.total
    })}\n\n`);

  } catch (error) {
    console.error('Error in analyzeWaves endpoint:', error);
    res.status(500).send('An error occurred while analyzing waves.');
  }
});

export default router;