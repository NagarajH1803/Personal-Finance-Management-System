const mongoose = require('mongoose');

const moneyLentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowerName: {
    type: String,
    required: [true, 'Borrower name is required'],
    trim: true
  },
  borrowerContact: {
    phone: String,
    email: String,
    address: String
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  interestRate: {
    type: Number,
    default: 0,
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  loanDate: {
    type: Date,
    required: [true, 'Loan date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['active', 'partially_paid', 'paid', 'overdue', 'defaulted'],
    default: 'active'
  },
  paymentSchedule: {
    type: String,
    enum: ['lump_sum', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'lump_sum'
  },
  payments: [{
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    principal: {
      type: Number,
      required: true,
      min: [0, 'Principal amount cannot be negative']
    },
    interest: {
      type: Number,
      required: true,
      min: [0, 'Interest amount cannot be negative']
    },
    notes: String
  }],
  collateral: {
    description: String,
    value: Number,
    documents: [{
      name: String,
      url: String,
      type: String
    }]
  },
  notes: String,
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for total amount paid
moneyLentSchema.virtual('totalPaid').get(function() {
  return this.payments.reduce((total, payment) => total + payment.amount, 0);
});

// Virtual for remaining balance
moneyLentSchema.virtual('remainingBalance').get(function() {
  const totalPaid = this.totalPaid;
  return Math.max(0, this.amount - totalPaid);
});

// Virtual for total interest earned
moneyLentSchema.virtual('totalInterestEarned').get(function() {
  return this.payments.reduce((total, payment) => total + payment.interest, 0);
});

// Virtual for days overdue
moneyLentSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'overdue' || this.status === 'defaulted') {
    return Math.max(0, Math.floor((new Date() - new Date(this.dueDate)) / (1000 * 60 * 60 * 24)));
  }
  return 0;
});

// Virtual for current value (principal + accrued interest)
moneyLentSchema.virtual('currentValue').get(function() {
  const daysSinceLoan = Math.floor((new Date() - new Date(this.loanDate)) / (1000 * 60 * 60 * 24));
  const dailyInterestRate = this.interestRate / 365 / 100;
  const accruedInterest = this.remainingBalance * dailyInterestRate * daysSinceLoan;
  return this.remainingBalance + accruedInterest;
});

// Method to update status based on payments and due date
moneyLentSchema.methods.updateStatus = function() {
  const now = new Date();
  const totalPaid = this.totalPaid;
  
  if (totalPaid >= this.amount) {
    this.status = 'paid';
  } else if (totalPaid > 0) {
    this.status = 'partially_paid';
  } else if (now > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'active';
  }
  
  return this.status;
};

// Pre-save middleware to update status
moneyLentSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

module.exports = mongoose.model('MoneyLent', moneyLentSchema);
