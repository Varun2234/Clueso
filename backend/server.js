import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import videoRoutes from './routes/videoRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

/**
 * Global Middleware
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your Vite dev server
  credentials: true
}));
// Raw body logger (placed BEFORE body parsers) to capture malformed JSON
app.use((req, res, next) => {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    if (raw && raw.length) {
      try {
        const preview = raw.length > 1000 ? raw.slice(0, 1000) + '... (truncated)' : raw;
        console.log(`RAW ${req.method} ${req.url} - ${preview}`);
      } catch (e) {
        console.log('RAW LOG ERROR', e);
      }
    }
    next();
  });
});

app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Debug middleware: log basic request info and body shape to debug request parsing issues
app.use((req, res, next) => {
  try {
    const bodyType = req.body === undefined ? 'undefined' : (typeof req.body === 'object' ? 'object_keys:' + Object.keys(req.body).join(',') : typeof req.body);
    console.log(`REQ ${req.method} ${req.url} - bodyType=${bodyType}`);
  } catch (e) {
    console.log('REQ LOG ERROR', e);
  }
  next();
});

/**
 * Route Mounting
 */
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/video', videoRoutes);

// Simple debug ping route
app.get('/debug/ping', (req, res) => {
  console.log('PING RECV', req.method, req.url);
  res.json({ pong: true });
});

// Route dump moved to the server start callback (see the app.listen handler) to avoid races with router initialization.

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

/**
 * Server Start
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  if (app._router && Array.isArray(app._router.stack)) {
    const routes = app._router.stack
      .filter(r => r && r.route && r.route.path)
      .map(r => `${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    console.log('REGISTERED ROUTES:\n', routes.join('\n') || 'none found');
  }
});