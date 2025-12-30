import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import videoRoutes from './routes/videoRoutes.js';

dotenv.config();
connectDB();

const app = express();

/**
 * Global Middleware
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Standard body parsers
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

/**
 * Route Mounting
 */
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/video', videoRoutes);

/**
 * Debug Route to verify Hugging Face Token
 */
app.get('/api/debug/hf-test', async (req, res) => {
  try {
    const response = await axios.get('https://huggingface.co/api/whoami-v2', {
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` }
    });
    res.json({ message: "Token is valid!", user: response.data.name });
  } catch (error) {
    res.status(401).json({ 
      message: "Token is invalid or expired", 
      error: error.response?.data || error.message 
    });
  }
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});