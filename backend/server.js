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
app.get('/api/debug/gemini-test', async (req, res) => {
  try {
    const testModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await testModel.generateContent("Test: Are you working?");
    res.json({ message: "Gemini API key is valid!", response: result.response.text() });
  } catch (error) {
    res.status(500).json({ message: "Gemini check failed", error: error.message });
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