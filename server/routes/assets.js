const express = require('express');
const { body, validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const assets = await Asset.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, user: req.user.id });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Asset name is required'),
  body('type').isIn(['real_estate', 'vehicle', 'jewelry', 'electronics', 'furniture', 'investment', 'other']),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('currentValue').isFloat({ min: 0 }).withMessage('Current value must be a positive number'),
  body('purchaseDate').isISO8601().withMessage('Purchase date must be a valid date'),
  body('depreciationRate').optional().isFloat({ min: 0, max: 100 })
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

    const assetData = {
      ...req.body,
      user: req.user.id
    };

    const asset = await Asset.create(assetData);

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('currentValue').optional().isFloat({ min: 0 }),
  body('depreciationRate').optional().isFloat({ min: 0, max: 100 })
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

    let asset = await Asset.findOne({ _id: req.params.id, user: req.user.id });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, user: req.user.id });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.isActive = false;
    await asset.save();

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get asset statistics
// @route   GET /api/assets/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const assets = await Asset.find({ user: req.user.id, isActive: true });

    const stats = {
      totalAssets: assets.length,
      totalPurchaseValue: assets.reduce((sum, asset) => sum + asset.purchasePrice, 0),
      totalCurrentValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
      totalProfitLoss: assets.reduce((sum, asset) => sum + asset.profitLoss, 0),
      totalMaintenanceCost: assets.reduce((sum, asset) => sum + asset.totalMaintenanceCost, 0),
      byType: {}
    };

    // Group by type
    assets.forEach(asset => {
      if (!stats.byType[asset.type]) {
        stats.byType[asset.type] = {
          count: 0,
          totalValue: 0,
          totalPurchaseValue: 0
        };
      }
      stats.byType[asset.type].count++;
      stats.byType[asset.type].totalValue += asset.currentValue;
      stats.byType[asset.type].totalPurchaseValue += asset.purchasePrice;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add maintenance record
// @route   POST /api/assets/:id/maintenance
// @access  Private
router.post('/:id/maintenance', [
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('type').optional().trim()
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

    const asset = await Asset.findOne({ _id: req.params.id, user: req.user.id });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.maintenance.push(req.body);
    await asset.save();

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
