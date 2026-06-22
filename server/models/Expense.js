const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide expense title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide expense amount'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please provide expense category'],
    enum: [
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
    ]
  },
  subCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Sub-category cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Please provide expense date'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Digital Wallet', 'Check', 'Other'],
    default: 'Cash'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
    required: function() { return this.isRecurring; }
  },
  recurringEndDate: {
    type: Date,
    required: function() { return this.isRecurring; }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  receipt: {
    filename: String,
    path: String,
    uploadedAt: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [100, 'Vendor cannot be more than 100 characters']
  },
  isTaxDeductible: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled', 'Refunded'],
    default: 'Paid'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, isRecurring: 1 });

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for month and year
expenseSchema.virtual('monthYear').get(function() {
  return {
    month: this.date.getMonth() + 1,
    year: this.date.getFullYear()
  };
});

// Virtual for expense age
expenseSchema.virtual('age').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get expense statistics
expenseSchema.statics.getExpenseStats = async function(userId, startDate, endDate) {
  const matchStage = {
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        averageExpense: { $avg: '$amount' },
        expenseCount: { $sum: 1 },
        maxExpense: { $max: '$amount' },
        minExpense: { $min: '$amount' }
      }
    }
  ]);

  const categoryStats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  const monthlyStats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    overview: stats[0] || {
      totalExpenses: 0,
      averageExpense: 0,
      expenseCount: 0,
      maxExpense: 0,
      minExpense: 0
    },
    byCategory: categoryStats,
    byMonth: monthlyStats
  };
};

// Static method to get upcoming recurring expenses
expenseSchema.statics.getUpcomingRecurring = async function(userId) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return await this.find({
    user: userId,
    isRecurring: true,
    recurringEndDate: { $gte: now },
    $or: [
      { date: { $lte: now } },
      { date: { $gte: now, $lte: nextMonth } }
    ]
  }).sort({ date: 1 });
};

// Instance method to create next recurring expense
expenseSchema.methods.createNextRecurring = async function() {
  if (!this.isRecurring) return null;

  const nextDate = new Date(this.date);
  
  switch (this.recurringType) {
    case 'Daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  if (nextDate <= this.recurringEndDate) {
    const nextExpense = new this.constructor({
      ...this.toObject(),
      _id: undefined,
      date: nextDate,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    return await nextExpense.save();
  }
  
  return null;
};

module.exports = mongoose.model('Expense', expenseSchema);
