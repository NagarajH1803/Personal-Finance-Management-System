const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Gold = require('../models/Gold');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all gold investments
// @route   GET /api/gold
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const goldInvestments = await Gold.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: goldInvestments.length,
      data: goldInvestments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single gold investment
// @route   GET /api/gold/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const gold = await Gold.findOne({ _id: req.params.id, user: req.user.id });

    if (!gold) {
      return res.status(404).json({
        success: false,
        message: 'Gold investment not found'
      });
    }

    res.json({
      success: true,
      data: gold
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new gold investment
// @route   POST /api/gold
// @access  Private
router.post('/', [
  body('type').isIn(['jewelry', 'coins', 'bars', 'etf', 'other']).withMessage('Invalid gold type'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('unit').isIn(['grams', 'tolas', 'ounces']).withMessage('Invalid unit'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('purchaseDate').isISO8601().withMessage('Purchase date must be a valid date'),
  body('purity').optional().isFloat({ min: 0, max: 100 }).withMessage('Purity must be between 0-100'),
  body('location').optional().isIn(['home', 'bank_locker', 'jewelry_shop', 'other'])
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

    const goldData = {
      ...req.body,
      user: req.user.id
    };
    // Default currentPrice to purchasePrice so dashboard reflects value immediately
    if (goldData.currentPrice === undefined || goldData.currentPrice === null) {
      goldData.currentPrice = goldData.purchasePrice;
    }

    const gold = await Gold.create(goldData);

    res.status(201).json({
      success: true,
      message: 'Gold investment created successfully',
      data: gold
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update gold investment
// @route   PUT /api/gold/:id
// @access  Private
router.put('/:id', [
  body('quantity').optional().isFloat({ min: 0.01 }),
  body('currentPrice').optional().isFloat({ min: 0 }),
  body('purity').optional().isFloat({ min: 0, max: 100 })
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

    let gold = await Gold.findOne({ _id: req.params.id, user: req.user.id });

    if (!gold) {
      return res.status(404).json({
        success: false,
        message: 'Gold investment not found'
      });
    }

    gold = await Gold.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Gold investment updated successfully',
      data: gold
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete gold investment
// @route   DELETE /api/gold/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const gold = await Gold.findOne({ _id: req.params.id, user: req.user.id });

    if (!gold) {
      return res.status(404).json({
        success: false,
        message: 'Gold investment not found'
      });
    }

    gold.isActive = false;
    await gold.save();

    res.json({
      success: true,
      message: 'Gold investment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get live gold price
// @route   GET /api/gold/price
// @access  Private
router.get('/price/live', async (req, res, next) => {
  try {
    // Using a gold price API (you'll need to replace with actual API)
    const response = await axios.get('https://api.metals.live/v1/spot/gold');
    
    if (response.data && response.data.length > 0) {
      const goldPrice = response.data[0];
      
      res.json({
        success: true,
        data: {
          price: goldPrice.price,
          currency: goldPrice.currency,
          unit: 'per_gram',
          timestamp: new Date(),
          source: 'metals.live'
        }
      });
    } else {
      // Fallback to a mock price for development
      res.json({
        success: true,
        data: {
          price: 5500, // Mock price per gram in INR
          currency: 'INR',
          unit: 'per_gram',
          timestamp: new Date(),
          source: 'mock'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching gold price:', error);
    // Fallback response
    res.json({
      success: true,
      data: {
        price: 5500,
        currency: 'INR',
        unit: 'per_gram',
        timestamp: new Date(),
        source: 'fallback'
      }
    });
  }
});

// @desc    Update gold prices
// @route   PUT /api/gold/update-prices
// @access  Private
router.put('/update-prices', async (req, res, next) => {
  try {
    const goldInvestments = await Gold.find({ user: req.user.id, isActive: true });
    const updatedInvestments = [];

    // Get current gold price
    let currentPrice = 5500; // Default fallback price
    try {
      const response = await axios.get('https://api.metals.live/v1/spot/gold');
      if (response.data && response.data.length > 0) {
        currentPrice = response.data[0].price;
      }
    } catch (error) {
      console.error('Error fetching gold price:', error);
    }

    for (const gold of goldInvestments) {
      await gold.updateCurrentPrice(currentPrice);
      updatedInvestments.push(gold);
    }

    res.json({
      success: true,
      message: `Updated prices for ${updatedInvestments.length} gold investments`,
      data: updatedInvestments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get gold statistics
// @route   GET /api/gold/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const goldInvestments = await Gold.find({ user: req.user.id, isActive: true });

    const stats = {
      totalInvestments: goldInvestments.length,
      totalQuantity: goldInvestments.reduce((sum, gold) => sum + gold.quantityInGrams, 0),
      totalPurchaseValue: goldInvestments.reduce((sum, gold) => sum + gold.purchaseValue, 0),
      totalCurrentValue: goldInvestments.reduce((sum, gold) => sum + gold.currentValue, 0),
      totalProfitLoss: goldInvestments.reduce((sum, gold) => sum + gold.profitLoss, 0),
      byType: {}
    };

    // Group by type
    goldInvestments.forEach(gold => {
      if (!stats.byType[gold.type]) {
        stats.byType[gold.type] = {
          count: 0,
          quantity: 0,
          totalValue: 0
        };
      }
      stats.byType[gold.type].count++;
      stats.byType[gold.type].quantity += gold.quantityInGrams;
      stats.byType[gold.type].totalValue += gold.currentValue;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
