import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const HOST = process.env.BACKEND_HOST || '0.0.0.0';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weathervoice';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit - allow app to run without DB for development
    console.warn('Continuing without database connection...');
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, HOST, () => {
    console.log(`Backend server running on http://${HOST}:${PORT}`);
  });
};

startServer().catch(console.error);

export default app;
