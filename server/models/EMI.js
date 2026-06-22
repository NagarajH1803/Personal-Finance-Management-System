const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'EMI title is required'],
    trim: true
  },
  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [0, 'Loan amount cannot be negative']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative']
  },
  tenure: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: [1, 'Tenure must be at least 1 month']
  },
  tenureType: {
    type: String,
    enum: ['months', 'years'],
    default: 'months'
  },
  emiAmount: {
    type: Number
  },
  totalAmount: {
    type: Number
  },
  totalInterest: {
    type: Number
  },
  emiDate: {
    type: Number,
    required: [true, 'EMI date is required'],
    min: [1, 'EMI date must be between 1-31'],
    max: [31, 'EMI date must be between 1-31']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  },
  lender: {
    type: String,
    required: [true, 'Lender name is required']
  },
  loanType: {
    type: String,
    enum: ['home', 'car', 'personal', 'business', 'education', 'other'],
    default: 'other'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate EMI amount before saving
emiSchema.pre('save', function(next) {
  if (this.isModified('loanAmount') || this.isModified('interestRate') || this.isModified('tenure')) {
    const principal = this.loanAmount;
    const rate = this.interestRate / 100 / 12; // Monthly interest rate
    const time = this.tenureType === 'years' ? this.tenure * 12 : this.tenure;
    
    if (rate === 0) {
      this.emiAmount = principal / time;
    } else {
      this.emiAmount = principal * rate * Math.pow(1 + rate, time) / (Math.pow(1 + rate, time) - 1);
    }
    
    this.totalAmount = this.emiAmount * time;
    this.totalInterest = this.totalAmount - principal;
    
    // Calculate end date
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + time);
    this.endDate = endDate;
  }
  next();
});

// Virtual for remaining amount
emiSchema.virtual('remainingAmount').get(function() {
  const today = new Date();
  const startDate = new Date(this.startDate);
  const monthsPaid = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                     (today.getMonth() - startDate.getMonth());
  const totalMonths = this.tenureType === 'years' ? this.tenure * 12 : this.tenure;
  const remainingMonths = Math.max(0, totalMonths - monthsPaid);
  return this.emiAmount * remainingMonths;
});

// Virtual for next due date
emiSchema.virtual('nextDueDate').get(function() {
  const today = new Date();
  const nextDue = new Date(today.getFullYear(), today.getMonth(), this.emiDate);
  
  if (nextDue <= today) {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }
  
  return nextDue;
});

module.exports = mongoose.model('EMI', emiSchema);
