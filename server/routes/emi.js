const express = require('express');
const { body, validationResult } = require('express-validator');
const EMI = require('../models/EMI');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all EMIs for user
// @route   GET /api/emi
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const emis = await EMI.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: emis.length,
      data: emis
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single EMI
// @route   GET /api/emi/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const emi = await EMI.findOne({ _id: req.params.id, user: req.user.id });

    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI not found'
      });
    }

    res.json({
      success: true,
      data: emi
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new EMI
// @route   POST /api/emi
// @access  Private
router.post('/', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('loanAmount').isFloat({ min: 0 }).withMessage('Loan amount must be a positive number'),
  body('interestRate').isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('tenure').isInt({ min: 1 }).withMessage('Tenure must be a positive integer'),
  body('tenureType').isIn(['months', 'years']).withMessage('Tenure type must be months or years'),
  body('emiDate').isInt({ min: 1, max: 31 }).withMessage('EMI date must be between 1-31'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('lender').trim().isLength({ min: 1 }).withMessage('Lender name is required'),
  body('loanType').optional().isIn(['home', 'car', 'personal', 'business', 'education', 'other'])
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

    const emiData = {
      ...req.body,
      user: req.user.id
    };

    const emi = await EMI.create(emiData);

    res.status(201).json({
      success: true,
      message: 'EMI created successfully',
      data: emi
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update EMI
// @route   PUT /api/emi/:id
// @access  Private
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('loanAmount').optional().isFloat({ min: 0 }).withMessage('Loan amount must be a positive number'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('tenure').optional().isInt({ min: 1 }).withMessage('Tenure must be a positive integer'),
  body('emiDate').optional().isInt({ min: 1, max: 31 }).withMessage('EMI date must be between 1-31'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('status').optional().isIn(['active', 'completed', 'overdue'])
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

    let emi = await EMI.findOne({ _id: req.params.id, user: req.user.id });

    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI not found'
      });
    }

    emi = await EMI.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'EMI updated successfully',
      data: emi
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete EMI
// @route   DELETE /api/emi/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const emi = await EMI.findOne({ _id: req.params.id, user: req.user.id });

    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI not found'
      });
    }

    // Soft delete
    emi.isActive = false;
    await emi.save();

    res.json({
      success: true,
      message: 'EMI deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get EMI schedule
// @route   GET /api/emi/:id/schedule
// @access  Private
router.get('/:id/schedule', async (req, res, next) => {
  try {
    const emi = await EMI.findOne({ _id: req.params.id, user: req.user.id });

    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI not found'
      });
    }

    // Generate EMI schedule
    const schedule = [];
    const totalMonths = emi.tenureType === 'years' ? emi.tenure * 12 : emi.tenure;
    const monthlyRate = emi.interestRate / 100 / 12;
    let remainingPrincipal = emi.loanAmount;

    for (let month = 1; month <= totalMonths; month++) {
      const interest = remainingPrincipal * monthlyRate;
      const principal = emi.emiAmount - interest;
      remainingPrincipal -= principal;

      const dueDate = new Date(emi.startDate);
      dueDate.setMonth(dueDate.getMonth() + month - 1);
      dueDate.setDate(emi.emiDate);

      schedule.push({
        month,
        dueDate,
        emiAmount: emi.emiAmount,
        principal: Math.abs(principal),
        interest,
        remainingPrincipal: Math.max(0, remainingPrincipal)
      });
    }

    res.json({
      success: true,
      data: {
        emi,
        schedule
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get EMI statistics
// @route   GET /api/emi/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const emis = await EMI.find({ user: req.user.id, isActive: true });

    const stats = {
      totalEmis: emis.length,
      totalLoanAmount: emis.reduce((sum, emi) => sum + emi.loanAmount, 0),
      totalEmiAmount: emis.reduce((sum, emi) => sum + emi.emiAmount, 0),
      totalInterest: emis.reduce((sum, emi) => sum + emi.totalInterest, 0),
      activeEmis: emis.filter(emi => emi.status === 'active').length,
      completedEmis: emis.filter(emi => emi.status === 'completed').length,
      overdueEmis: emis.filter(emi => emi.status === 'overdue').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming EMI due dates
// @route   GET /api/emi/upcoming
// @access  Private
router.get('/upcoming', async (req, res, next) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const upcomingEmis = await EMI.find({
      user: req.user.id,
      isActive: true,
      status: 'active',
      endDate: { $gte: today }
    }).sort({ emiDate: 1 });

    const upcoming = upcomingEmis.map(emi => ({
      ...emi.toObject(),
      nextDueDate: emi.nextDueDate,
      daysUntilDue: emi.daysUntilDue
    }));

    res.json({
      success: true,
      data: upcoming
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
