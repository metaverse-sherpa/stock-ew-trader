import express from 'express';  
import dotenv from 'dotenv';
import routes from './routes/index.ts';
import cors from 'cors';
import waveRoutes from './routes/waveRoutes.ts';
import stockRoutes from './routes/stockRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5174;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5005', // Changed to port 5005
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Routes
app.use('/api', routes);
app.use('/api/waves', waveRoutes);
app.use('/api/stocks', stockRoutes);

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
}); 