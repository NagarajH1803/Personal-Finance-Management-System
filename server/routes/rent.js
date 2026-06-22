const express = require('express');
const { body, validationResult } = require('express-validator');
const Rent = require('../models/Rent');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all rent records
// @route   GET /api/rent
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const rents = await Rent.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rents.length,
      data: rents
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single rent record
// @route   GET /api/rent/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const rent = await Rent.findOne({ _id: req.params.id, user: req.user.id });

    if (!rent) {
      return res.status(404).json({
        success: false,
        message: 'Rent record not found'
      });
    }

    res.json({
      success: true,
      data: rent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new rent record
// @route   POST /api/rent
// @access  Private
router.post('/', [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('propertyName').trim().isLength({ min: 1 }).withMessage('Property name is required'),
  body('propertyType').isIn(['apartment', 'house', 'office', 'shop', 'land', 'other']),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('dueDate').isInt({ min: 1, max: 31 }).withMessage('Due date must be between 1-31'),
  body('agreement.startDate').isISO8601().withMessage('Agreement start date must be a valid date'),
  body('agreement.endDate').isISO8601().withMessage('Agreement end date must be a valid date')
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

    const rentData = {
      ...req.body,
      user: req.user.id
    };

    const rent = await Rent.create(rentData);

    res.status(201).json({
      success: true,
      message: 'Rent record created successfully',
      data: rent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update rent record
// @route   PUT /api/rent/:id
// @access  Private
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isInt({ min: 1, max: 31 }),
  body('status').optional().isIn(['active', 'expired', 'terminated'])
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

    let rent = await Rent.findOne({ _id: req.params.id, user: req.user.id });

    if (!rent) {
      return res.status(404).json({
        success: false,
        message: 'Rent record not found'
      });
    }

    rent = await Rent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Rent record updated successfully',
      data: rent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete rent record
// @route   DELETE /api/rent/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const rent = await Rent.findOne({ _id: req.params.id, user: req.user.id });

    if (!rent) {
      return res.status(404).json({
        success: false,
        message: 'Rent record not found'
      });
    }

    rent.isActive = false;
    await rent.save();

    res.json({
      success: true,
      message: 'Rent record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get rent statistics
// @route   GET /api/rent/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const rents = await Rent.find({ user: req.user.id, isActive: true });

    const stats = {
      totalRents: rents.length,
      totalIncome: rents.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0),
      totalExpense: rents.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0),
      netIncome: rents.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0) - 
                 rents.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0),
      activeAgreements: rents.filter(r => r.status === 'active').length,
      expiringSoon: rents.filter(r => r.daysUntilDue <= 30 && r.status === 'active').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming due dates
// @route   GET /api/rent/upcoming
// @access  Private
router.get('/upcoming', async (req, res, next) => {
  try {
    const rents = await Rent.find({
      user: req.user.id,
      isActive: true,
      status: 'active'
    }).sort({ dueDate: 1 });

    const upcoming = rents.filter(rent => rent.daysUntilDue <= 30);

    res.json({
      success: true,
      data: upcoming
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
