import express from 'express';
import wavePatternService from '../../shared/lib/services/wavePatternService.ts';

const router = express.Router();

// Test endpoint
router.get('/test', (req: express.Request, res: express.Response) => {  
  console.log('Test endpoint hit');
  res.json({ message: 'Stock routes are working!' });
});


// Analyze waves endpoint
router.post('/analyzeWaves', async (req: express.Request, res: express.Response) => {
  const { symbols } = req.body;
  console.log('AnalyzeWaves endpoint hit');
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

    // Add error handling for the SSE connection
    res.on('close', () => {
      console.log('Client disconnected from SSE');
      res.end();
    });

    // Add timeout handling
    const timeout = setTimeout(() => {
      res.write(`data: ${JSON.stringify({
        message: 'Analysis timed out',
        completed: 0,
        total: 0
      })}\n\n`);
      res.end();
    }, 300000); // 5 minute timeout

    // Clear timeout on completion
    await wavePatternService.generateAllPatterns(sendProgress, symbols)
      .finally(() => clearTimeout(timeout));

    const endTime = Date.now();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);

    res.write(`data: ${JSON.stringify({
      message: `Analysis complete! Time elapsed: ${timeElapsed} seconds`,
      completed: progress.total,
      total: progress.total
    })}\n\n`);

  } catch (error) {
    console.error('Error in analyzeWaves endpoint:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;