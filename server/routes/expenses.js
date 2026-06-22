const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');
const { ErrorResponse } = require('../utils/errorHandler');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @desc    Get all expenses with filtering and pagination
// @route   GET /api/expenses
// @access  Private
router.get('/', [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('category').optional({ checkFalsy: true }).isString().withMessage('Category must be a string'),
  query('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('End date must be a valid date'),
  query('minAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Min amount must be a positive number').toFloat(),
  query('maxAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Max amount must be a positive number').toFloat(),
  query('paymentMethod').optional({ checkFalsy: true }).isString().withMessage('Payment method must be a string'),
  query('isRecurring').optional({ checkFalsy: true }).isBoolean().withMessage('isRecurring must be a boolean').toBoolean(),
  query('status').optional({ checkFalsy: true }).isString().withMessage('Status must be a string'),
  query('search').optional({ checkFalsy: true }).isString().withMessage('Search must be a string'),
  query('sortBy').optional({ checkFalsy: true }).isIn(['date', 'amount', 'category', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional({ checkFalsy: true }).isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation error', 400, errors.array()));
    }

    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      isRecurring,
      status,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: req.user.id };

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (isRecurring !== undefined && isRecurring !== '') filter.isRecurring = isRecurring === true || isRecurring === 'true';
    if (status) filter.status = status;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('user', 'name email');

    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    // Check if expense belongs to user
    if (expense.user._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to access this expense', 401));
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn([
    'Food & Dining', 'Transportation', 'Housing & Rent', 'Utilities', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Insurance', 'Taxes', 'Travel',
    'Personal Care', 'Gifts & Donations', 'Business', 'Investment', 'Debt Payment',
    'Emergency', 'Other'
  ]).withMessage('Invalid category'),
  body('subCategory').optional().isLength({ max: 50 }).withMessage('Sub-category cannot exceed 50 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('paymentMethod').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Digital Wallet', 'Check', 'Other']).withMessage('Invalid payment method'),
  body('isRecurring').optional().isBoolean().withMessage('isRecurring must be a boolean'),
  body('recurringType').optional().isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']).withMessage('Invalid recurring type'),
  body('recurringEndDate').optional().isISO8601().withMessage('Recurring end date must be a valid date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('vendor').optional().isLength({ max: 100 }).withMessage('Vendor cannot exceed 100 characters'),
  body('isTaxDeductible').optional().isBoolean().withMessage('isTaxDeductible must be a boolean'),
  body('status').optional().isIn(['Pending', 'Paid', 'Cancelled', 'Refunded']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation error', 400, errors.array()));
    }

    // Validate recurring expense fields
    if (req.body.isRecurring) {
      if (!req.body.recurringType) {
        return next(new ErrorResponse('Recurring type is required for recurring expenses', 400));
      }
      if (!req.body.recurringEndDate) {
        return next(new ErrorResponse('Recurring end date is required for recurring expenses', 400));
      }
    }

    const expense = await Expense.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn([
    'Food & Dining', 'Transportation', 'Housing & Rent', 'Utilities', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Insurance', 'Taxes', 'Travel',
    'Personal Care', 'Gifts & Donations', 'Business', 'Investment', 'Debt Payment',
    'Emergency', 'Other'
  ]).withMessage('Invalid category'),
  body('subCategory').optional().isLength({ max: 50 }).withMessage('Sub-category cannot exceed 50 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('paymentMethod').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Digital Wallet', 'Check', 'Other']).withMessage('Invalid payment method'),
  body('isRecurring').optional().isBoolean().withMessage('isRecurring must be a boolean'),
  body('recurringType').optional().isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']).withMessage('Invalid recurring type'),
  body('recurringEndDate').optional().isISO8601().withMessage('Recurring end date must be a valid date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('vendor').optional().isLength({ max: 100 }).withMessage('Vendor cannot exceed 100 characters'),
  body('isTaxDeductible').optional().isBoolean().withMessage('isTaxDeductible must be a boolean'),
  body('status').optional().isIn(['Pending', 'Paid', 'Cancelled', 'Refunded']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation error', 400, errors.array()));
    }

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    // Check if expense belongs to user
    if (expense.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this expense', 401));
    }

    // Validate recurring expense fields
    if (req.body.isRecurring) {
      if (!req.body.recurringType) {
        return next(new ErrorResponse('Recurring type is required for recurring expenses', 400));
      }
      if (!req.body.recurringEndDate) {
        return next(new ErrorResponse('Recurring end date is required for recurring expenses', 400));
      }
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    // Check if expense belongs to user
    if (expense.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this expense', 401));
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/overview
// @access  Private
router.get('/stats/overview', [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation error', 400, errors.array()));
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const stats = await Expense.getExpenseStats(req.user.id, startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get expenses by category
// @route   GET /api/expenses/stats/by-category
// @access  Private
router.get('/stats/by-category', [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation error', 400, errors.array()));
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const stats = await Expense.getExpenseStats(req.user.id, startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats.byCategory
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get monthly expense trends
// @route   GET /api/expenses/stats/monthly
// @access  Private
router.get('/stats/monthly', [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation error', 400, errors.array()));
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const stats = await Expense.getExpenseStats(req.user.id, startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats.byMonth
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming recurring expenses
// @route   GET /api/expenses/recurring/upcoming
// @access  Private
router.get('/recurring/upcoming', async (req, res, next) => {
  try {
    const upcomingExpenses = await Expense.getUpcomingRecurring(req.user.id);

    res.status(200).json({
      success: true,
      data: upcomingExpenses
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create next recurring expense
// @route   POST /api/expenses/:id/create-next
// @access  Private
router.post('/:id/create-next', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    // Check if expense belongs to user
    if (expense.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to access this expense', 401));
    }

    if (!expense.isRecurring) {
      return next(new ErrorResponse('This expense is not recurring', 400));
    }

    const nextExpense = await expense.createNextRecurring();

    if (!nextExpense) {
      return next(new ErrorResponse('No more recurring expenses to create', 400));
    }

    res.status(201).json({
      success: true,
      data: nextExpense
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get expense categories
// @route   GET /api/expenses/categories
// @access  Private
router.get('/categories', async (req, res, next) => {
  try {
    const categories = [
      'Food & Dining',
      'Transportation',
      'Housing & Rent',
      'Utilities',
      'Healthcare',
      'Entertainment',
      'Shopping',
      'Education',
      'Insurance',
      'Taxes',
      'Travel',
      'Personal Care',
      'Gifts & Donations',
      'Business',
      'Investment',
      'Debt Payment',
      'Emergency',
      'Other'
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment methods
// @route   GET /api/expenses/payment-methods
// @access  Private
router.get('/payment-methods', async (req, res, next) => {
  try {
    const paymentMethods = [
      'Cash',
      'Credit Card',
      'Debit Card',
      'Bank Transfer',
      'UPI',
      'Digital Wallet',
      'Check',
      'Other'
    ];

    res.status(200).json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
