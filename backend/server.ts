import express from 'express';  
import dotenv from 'dotenv';
import routes from './routes/index.ts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5174;

// Middleware
app.use(express.json());

// Routes
app.use(routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
}); 