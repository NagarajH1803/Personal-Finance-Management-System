const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Stock = require('../models/Stock');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const stocks = await Stock.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single stock
// @route   GET /api/stocks/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, user: req.user.id });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new stock
// @route   POST /api/stocks
// @access  Private
router.post('/', [
  body('symbol').trim().isLength({ min: 1 }).withMessage('Stock symbol is required'),
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const stockData = {
      ...req.body,
      user: req.user.id
    };

    const stock = await Stock.create(stockData);

    res.status(201).json({
      success: true,
      message: 'Stock created successfully',
      data: stock
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add transaction
// @route   POST /api/stocks/:id/transaction
// @access  Private
router.post('/:id/transaction', [
  body('type').isIn(['buy', 'sell']).withMessage('Transaction type must be buy or sell'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('brokerage').optional().isFloat({ min: 0 }).withMessage('Brokerage must be a positive number'),
  body('notes').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const stock = await Stock.findOne({ _id: req.params.id, user: req.user.id });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    const { type, quantity, price, date, brokerage = 0, notes = '' } = req.body;

    // Check if selling more than available
    if (type === 'sell' && quantity > stock.totalQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock quantity for sale'
      });
    }

    await stock.addTransaction(type, quantity, price, date, brokerage, notes);

    res.json({
      success: true,
      message: 'Transaction added successfully',
      data: stock
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update stock
// @route   PUT /api/stocks/:id
// @access  Private
router.put('/:id', [
  body('companyName').optional().trim().isLength({ min: 1 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let stock = await Stock.findOne({ _id: req.params.id, user: req.user.id });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    stock = await Stock.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: stock
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete stock
// @route   DELETE /api/stocks/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, user: req.user.id });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    stock.isActive = false;
    await stock.save();

    res.json({
      success: true,
      message: 'Stock deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get live stock price
// @route   GET /api/stocks/price/:symbol
// @access  Private
router.get('/price/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    // Using Yahoo Finance API (you'll need to replace with actual API key)
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    
    if (response.data && response.data.chart && response.data.chart.result) {
      const result = response.data.chart.result[0];
      const price = result.meta.regularMarketPrice;
      const change = result.meta.regularMarketPrice - result.meta.previousClose;
      const changePercent = (change / result.meta.previousClose) * 100;

      res.json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          price,
          change,
          changePercent,
          previousClose: result.meta.previousClose,
          volume: result.meta.volume,
          marketCap: result.meta.marketCap,
          timestamp: new Date()
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Stock price not found'
      });
    }
  } catch (error) {
    console.error('Error fetching stock price:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock price'
    });
  }
});

// @desc    Update stock prices
// @route   PUT /api/stocks/update-prices
// @access  Private
router.put('/update-prices', async (req, res, next) => {
  try {
    const stocks = await Stock.find({ user: req.user.id, isActive: true });
    const updatedStocks = [];

    for (const stock of stocks) {
      try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`);
        
        if (response.data && response.data.chart && response.data.chart.result) {
          const price = response.data.chart.result[0].meta.regularMarketPrice;
          await stock.updateCurrentPrice(price);
          updatedStocks.push(stock);
        }
      } catch (error) {
        console.error(`Error updating price for ${stock.symbol}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Updated prices for ${updatedStocks.length} stocks`,
      data: updatedStocks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get stock statistics
// @route   GET /api/stocks/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const stocks = await Stock.find({ user: req.user.id, isActive: true });

    const stats = {
      totalStocks: stocks.length,
      totalInvested: stocks.reduce((sum, stock) => sum + stock.totalInvested, 0),
      totalCurrentValue: stocks.reduce((sum, stock) => sum + stock.currentValue, 0),
      totalProfitLoss: stocks.reduce((sum, stock) => sum + stock.profitLoss, 0),
      totalBrokerage: stocks.reduce((sum, stock) => sum + stock.totalBrokerage, 0),
      profitableStocks: stocks.filter(stock => stock.profitLoss > 0).length,
      lossMakingStocks: stocks.filter(stock => stock.profitLoss < 0).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
