import express from 'express';
import stockRoutes from './stockRoutes.ts';
import waveRoutes from './waveRoutes.ts';

const router = express.Router();

// Add the /test endpoint here
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Mount routes
router.use('/stocks', stockRoutes);
router.use('/waves', waveRoutes);

console.log('Routes mounted: /stocks, /waves');

export default router; 