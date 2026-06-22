const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const emiRoutes = require('./routes/emi');
const assetRoutes = require('./routes/assets');
const rentRoutes = require('./routes/rent');
const stockRoutes = require('./routes/stocks');
const fdRoutes = require('./routes/fixedDeposits');
const goldRoutes = require('./routes/gold');
const itrRoutes = require('./routes/itr');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const moneyLentRoutes = require('./routes/moneyLent');
const cryptoRoutes = require('./routes/crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS — allow the frontend origin (set FRONTEND_URL in env for production)
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000']
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting (relax in development to avoid local 429s)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === 'development' ? 1000 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
// Only trust proxy in production behind a real proxy/load balancer
app.set('trust proxy', process.env.NODE_ENV === 'production');
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_management')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/fixed-deposits', fdRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/itr', itrRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/money-lent', moneyLentRoutes);
app.use('/api/crypto', cryptoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Finance Management API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server only when running directly (not in Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
