import express from 'express';  
import dotenv from 'dotenv';
import routes from './routes/index.ts';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5174;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api', routes);

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
}); 