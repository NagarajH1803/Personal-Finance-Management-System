const express = require('express');
const { body, validationResult } = require('express-validator');
const { CryptoTransaction, CryptoHolding } = require('../models/Crypto');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all crypto holdings
// @route   GET /api/crypto/holdings
// @access  Private
router.get('/holdings', async (req, res, next) => {
  try {
    const holdings = await CryptoHolding.find({ user: req.user.id, isActive: true })
      .sort({ currentValue: -1 });

    res.json({
      success: true,
      count: holdings.length,
      data: holdings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single crypto holding
// @route   GET /api/crypto/holdings/:id
// @access  Private
router.get('/holdings/:id', async (req, res, next) => {
  try {
    const holding = await CryptoHolding.findOne({ _id: req.params.id, user: req.user.id });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Crypto holding not found'
      });
    }

    res.json({
      success: true,
      data: holding
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all crypto transactions
// @route   GET /api/crypto/transactions
// @access  Private
router.get('/transactions', async (req, res, next) => {
  try {
    const { symbol, type, limit = 50, page = 1 } = req.query;
    
    let query = { user: req.user.id, isActive: true };
    
    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }
    
    if (type) {
      query.transactionType = type;
    }

    const transactions = await CryptoTransaction.find(query)
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CryptoTransaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new crypto transaction
// @route   POST /api/crypto/transactions
// @access  Private
router.post('/transactions', [
  body('symbol').trim().isLength({ min: 1 }).withMessage('Cryptocurrency symbol is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Cryptocurrency name is required'),
  body('transactionType').isIn(['buy', 'sell', 'transfer_in', 'transfer_out', 'stake', 'unstake', 'reward']).withMessage('Invalid transaction type'),
  body('amount').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('pricePerUnit').isFloat({ min: 0 }).withMessage('Price per unit must be a positive number'),
  body('transactionDate').optional().isISO8601().withMessage('Transaction date must be a valid date')
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

    const transactionData = {
      ...req.body,
      symbol: req.body.symbol.toUpperCase(),
      user: req.user.id,
      // Handle nested exchange object
      exchange: req.body.exchange?.name ? {
        name: req.body.exchange.name,
        fees: req.body.exchange.fees || 0
      } : undefined,
      // Handle nested wallet object
      wallet: req.body.wallet?.type ? {
        type: req.body.wallet.type
      } : undefined
    };

    // Check if user has sufficient holdings for sell transactions
    if (transactionData.transactionType === 'sell' || transactionData.transactionType === 'transfer_out') {
      const existingHolding = await CryptoHolding.findOne({
        user: req.user.id,
        symbol: transactionData.symbol,
        isActive: true
      });
      
      if (!existingHolding || existingHolding.totalAmount < transactionData.amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient holdings. You only have ${existingHolding?.totalAmount || 0} ${transactionData.symbol} available.`
        });
      }
    }

    const transaction = await CryptoTransaction.create(transactionData);

    // Update or create holding
    try {
      await updateCryptoHolding(req.user.id, transaction);
    } catch (holdingError) {
      // Don't fail the transaction creation if holding update fails
    }

    res.status(201).json({
      success: true,
      message: 'Crypto transaction created successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update crypto holding
// @route   PUT /api/crypto/holdings/:id
// @access  Private
router.put('/holdings/:id', [
  body('currentPrice').optional().isFloat({ min: 0 }),
  body('totalAmount').optional().isFloat({ min: 0 })
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

    let holding = await CryptoHolding.findOne({ _id: req.params.id, user: req.user.id });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Crypto holding not found'
      });
    }

    holding = await CryptoHolding.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Crypto holding updated successfully',
      data: holding
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete crypto transaction
// @route   DELETE /api/crypto/transactions/:id
// @access  Private
router.delete('/transactions/:id', async (req, res, next) => {
  try {
    const transaction = await CryptoTransaction.findOne({ _id: req.params.id, user: req.user.id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Crypto transaction not found'
      });
    }

    transaction.isActive = false;
    await transaction.save();

    res.json({
      success: true,
      message: 'Crypto transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add staking to crypto holding
// @route   POST /api/crypto/holdings/:id/staking
// @access  Private
router.post('/holdings/:id/staking', [
  body('amount').isFloat({ min: 0 }).withMessage('Staking quantity must be a positive number'),
  body('apy').isFloat({ min: 0 }).withMessage('APY must be a positive number'),
  body('endDate').isISO8601().withMessage('End date must be a valid date')
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

    const holding = await CryptoHolding.findOne({ _id: req.params.id, user: req.user.id });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Crypto holding not found'
      });
    }

    if (req.body.amount > holding.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Staking quantity cannot exceed total holding quantity'
      });
    }

    await holding.addStaking(req.body.amount, req.body.apy, req.body.endDate);

    res.json({
      success: true,
      message: 'Staking added successfully',
      data: holding
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove staking from crypto holding
// @route   DELETE /api/crypto/holdings/:id/staking
// @access  Private
router.delete('/holdings/:id/staking', async (req, res, next) => {
  try {
    const holding = await CryptoHolding.findOne({ _id: req.params.id, user: req.user.id });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Crypto holding not found'
      });
    }

    await holding.removeStaking();

    res.json({
      success: true,
      message: 'Staking removed successfully',
      data: holding
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get crypto statistics
// @route   GET /api/crypto/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const holdings = await CryptoHolding.find({ user: req.user.id, isActive: true });
    const transactions = await CryptoTransaction.find({ user: req.user.id, isActive: true });

    const stats = {
      totalHoldings: holdings.length,
      totalInvested: holdings.reduce((sum, holding) => sum + holding.totalInvested, 0),
      totalCurrentValue: holdings.reduce((sum, holding) => sum + holding.currentValue, 0),
      totalProfitLoss: holdings.reduce((sum, holding) => sum + holding.profitLoss, 0),
      totalProfitLossPercentage: 0,
      totalStakedValue: holdings.reduce((sum, holding) => sum + (holding.staking.isStaked ? holding.staking.stakedAmount * holding.currentPrice : 0), 0),
      totalStakingRewards: holdings.reduce((sum, holding) => sum + holding.totalStakingRewards, 0),
      totalTransactions: transactions.length,
      totalRealizedProfitLoss: transactions.filter(t => t.transactionType === 'sell').reduce((sum, t) => sum + (t.calculatedProfitLoss || 0), 0),
      byType: {
        buy: 0,
        sell: 0,
        transfer_in: 0,
        transfer_out: 0,
        stake: 0,
        unstake: 0,
        reward: 0
      }
    };

    // Calculate total profit/loss percentage
    if (stats.totalInvested > 0) {
      stats.totalProfitLossPercentage = (stats.totalProfitLoss / stats.totalInvested) * 100;
    }

    // Group transactions by type
    transactions.forEach(transaction => {
      stats.byType[transaction.transactionType]++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to update crypto holdings based on transactions
async function updateCryptoHolding(userId, transaction) {
  let holding = await CryptoHolding.findOne({ 
    user: userId, 
    symbol: transaction.symbol,
    isActive: true 
  });

  if (!holding) {
    try {
      // Create new holding
      holding = new CryptoHolding({
        user: userId,
        symbol: transaction.symbol,
        name: transaction.name,
        currentPrice: transaction.pricePerUnit,
        isActive: true
      });
    } catch (createError) {
      throw createError;
    }
  }

  // Update holding based on transaction type
  switch (transaction.transactionType) {
    case 'buy':
    case 'transfer_in':
    case 'reward':
      // Add to holding using average cost basis
      const newTotalAmount = holding.totalAmount + transaction.amount;
      const newTotalInvested = holding.totalInvested + transaction.totalValue;
      holding.averageBuyPrice = newTotalAmount > 0 ? newTotalInvested / newTotalAmount : 0;
      holding.totalAmount = newTotalAmount;
      holding.totalInvested = newTotalInvested;
      break;
    
    case 'sell':
    case 'transfer_out':
      // Calculate profit/loss based on average buy price
      const sellAmount = Math.min(transaction.amount, holding.totalAmount);
      const costBasis = sellAmount * holding.averageBuyPrice;
      const sellValue = sellAmount * transaction.pricePerUnit;
      const profitLoss = sellValue - costBasis;
      
      // Update the transaction with calculated profit/loss
      transaction.calculatedProfitLoss = profitLoss;
      transaction.costBasis = costBasis;
      
      // Subtract from holding
      const previousAmount = holding.totalAmount;
      holding.totalAmount = Math.max(0, holding.totalAmount - sellAmount);
      
      // Adjust total invested proportionally
      if (holding.totalAmount > 0 && previousAmount > 0) {
        holding.totalInvested = holding.totalInvested * (holding.totalAmount / previousAmount);
        holding.averageBuyPrice = holding.totalInvested / holding.totalAmount;
      } else {
        holding.totalInvested = 0;
        holding.averageBuyPrice = 0;
      }
      break;
  }

  // Update current price
  holding.currentPrice = transaction.pricePerUnit;
  holding.lastUpdated = new Date();

  await holding.save();
}

module.exports = router;
