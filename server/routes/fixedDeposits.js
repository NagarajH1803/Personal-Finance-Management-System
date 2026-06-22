const express = require('express');
const { body, validationResult } = require('express-validator');
const FixedDeposit = require('../models/FixedDeposit');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all FDs
// @route   GET /api/fixed-deposits
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const fds = await FixedDeposit.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: fds.length,
      data: fds
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single FD
// @route   GET /api/fixed-deposits/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const fd = await FixedDeposit.findOne({ _id: req.params.id, user: req.user.id });

    if (!fd) {
      return res.status(404).json({
        success: false,
        message: 'Fixed deposit not found'
      });
    }

    res.json({
      success: true,
      data: fd
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new FD
// @route   POST /api/fixed-deposits
// @access  Private
router.post('/', [
  body('bankName').trim().isLength({ min: 1 }).withMessage('Bank name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('interestRate').isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('tenure').isInt({ min: 1 }).withMessage('Tenure must be a positive integer'),
  body('tenureType').isIn(['days', 'months', 'years']).withMessage('Invalid tenure type'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('fdNumber').trim().isLength({ min: 1 }).withMessage('FD number is required'),
  body('interestPayout').optional().isIn(['monthly', 'quarterly', 'at_maturity'])
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

    const fdData = {
      ...req.body,
      user: req.user.id
    };

    const fd = await FixedDeposit.create(fdData);

    res.status(201).json({
      success: true,
      message: 'Fixed deposit created successfully',
      data: fd
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update FD
// @route   PUT /api/fixed-deposits/:id
// @access  Private
router.put('/:id', [
  body('status').optional().isIn(['active', 'matured', 'premature_withdrawn'])
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

    let fd = await FixedDeposit.findOne({ _id: req.params.id, user: req.user.id });

    if (!fd) {
      return res.status(404).json({
        success: false,
        message: 'Fixed deposit not found'
      });
    }

    fd = await FixedDeposit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Fixed deposit updated successfully',
      data: fd
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete FD
// @route   DELETE /api/fixed-deposits/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const fd = await FixedDeposit.findOne({ _id: req.params.id, user: req.user.id });

    if (!fd) {
      return res.status(404).json({
        success: false,
        message: 'Fixed deposit not found'
      });
    }

    fd.isActive = false;
    await fd.save();

    res.json({
      success: true,
      message: 'Fixed deposit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get FD statistics
// @route   GET /api/fixed-deposits/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const fds = await FixedDeposit.find({ user: req.user.id, isActive: true });

    const stats = {
      totalFDs: fds.length,
      totalAmount: fds.reduce((sum, fd) => sum + fd.amount, 0),
      totalMaturityAmount: fds.reduce((sum, fd) => sum + fd.maturityAmount, 0),
      totalInterestEarned: fds.reduce((sum, fd) => sum + fd.interestEarned, 0),
      activeFDs: fds.filter(fd => fd.status === 'active').length,
      maturedFDs: fds.filter(fd => fd.status === 'matured').length,
      upcomingMaturities: fds.filter(fd => fd.daysUntilMaturity <= 30 && fd.status === 'active').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming maturities
// @route   GET /api/fixed-deposits/upcoming-maturities
// @access  Private
router.get('/upcoming-maturities', async (req, res, next) => {
  try {
    const fds = await FixedDeposit.find({
      user: req.user.id,
      isActive: true,
      status: 'active'
    }).sort({ maturityDate: 1 });

    const upcoming = fds.filter(fd => fd.daysUntilMaturity <= 90);

    res.json({
      success: true,
      data: upcoming
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
