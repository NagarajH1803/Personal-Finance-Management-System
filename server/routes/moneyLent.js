const express = require('express');
const { body, validationResult } = require('express-validator');
const MoneyLent = require('../models/MoneyLent');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all money lent records
// @route   GET /api/money-lent
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const moneyLent = await MoneyLent.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: moneyLent.length,
      data: moneyLent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single money lent record
// @route   GET /api/money-lent/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const moneyLent = await MoneyLent.findOne({ _id: req.params.id, user: req.user.id });

    if (!moneyLent) {
      return res.status(404).json({
        success: false,
        message: 'Money lent record not found'
      });
    }

    res.json({
      success: true,
      data: moneyLent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new money lent record
// @route   POST /api/money-lent
// @access  Private
router.post('/', [
  body('borrowerName').trim().isLength({ min: 1 }).withMessage('Borrower name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('interestRate').optional().isFloat({ min: 0, max: 100 }),
  body('loanDate').optional().isISO8601().withMessage('Loan date must be a valid date'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  body('paymentSchedule').optional().isIn(['lump_sum', 'monthly', 'quarterly', 'yearly', 'custom'])
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

    const moneyLentData = {
      ...req.body,
      user: req.user.id
    };

    const moneyLent = await MoneyLent.create(moneyLentData);

    res.status(201).json({
      success: true,
      message: 'Money lent record created successfully',
      data: moneyLent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update money lent record
// @route   PUT /api/money-lent/:id
// @access  Private
router.put('/:id', [
  body('borrowerName').optional().trim().isLength({ min: 1 }),
  body('amount').optional().isFloat({ min: 0 }),
  body('interestRate').optional().isFloat({ min: 0, max: 100 }),
  body('dueDate').optional().isISO8601()
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

    let moneyLent = await MoneyLent.findOne({ _id: req.params.id, user: req.user.id });

    if (!moneyLent) {
      return res.status(404).json({
        success: false,
        message: 'Money lent record not found'
      });
    }

    moneyLent = await MoneyLent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Money lent record updated successfully',
      data: moneyLent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete money lent record
// @route   DELETE /api/money-lent/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const moneyLent = await MoneyLent.findOne({ _id: req.params.id, user: req.user.id });

    if (!moneyLent) {
      return res.status(404).json({
        success: false,
        message: 'Money lent record not found'
      });
    }

    moneyLent.isActive = false;
    await moneyLent.save();

    res.json({
      success: true,
      message: 'Money lent record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add payment record
// @route   POST /api/money-lent/:id/payments
// @access  Private
router.post('/:id/payments', [
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('principal').isFloat({ min: 0 }).withMessage('Principal must be a positive number'),
  body('interest').isFloat({ min: 0 }).withMessage('Interest must be a positive number'),
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

    const moneyLent = await MoneyLent.findOne({ _id: req.params.id, user: req.user.id });

    if (!moneyLent) {
      return res.status(404).json({
        success: false,
        message: 'Money lent record not found'
      });
    }

    moneyLent.payments.push(req.body);
    await moneyLent.save();

    res.json({
      success: true,
      message: 'Payment record added successfully',
      data: moneyLent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get money lent statistics
// @route   GET /api/money-lent/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const moneyLent = await MoneyLent.find({ user: req.user.id, isActive: true });

    const stats = {
      totalLoans: moneyLent.length,
      totalAmountLent: moneyLent.reduce((sum, loan) => sum + loan.amount, 0),
      totalPaid: moneyLent.reduce((sum, loan) => sum + loan.totalPaid, 0),
      totalOutstanding: moneyLent.reduce((sum, loan) => sum + loan.remainingBalance, 0),
      totalInterestEarned: moneyLent.reduce((sum, loan) => sum + loan.totalInterestEarned, 0),
      byStatus: {
        active: 0,
        partially_paid: 0,
        paid: 0,
        overdue: 0,
        defaulted: 0
      },
      overdueAmount: 0
    };

    // Group by status and calculate overdue amount
    moneyLent.forEach(loan => {
      stats.byStatus[loan.status]++;
      if (loan.status === 'overdue' || loan.status === 'defaulted') {
        stats.overdueAmount += loan.remainingBalance;
      }
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
