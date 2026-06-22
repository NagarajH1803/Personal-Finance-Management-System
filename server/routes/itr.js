const express = require('express');
const { body, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const ITR = require('../models/ITR');
const Asset = require('../models/Asset');
const Expense = require('../models/Expense');
const Stock = require('../models/Stock');
const { CryptoTransaction, CryptoHolding } = require('../models/Crypto');
const FixedDeposit = require('../models/FixedDeposit');
const Gold = require('../models/Gold');
const Rent = require('../models/Rent');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all ITR records
// @route   GET /api/itr
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const itrs = await ITR.find({ user: req.user.id, isActive: true })
      .sort({ financialYear: -1 });

    res.json({
      success: true,
      count: itrs.length,
      data: itrs
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single ITR record
// @route   GET /api/itr/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const itr = await ITR.findOne({ _id: req.params.id, user: req.user.id });

    if (!itr) {
      return res.status(404).json({
        success: false,
        message: 'ITR record not found'
      });
    }

    res.json({
      success: true,
      data: itr
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new ITR record
// @route   POST /api/itr
// @access  Private
router.post('/', [
  body('financialYear').matches(/^\d{4}-\d{4}$/).withMessage('Financial year must be in format YYYY-YYYY'),
  body('income.salary').optional().isFloat({ min: 0 }),
  body('income.business').optional().isFloat({ min: 0 }),
  body('income.houseProperty').optional().isFloat({ min: 0 }),
  body('income.capitalGains').optional().isFloat({ min: 0 }),
  body('income.otherSources').optional().isFloat({ min: 0 }),
  body('deductions.section80C').optional().isFloat({ min: 0 }),
  body('deductions.section80D').optional().isFloat({ min: 0 }),
  body('deductions.section80G').optional().isFloat({ min: 0 }),
  body('deductions.section80TTA').optional().isFloat({ min: 0 }),
  body('deductions.section80TTB').optional().isFloat({ min: 0 }),
  body('deductions.hra').optional().isFloat({ min: 0 }),
  body('taxesPaid.tds').optional().isFloat({ min: 0 }),
  body('taxesPaid.advanceTax').optional().isFloat({ min: 0 }),
  body('taxesPaid.selfAssessmentTax').optional().isFloat({ min: 0 })
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

    const itrData = {
      ...req.body,
      user: req.user.id
    };

    const itr = await ITR.create(itrData);

    res.status(201).json({
      success: true,
      message: 'ITR record created successfully',
      data: itr
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update ITR record
// @route   PUT /api/itr/:id
// @access  Private
router.put('/:id', [
  body('income.*').optional().isFloat({ min: 0 }),
  body('deductions.*').optional().isFloat({ min: 0 }),
  body('taxesPaid.*').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'filed', 'verified', 'processed', 'completed'])
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

    let itr = await ITR.findOne({ _id: req.params.id, user: req.user.id });

    if (!itr) {
      return res.status(404).json({
        success: false,
        message: 'ITR record not found'
      });
    }

    // Update the record
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        itr[key] = req.body[key];
      }
    });

    // Save to trigger pre-save middleware for recalculation
    await itr.save();

    res.json({
      success: true,
      message: 'ITR record updated successfully',
      data: itr
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Recalculate ITR tax
// @route   POST /api/itr/:id/recalculate
// @access  Private
router.post('/:id/recalculate', async (req, res, next) => {
  try {
    const itr = await ITR.findOne({ _id: req.params.id, user: req.user.id });

    if (!itr) {
      return res.status(404).json({
        success: false,
        message: 'ITR record not found'
      });
    }

    // Trigger recalculation by saving
    await itr.save();

    res.json({
      success: true,
      message: 'ITR tax recalculated successfully',
      data: itr
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete ITR record
// @route   DELETE /api/itr/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const itr = await ITR.findOne({ _id: req.params.id, user: req.user.id });

    if (!itr) {
      return res.status(404).json({
        success: false,
        message: 'ITR record not found'
      });
    }

    itr.isActive = false;
    await itr.save();

    res.json({
      success: true,
      message: 'ITR record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Generate ITR PDF
// @route   GET /api/itr/:id/pdf
// @access  Private
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const itr = await ITR.findOne({ _id: req.params.id, user: req.user.id });

    if (!itr) {
      return res.status(404).json({
        success: false,
        message: 'ITR record not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ITR-${itr.financialYear}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Income Tax Return Summary', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Financial Year: ${itr.financialYear}`);
    doc.moveDown();
    
    // Income Details
    doc.fontSize(16).text('Income Details');
    doc.fontSize(12).text(`Salary: ₹${itr.income.salary.toLocaleString()}`);
    doc.text(`Business: ₹${itr.income.business.toLocaleString()}`);
    doc.text(`House Property: ₹${itr.income.houseProperty.toLocaleString()}`);
    doc.text(`Capital Gains: ₹${itr.income.capitalGains.toLocaleString()}`);
    doc.text(`Other Sources: ₹${itr.income.otherSources.toLocaleString()}`);
    doc.text(`Total Income: ₹${itr.income.total.toLocaleString()}`);
    doc.moveDown();
    
    // Deductions
    doc.fontSize(16).text('Deductions');
    doc.fontSize(12).text(`Section 80C: ₹${itr.deductions.section80C.toLocaleString()}`);
    doc.text(`Section 80D: ₹${itr.deductions.section80D.toLocaleString()}`);
    doc.text(`Section 80G: ₹${itr.deductions.section80G.toLocaleString()}`);
    doc.text(`HRA: ₹${itr.deductions.hra.toLocaleString()}`);
    doc.text(`Standard Deduction: ₹${itr.deductions.standardDeduction.toLocaleString()}`);
    doc.text(`Total Deductions: ₹${itr.deductions.total.toLocaleString()}`);
    doc.moveDown();
    
    // Tax Calculation
    doc.fontSize(16).text('Tax Calculation');
    doc.fontSize(12).text(`Taxable Income: ₹${itr.taxCalculation.taxableIncome.toLocaleString()}`);
    doc.text(`Tax Amount: ₹${itr.taxCalculation.taxAmount.toLocaleString()}`);
    doc.text(`Surcharge: ₹${itr.taxCalculation.surcharge.toLocaleString()}`);
    doc.text(`Education Cess: ₹${itr.taxCalculation.educationCess.toLocaleString()}`);
    doc.text(`Total Tax: ₹${itr.taxCalculation.totalTax.toLocaleString()}`);
    doc.moveDown();
    
    // Taxes Paid
    doc.fontSize(16).text('Taxes Paid');
    doc.fontSize(12).text(`TDS: ₹${itr.taxesPaid.tds.toLocaleString()}`);
    doc.text(`Advance Tax: ₹${itr.taxesPaid.advanceTax.toLocaleString()}`);
    doc.text(`Self Assessment Tax: ₹${itr.taxesPaid.selfAssessmentTax.toLocaleString()}`);
    doc.text(`Total Taxes Paid: ₹${itr.taxesPaid.total.toLocaleString()}`);
    doc.moveDown();
    
    // Refund/Liability
    doc.fontSize(16).text('Refund/Liability');
    if (itr.refund.amount > 0) {
      doc.fontSize(12).text(`Refund Amount: ₹${itr.refund.amount.toLocaleString()}`);
    } else {
      doc.fontSize(12).text(`Tax Liability: ₹${Math.abs(itr.refund.amount).toLocaleString()}`);
    }
    
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`);
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
});

// @desc    Auto-calculate ITR from financial data
// @route   POST /api/itr/auto-calculate
// @access  Private
router.post('/auto-calculate', async (req, res, next) => {
  try {
    const { financialYear } = req.body;
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    // Calculate start and end dates for the financial year
    const [startYear, endYear] = financialYear.split('-').map(Number);
    const startDate = new Date(startYear, 3, 1); // April 1st
    const endDate = new Date(endYear, 2, 31); // March 31st

    // Aggregate data from all modules
    const [
      assets,
      expenses,
      stocks,
      cryptoTransactions,
      cryptoHoldings,
      fixedDeposits,
      goldHoldings,
      rentIncome,
      rentExpenses
    ] = await Promise.all([
      Asset.find({ user: req.user.id, isActive: true }),
      Expense.find({ user: req.user.id, date: { $gte: startDate, $lte: endDate } }),
      Stock.find({ user: req.user.id, isActive: true }),
      CryptoTransaction.find({ user: req.user.id, transactionDate: { $gte: startDate, $lte: endDate } }),
      CryptoHolding.find({ user: req.user.id, isActive: true }),
      FixedDeposit.find({ user: req.user.id, isActive: true }),
      Gold.find({ user: req.user.id, isActive: true }),
      Rent.find({ user: req.user.id, type: 'income', isActive: true }),
      Rent.find({ user: req.user.id, type: 'expense', isActive: true })
    ]);

    // Calculate income sources
    const income = {
      salary: 0, // This would need to be manually entered or from salary module
      business: 0, // This would need to be manually entered or from business module
      houseProperty: calculateHousePropertyIncome(rentIncome, rentExpenses),
      capitalGains: calculateCapitalGains(stocks, cryptoTransactions, goldHoldings, assets),
      otherSources: calculateOtherSources(fixedDeposits, cryptoHoldings),
      total: 0
    };

    // Calculate deductions
    const deductions = {
      section80C: calculateSection80C(fixedDeposits, expenses),
      section80D: calculateSection80D(expenses),
      section80G: calculateSection80G(expenses),
      section80TTA: calculateSection80TTA(expenses),
      section80TTB: calculateSection80TTB(expenses),
      hra: calculateHRA(expenses),
      standardDeduction: 50000,
      total: 0
    };

    // Calculate total income
    income.total = income.salary + income.business + income.houseProperty + 
                   income.capitalGains + income.otherSources;

    // Calculate total deductions
    deductions.total = deductions.section80C + deductions.section80D + 
                      deductions.section80G + deductions.section80TTA + 
                      deductions.section80TTB + deductions.hra + 
                      deductions.standardDeduction;

    // Calculate tax
    const grossTotalIncome = income.total;
    const totalDeductions = deductions.total;
    const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);
    
    const taxAmount = calculateTax(taxableIncome);
    const surcharge = taxAmount > 5000000 ? taxAmount * 0.10 : 0;
    const educationCess = (taxAmount + surcharge) * 0.04;
    const totalTax = taxAmount + surcharge + educationCess;

    const taxCalculation = {
      grossTotalIncome,
      totalDeductions,
      taxableIncome,
      taxAmount,
      surcharge,
      educationCess,
      totalTax
    };

    // Create ITR record with auto-calculated values
    const itrData = {
      user: req.user.id,
      financialYear,
      income,
      deductions,
      taxCalculation,
      taxesPaid: {
        tds: 0,
        advanceTax: 0,
        selfAssessmentTax: 0,
        total: 0
      },
      refund: {
        amount: 0
      },
      status: 'draft'
    };

    const itr = await ITR.create(itrData);

    res.status(201).json({
      success: true,
      message: 'ITR auto-calculated successfully',
      data: itr
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions for calculations
function calculateHousePropertyIncome(rentIncome, rentExpenses) {
  const totalRentIncome = rentIncome.reduce((sum, rent) => sum + (rent.amount * 12), 0);
  const totalRentExpenses = rentExpenses.reduce((sum, rent) => sum + (rent.amount * 12), 0);
  return Math.max(0, totalRentIncome - totalRentExpenses);
}

function calculateCapitalGains(stocks, cryptoTransactions, goldHoldings, assets) {
  let totalCapitalGains = 0;

  // Stock capital gains
  stocks.forEach(stock => {
    const sellTransactions = stock.transactions.filter(t => t.type === 'sell');
    sellTransactions.forEach(transaction => {
      const buyTransactions = stock.transactions
        .filter(t => t.type === 'buy' && t.date <= transaction.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      let remainingQuantity = transaction.quantity;
      let costBasis = 0;
      
      for (const buy of buyTransactions) {
        if (remainingQuantity <= 0) break;
        const quantityToUse = Math.min(remainingQuantity, buy.quantity);
        costBasis += quantityToUse * buy.price;
        remainingQuantity -= quantityToUse;
      }
      
      const saleValue = transaction.quantity * transaction.price;
      totalCapitalGains += saleValue - costBasis;
    });
  });

  // Crypto capital gains
  cryptoTransactions.forEach(transaction => {
    if (transaction.transactionType === 'sell') {
      totalCapitalGains += transaction.calculatedProfitLoss || 0;
    }
  });

  // Gold capital gains
  goldHoldings.forEach(gold => {
    totalCapitalGains += gold.profitLoss || 0;
  });

  // Asset capital gains (for real estate, etc.)
  assets.forEach(asset => {
    if (asset.type === 'real_estate' || asset.type === 'investment') {
      totalCapitalGains += asset.profitLoss || 0;
    }
  });

  return totalCapitalGains;
}

function calculateOtherSources(fixedDeposits, cryptoHoldings) {
  let otherSources = 0;

  // Fixed deposit interest
  fixedDeposits.forEach(fd => {
    otherSources += fd.interestEarned || 0;
  });

  // Crypto staking rewards
  cryptoHoldings.forEach(crypto => {
    if (crypto.staking.isStaked) {
      otherSources += crypto.totalStakingRewards || 0;
    }
  });

  return otherSources;
}

function calculateSection80C(fixedDeposits, expenses) {
  let section80C = 0;

  // Fixed deposits (up to 1.5 lakhs)
  const fdContribution = fixedDeposits.reduce((sum, fd) => sum + fd.amount, 0);
  section80C += Math.min(fdContribution, 150000);

  // Insurance premiums from expenses
  const insurancePremiums = expenses
    .filter(expense => expense.category === 'Insurance' && expense.isTaxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  section80C += Math.min(insurancePremiums, 150000 - section80C);

  return Math.min(section80C, 150000);
}

function calculateSection80D(expenses) {
  // Health insurance premiums
  const healthInsurance = expenses
    .filter(expense => 
      expense.category === 'Insurance' && 
      expense.subCategory && 
      expense.subCategory.toLowerCase().includes('health')
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  return Math.min(healthInsurance, 25000); // Basic limit for individuals
}

function calculateSection80G(expenses) {
  // Donations to charitable organizations
  const donations = expenses
    .filter(expense => 
      expense.category === 'Gifts & Donations' && 
      expense.isTaxDeductible
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  return donations;
}

function calculateSection80TTA(expenses) {
  // Interest on savings account (up to ₹10,000)
  const savingsInterest = expenses
    .filter(expense => 
      expense.category === 'Investment' && 
      expense.subCategory && 
      expense.subCategory.toLowerCase().includes('savings')
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  return Math.min(savingsInterest, 10000);
}

function calculateSection80TTB(expenses) {
  // Interest on deposits (up to ₹50,000 for senior citizens)
  const depositInterest = expenses
    .filter(expense => 
      expense.category === 'Investment' && 
      expense.subCategory && 
      expense.subCategory.toLowerCase().includes('deposit')
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  return Math.min(depositInterest, 50000);
}

function calculateHRA(expenses) {
  // House rent allowance from expenses
  const hraExpenses = expenses
    .filter(expense => 
      expense.category === 'Housing & Rent' && 
      expense.isTaxDeductible
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  return hraExpenses;
}

function calculateTax(taxableIncome) {
  let tax = 0;
  
  if (taxableIncome <= 250000) {
    tax = 0;
  } else if (taxableIncome <= 500000) {
    tax = (taxableIncome - 250000) * 0.05;
  } else if (taxableIncome <= 1000000) {
    tax = 12500 + (taxableIncome - 500000) * 0.20;
  } else {
    tax = 112500 + (taxableIncome - 1000000) * 0.30;
  }
  
  return tax;
}

// @desc    Get ITR statistics
// @route   GET /api/itr/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const itrs = await ITR.find({ user: req.user.id, isActive: true });

    const stats = {
      totalITRs: itrs.length,
      totalIncome: itrs.reduce((sum, itr) => sum + itr.income.total, 0),
      totalTaxPaid: itrs.reduce((sum, itr) => sum + itr.taxesPaid.total, 0),
      totalTaxLiability: itrs.reduce((sum, itr) => sum + itr.taxCalculation.totalTax, 0),
      totalRefund: itrs.reduce((sum, itr) => sum + Math.max(0, itr.refund.amount), 0),
      byStatus: {}
    };

    // Group by status
    itrs.forEach(itr => {
      if (!stats.byStatus[itr.status]) {
        stats.byStatus[itr.status] = 0;
      }
      stats.byStatus[itr.status]++;
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
