const express = require('express');
const EMI = require('../models/EMI');
const Rent = require('../models/Rent');
const FixedDeposit = require('../models/FixedDeposit');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get upcoming EMIs
    const upcomingEmis = await EMI.find({
      user: userId,
      isActive: true,
      status: 'active'
    });

    // Get upcoming rent payments
    const upcomingRents = await Rent.find({
      user: userId,
      isActive: true,
      status: 'active'
    });

    // Get upcoming FD maturities
    const upcomingFDs = await FixedDeposit.find({
      user: userId,
      isActive: true,
      status: 'active'
    });

    const notifications = [];

    // Process EMI notifications
    upcomingEmis.forEach(emi => {
      const daysUntilDue = emi.daysUntilDue;
      
      if (daysUntilDue <= 7) {
        notifications.push({
          type: 'emi',
          priority: 'high',
          title: 'EMI Due Soon',
          message: `EMI for ${emi.title} is due in ${daysUntilDue} days`,
          amount: emi.emiAmount,
          dueDate: emi.nextDueDate,
          daysUntilDue,
          data: emi
        });
      } else if (daysUntilDue <= 15) {
        notifications.push({
          type: 'emi',
          priority: 'medium',
          title: 'EMI Reminder',
          message: `EMI for ${emi.title} is due in ${daysUntilDue} days`,
          amount: emi.emiAmount,
          dueDate: emi.nextDueDate,
          daysUntilDue,
          data: emi
        });
      }
    });

    // Process rent notifications
    upcomingRents.forEach(rent => {
      const daysUntilDue = rent.daysUntilDue;
      
      if (daysUntilDue <= 7) {
        notifications.push({
          type: 'rent',
          priority: 'high',
          title: 'Rent Due Soon',
          message: `${rent.type === 'expense' ? 'Rent payment' : 'Rent collection'} for ${rent.propertyName} is due in ${daysUntilDue} days`,
          amount: rent.amount,
          dueDate: rent.nextDueDate,
          daysUntilDue,
          data: rent
        });
      } else if (daysUntilDue <= 15) {
        notifications.push({
          type: 'rent',
          priority: 'medium',
          title: 'Rent Reminder',
          message: `${rent.type === 'expense' ? 'Rent payment' : 'Rent collection'} for ${rent.propertyName} is due in ${daysUntilDue} days`,
          amount: rent.amount,
          dueDate: rent.nextDueDate,
          daysUntilDue,
          data: rent
        });
      }
    });

    // Process FD maturity notifications
    upcomingFDs.forEach(fd => {
      const daysUntilMaturity = fd.daysUntilMaturity;
      
      if (daysUntilMaturity <= 30) {
        notifications.push({
          type: 'fd',
          priority: daysUntilMaturity <= 7 ? 'high' : 'medium',
          title: 'FD Maturity',
          message: `Fixed deposit ${fd.fdNumber} will mature in ${daysUntilMaturity} days`,
          amount: fd.maturityAmount,
          dueDate: fd.maturityDate,
          daysUntilDue: daysUntilMaturity,
          data: fd
        });
      }
    });

    // Sort by priority and due date
    notifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    res.json({
      success: true,
      data: {
        notifications,
        summary: {
          total: notifications.length,
          high: notifications.filter(n => n.priority === 'high').length,
          medium: notifications.filter(n => n.priority === 'medium').length,
          low: notifications.filter(n => n.priority === 'low').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
