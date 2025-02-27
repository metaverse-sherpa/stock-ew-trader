import express from 'express';
import stockRoutes from './stockRoutes.ts';
import waveRoutes from './waveRoutes.ts';

const router = express.Router();

// Mount routes
router.use('/api', stockRoutes);
router.use('/api', waveRoutes);

export default router; 