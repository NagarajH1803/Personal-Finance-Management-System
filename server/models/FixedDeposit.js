const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'FD amount is required'],
    min: [0, 'Amount cannot be negative']
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
    enum: ['days', 'months', 'years'],
    default: 'months'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  maturityDate: {
    type: Date
  },
  maturityAmount: {
    type: Number
  },
  interestEarned: {
    type: Number
  },
  fdNumber: {
    type: String,
    required: [true, 'FD number is required'],
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'premature_withdrawn'],
    default: 'active'
  },
  interestPayout: {
    type: String,
    enum: ['monthly', 'quarterly', 'at_maturity'],
    default: 'at_maturity'
  },
  nominee: {
    name: String,
    relationship: String,
    phone: String
  },
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate maturity date and amount before saving
fixedDepositSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('tenure') || this.isModified('tenureType') || 
      this.isModified('amount') || this.isModified('interestRate')) {
    
    // Calculate maturity date
    const maturityDate = new Date(this.startDate);
    if (this.tenureType === 'days') {
      maturityDate.setDate(maturityDate.getDate() + this.tenure);
    } else if (this.tenureType === 'months') {
      maturityDate.setMonth(maturityDate.getMonth() + this.tenure);
    } else if (this.tenureType === 'years') {
      maturityDate.setFullYear(maturityDate.getFullYear() + this.tenure);
    }
    this.maturityDate = maturityDate;
    
    // Calculate maturity amount
    const timeInYears = this.tenureType === 'days' ? this.tenure / 365 : 
                       this.tenureType === 'months' ? this.tenure / 12 : this.tenure;
    
    this.maturityAmount = this.amount * Math.pow(1 + this.interestRate / 100, timeInYears);
    this.interestEarned = this.maturityAmount - this.amount;
  }
  next();
});

// Virtual for days until maturity
fixedDepositSchema.virtual('daysUntilMaturity').get(function() {
  const today = new Date();
  const maturity = new Date(this.maturityDate);
  const diffTime = maturity - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for current value (if premature withdrawal)
fixedDepositSchema.virtual('currentValue').get(function() {
  if (this.status !== 'active') return this.maturityAmount;
  
  const today = new Date();
  const start = new Date(this.startDate);
  const maturity = new Date(this.maturityDate);
  
  if (today < start) return this.amount;
  if (today >= maturity) return this.maturityAmount;
  
  // Calculate current value based on time elapsed
  const totalDays = (maturity - start) / (1000 * 60 * 60 * 24);
  const elapsedDays = (today - start) / (1000 * 60 * 60 * 24);
  const timeInYears = elapsedDays / 365;
  
  return this.amount * Math.pow(1 + this.interestRate / 100, timeInYears);
});

// Virtual for premature withdrawal penalty
fixedDepositSchema.virtual('prematurePenalty').get(function() {
  if (this.status !== 'active') return 0;
  
  const today = new Date();
  const maturity = new Date(this.maturityDate);
  
  if (today >= maturity) return 0;
  
  // Assume 1% penalty for premature withdrawal
  return this.currentValue * 0.01;
});

// Virtual for effective interest rate
fixedDepositSchema.virtual('effectiveRate').get(function() {
  const timeInYears = this.tenureType === 'days' ? this.tenure / 365 : 
                     this.tenureType === 'months' ? this.tenure / 12 : this.tenure;
  
  return ((this.maturityAmount / this.amount) - 1) / timeInYears * 100;
});

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
