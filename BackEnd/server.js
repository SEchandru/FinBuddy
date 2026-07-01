require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initCronJobs } = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for the Vite frontend dev server (default port 5173 or other local routes)
app.use(cors({
  origin: '*', // Allow all origins for local environment simplicity
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock/Health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'FinBuddy Backend API is operational',
    timestamp: new Date().toISOString()
  });
});

// Import API Routers
const authRoutes = require('./routes/authRoutes');
const financeRoutes = require('./routes/financeRoutes');
const quizRoutes = require('./routes/quizRoutes');
const reportRoutes = require('./routes/reportRoutes');
const newsRoutes = require('./routes/newsRoutes');
const advisorRoutes = require('./routes/advisorRoutes');

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/advisor', advisorRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Exception]:', err.stack);
  res.status(500).json({
    message: 'An unexpected internal error occurred on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Initialize Background Node Cron Jobs
initCronJobs();

// Start the Express server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 FinBuddy Server successfully listening on port ${PORT}`);
  console.log(`📅 Local time: ${new Date().toLocaleString()}`);
  console.log(`==================================================`);
});
