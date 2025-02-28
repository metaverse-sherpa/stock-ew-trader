import express from 'express';
import WavePatternService from '../services/wavePatternService';

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
    await WavePatternService.generateAllPatterns((message, progress) => {
      // Send progress updates to the client
    }, symbols);
    res.status(200).json({ message: 'Analysis complete' });
  } catch (error) {
    console.error('Error analyzing waves:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;