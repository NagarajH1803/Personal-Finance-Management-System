const express = require('express');
const EMI = require('../models/EMI');
const Asset = require('../models/Asset');
const Stock = require('../models/Stock');
const FixedDeposit = require('../models/FixedDeposit');
const Gold = require('../models/Gold');
const Rent = require('../models/Rent');
const ITR = require('../models/ITR');
const Expense = require('../models/Expense');
const MoneyLent = require('../models/MoneyLent');
const { CryptoHolding } = require('../models/Crypto');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all data in parallel
    const [emis, assets, stocks, fds, gold, rents, itrs, expenses, moneyLent, cryptoHoldings] = await Promise.all([
      EMI.find({ user: userId, isActive: true }),
      Asset.find({ user: userId, isActive: true }),
      Stock.find({ user: userId, isActive: true }),
      FixedDeposit.find({ user: userId, isActive: true }),
      Gold.find({ user: userId, isActive: true }),
      Rent.find({ user: userId, isActive: true }),
      ITR.find({ user: userId, isActive: true }),
      Expense.find({ user: userId }),
      MoneyLent.find({ user: userId, isActive: true }),
      CryptoHolding.find({ user: userId, isActive: true })
    ]);

    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalStocks = stocks.reduce((sum, stock) => sum + stock.currentValue, 0);
    const totalFDs = fds.reduce((sum, fd) => sum + fd.currentValue, 0);
    const totalGold = gold.reduce((sum, g) => sum + g.currentValue, 0);
    const totalCrypto = cryptoHoldings.reduce((sum, crypto) => sum + crypto.currentValue, 0);
    const totalMoneyLent = moneyLent.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    const totalRentIncome = rents.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalRentExpense = rents.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

    // Calculate expenses
    const currentMonth = new Date();
    const currentMonthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === currentMonth.getMonth() && 
             expenseDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    // Calculate liabilities
    const totalEMIOutstanding = emis.filter(e => e.status === 'active').reduce((sum, emi) => sum + emi.remainingAmount, 0);
    const totalEMIMonthly = emis.filter(e => e.status === 'active').reduce((sum, emi) => sum + emi.emiAmount, 0);

    // Calculate net worth
    const totalInvestments = totalAssets + totalStocks + totalFDs + totalGold + totalCrypto;
    const totalLiabilities = totalEMIOutstanding;
    const netWorth = totalInvestments - totalLiabilities;

    const overview = {
      netWorth: {
        total: netWorth,
        assets: totalInvestments,
        liabilities: totalLiabilities
      },
      assets: {
        realEstate: assets.filter(a => a.type === 'real_estate').reduce((sum, a) => sum + a.currentValue, 0),
        vehicles: assets.filter(a => a.type === 'vehicle').reduce((sum, a) => sum + a.currentValue, 0),
        stocks: totalStocks,
        fixedDeposits: totalFDs,
        gold: totalGold,
        crypto: totalCrypto,
        other: assets.filter(a => !['real_estate', 'vehicle'].includes(a.type)).reduce((sum, a) => sum + a.currentValue, 0)
      },
      liabilities: {
        emiOutstanding: totalEMIOutstanding,
        monthlyEMI: totalEMIMonthly
      },
      income: {
        rent: totalRentIncome,
        moneyLent: moneyLent.reduce((sum, loan) => sum + loan.totalInterestEarned, 0),
        total: totalRentIncome + moneyLent.reduce((sum, loan) => sum + loan.totalInterestEarned, 0)
      },
      expenses: {
        rent: totalRentExpense,
        emi: totalEMIMonthly,
        general: currentMonthExpenses,
        total: totalRentExpense + totalEMIMonthly + currentMonthExpenses
      },
      counts: {
        emis: emis.length,
        assets: assets.length,
        stocks: stocks.length,
        fds: fds.length,
        gold: gold.length,
        rents: rents.length,
        itrs: itrs.length,
        expenses: expenses.length,
        moneyLent: moneyLent.length,
        crypto: cryptoHoldings.length
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get monthly cash flow
// @route   GET /api/dashboard/cashflow
// @access  Private
router.get('/cashflow', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const [emis, rents] = await Promise.all([
      EMI.find({ user: userId, isActive: true, status: 'active' }),
      Rent.find({ user: userId, isActive: true, status: 'active' })
    ]);

    // Calculate monthly expenses
    const monthlyEMI = emis.reduce((sum, emi) => sum + emi.emiAmount, 0);
    const monthlyRentExpense = rents.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const monthlyRentIncome = rents.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);

    const cashflow = {
      month: targetMonth,
      year: targetYear,
      income: {
        rent: monthlyRentIncome,
        total: monthlyRentIncome
      },
      expenses: {
        emi: monthlyEMI,
        rent: monthlyRentExpense,
        total: monthlyEMI + monthlyRentExpense
      },
      netCashflow: monthlyRentIncome - (monthlyEMI + monthlyRentExpense)
    };

    res.json({
      success: true,
      data: cashflow
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming payments
// @route   GET /api/dashboard/upcoming
// @access  Private
router.get('/upcoming', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [upcomingEmis, upcomingRents, upcomingFDs] = await Promise.all([
      EMI.find({
        user: userId,
        isActive: true,
        status: 'active',
        endDate: { $gte: new Date() }
      }).sort({ emiDate: 1 }),
      Rent.find({
        user: userId,
        isActive: true,
        status: 'active'
      }).sort({ dueDate: 1 }),
      FixedDeposit.find({
        user: userId,
        isActive: true,
        status: 'active'
      }).sort({ maturityDate: 1 })
    ]);

    const upcoming = {
      emis: upcomingEmis.filter(emi => emi.daysUntilDue <= 30).map(emi => ({
        type: 'EMI',
        title: emi.title,
        amount: emi.emiAmount,
        dueDate: emi.nextDueDate,
        daysUntilDue: emi.daysUntilDue
      })),
      rents: upcomingRents.filter(rent => rent.daysUntilDue <= 30).map(rent => ({
        type: 'Rent',
        title: rent.propertyName,
        amount: rent.amount,
        dueDate: rent.nextDueDate,
        daysUntilDue: rent.daysUntilDue
      })),
      fds: upcomingFDs.filter(fd => fd.daysUntilMaturity <= 90).map(fd => ({
        type: 'FD Maturity',
        title: `${fd.bankName} - ${fd.fdNumber}`,
        amount: fd.maturityAmount,
        dueDate: fd.maturityDate,
        daysUntilDue: fd.daysUntilMaturity
      }))
    };

    // Combine and sort by due date
    const allUpcoming = [
      ...upcoming.emis,
      ...upcoming.rents,
      ...upcoming.fds
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      data: {
        upcoming: allUpcoming,
        summary: {
          emis: upcoming.emis.length,
          rents: upcoming.rents.length,
          fds: upcoming.fds.length,
          total: allUpcoming.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get investment performance
// @route   GET /api/dashboard/performance
// @access  Private
router.get('/performance', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [stocks, gold, assets, cryptoHoldings] = await Promise.all([
      Stock.find({ user: userId, isActive: true }),
      Gold.find({ user: userId, isActive: true }),
      Asset.find({ user: userId, isActive: true }),
      CryptoHolding.find({ user: userId, isActive: true })
    ]);

    const performance = {
      stocks: {
        totalInvested: stocks.reduce((sum, stock) => sum + stock.totalInvested, 0),
        currentValue: stocks.reduce((sum, stock) => sum + stock.currentValue, 0),
        profitLoss: stocks.reduce((sum, stock) => sum + stock.profitLoss, 0),
        profitLossPercentage: stocks.length > 0 ? 
          (stocks.reduce((sum, stock) => sum + stock.profitLoss, 0) / 
           stocks.reduce((sum, stock) => sum + stock.totalInvested, 0)) * 100 : 0
      },
      gold: {
        totalInvested: gold.reduce((sum, g) => sum + g.purchaseValue, 0),
        currentValue: gold.reduce((sum, g) => sum + g.currentValue, 0),
        profitLoss: gold.reduce((sum, g) => sum + g.profitLoss, 0),
        profitLossPercentage: gold.length > 0 ?
          (gold.reduce((sum, g) => sum + g.profitLoss, 0) / 
           gold.reduce((sum, g) => sum + g.purchaseValue, 0)) * 100 : 0
      },
      assets: {
        totalInvested: assets.reduce((sum, asset) => sum + asset.purchasePrice, 0),
        currentValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
        profitLoss: assets.reduce((sum, asset) => sum + asset.profitLoss, 0),
        profitLossPercentage: assets.length > 0 ?
          (assets.reduce((sum, asset) => sum + asset.profitLoss, 0) / 
           assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)) * 100 : 0
      },
      crypto: {
        totalInvested: cryptoHoldings.reduce((sum, crypto) => sum + crypto.totalInvested, 0),
        currentValue: cryptoHoldings.reduce((sum, crypto) => sum + crypto.currentValue, 0),
        profitLoss: cryptoHoldings.reduce((sum, crypto) => sum + crypto.profitLoss, 0),
        profitLossPercentage: cryptoHoldings.length > 0 ?
          (cryptoHoldings.reduce((sum, crypto) => sum + crypto.profitLoss, 0) / 
           cryptoHoldings.reduce((sum, crypto) => sum + crypto.totalInvested, 0)) * 100 : 0
      }
    };

    // Overall performance
    const totalInvested = performance.stocks.totalInvested + performance.gold.totalInvested + performance.assets.totalInvested + performance.crypto.totalInvested;
    const totalCurrentValue = performance.stocks.currentValue + performance.gold.currentValue + performance.assets.currentValue + performance.crypto.currentValue;
    const totalProfitLoss = performance.stocks.profitLoss + performance.gold.profitLoss + performance.assets.profitLoss + performance.crypto.profitLoss;

    performance.overall = {
      totalInvested,
      currentValue: totalCurrentValue,
      profitLoss: totalProfitLoss,
      profitLossPercentage: totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get asset allocation
// @route   GET /api/dashboard/allocation
// @access  Private
router.get('/allocation', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [assets, stocks, fds, gold, cryptoHoldings] = await Promise.all([
      Asset.find({ user: userId, isActive: true }),
      Stock.find({ user: userId, isActive: true }),
      FixedDeposit.find({ user: userId, isActive: true }),
      Gold.find({ user: userId, isActive: true }),
      CryptoHolding.find({ user: userId, isActive: true })
    ]);

    const totalAssets = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalStocks = stocks.reduce((sum, stock) => sum + stock.currentValue, 0);
    const totalFDs = fds.reduce((sum, fd) => sum + fd.currentValue, 0);
    const totalGold = gold.reduce((sum, g) => sum + g.currentValue, 0);
    const totalCrypto = cryptoHoldings.reduce((sum, crypto) => sum + crypto.currentValue, 0);

    const totalPortfolio = totalAssets + totalStocks + totalFDs + totalGold + totalCrypto;

    const allocation = {
      realEstate: {
        value: assets.filter(a => a.type === 'real_estate').reduce((sum, a) => sum + a.currentValue, 0),
        percentage: totalPortfolio > 0 ? (assets.filter(a => a.type === 'real_estate').reduce((sum, a) => sum + a.currentValue, 0) / totalPortfolio) * 100 : 0
      },
      vehicles: {
        value: assets.filter(a => a.type === 'vehicle').reduce((sum, a) => sum + a.currentValue, 0),
        percentage: totalPortfolio > 0 ? (assets.filter(a => a.type === 'vehicle').reduce((sum, a) => sum + a.currentValue, 0) / totalPortfolio) * 100 : 0
      },
      stocks: {
        value: totalStocks,
        percentage: totalPortfolio > 0 ? (totalStocks / totalPortfolio) * 100 : 0
      },
      fixedDeposits: {
        value: totalFDs,
        percentage: totalPortfolio > 0 ? (totalFDs / totalPortfolio) * 100 : 0
      },
      gold: {
        value: totalGold,
        percentage: totalPortfolio > 0 ? (totalGold / totalPortfolio) * 100 : 0
      },
      crypto: {
        value: totalCrypto,
        percentage: totalPortfolio > 0 ? (totalCrypto / totalPortfolio) * 100 : 0
      },
      other: {
        value: assets.filter(a => !['real_estate', 'vehicle'].includes(a.type)).reduce((sum, a) => sum + a.currentValue, 0),
        percentage: totalPortfolio > 0 ? (assets.filter(a => !['real_estate', 'vehicle'].includes(a.type)).reduce((sum, a) => sum + a.currentValue, 0) / totalPortfolio) * 100 : 0
      }
    };

    res.json({
      success: true,
      data: {
        allocation,
        totalPortfolio
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
