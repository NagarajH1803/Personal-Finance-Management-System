const mongoose = require('mongoose');

const cryptoTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: [true, 'Cryptocurrency symbol is required'],
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Cryptocurrency name is required'],
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['buy', 'sell', 'transfer_in', 'transfer_out', 'stake', 'unstake', 'reward'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price per unit cannot be negative']
  },
  totalValue: {
    type: Number,
    default: 0,
    min: [0, 'Total value cannot be negative']
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  exchange: {
    name: String,
    fees: {
      type: Number,
      default: 0,
      min: [0, 'Fees cannot be negative']
    }
  },
  wallet: {
    address: String,
    type: {
      type: String,
      enum: ['hot', 'cold', 'exchange', 'hardware', 'mobile', 'web'],
      default: 'exchange'
    }
  },
  notes: String,
  calculatedProfitLoss: {
    type: Number,
    default: 0
  },
  costBasis: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total value
cryptoTransactionSchema.pre('save', function(next) {
  // Always calculate total value if amount and pricePerUnit are present
  if (this.amount && this.pricePerUnit) {
    this.totalValue = this.amount * this.pricePerUnit;
  }
  next();
});

// Virtual for profit/loss (for sell transactions)
cryptoTransactionSchema.virtual('profitLoss').get(function() {
  if (this.transactionType === 'sell') {
    return this.calculatedProfitLoss || 0;
  }
  return 0;
});

const cryptoHoldingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: [true, 'Cryptocurrency symbol is required'],
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Cryptocurrency name is required'],
    trim: true
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  averageBuyPrice: {
    type: Number,
    default: 0,
    min: [0, 'Average buy price cannot be negative']
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: [0, 'Total invested amount cannot be negative']
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: [0, 'Current price cannot be negative']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  wallets: [{
    address: String,
    amount: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['hot', 'cold', 'exchange', 'hardware', 'mobile', 'web'],
      default: 'exchange'
    }
  }],
  staking: {
    isStaked: {
      type: Boolean,
      default: false
    },
    stakedAmount: {
      type: Number,
      default: 0
    },
    stakingReward: {
      type: Number,
      default: 0
    },
    stakingStartDate: Date,
    stakingEndDate: Date,
    apy: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for current value
cryptoHoldingSchema.virtual('currentValue').get(function() {
  return this.totalAmount * this.currentPrice;
});

// Virtual for profit/loss
cryptoHoldingSchema.virtual('profitLoss').get(function() {
  return this.currentValue - this.totalInvested;
});

// Virtual for profit/loss percentage
cryptoHoldingSchema.virtual('profitLossPercentage').get(function() {
  if (this.totalInvested === 0) return 0;
  return ((this.currentValue - this.totalInvested) / this.totalInvested) * 100;
});

// Virtual for total staking rewards
cryptoHoldingSchema.virtual('totalStakingRewards').get(function() {
  if (!this.staking.isStaked) return 0;
  const daysStaked = (new Date() - new Date(this.staking.stakingStartDate)) / (1000 * 60 * 60 * 24);
  const dailyReward = (this.staking.stakedAmount * this.staking.apy / 100) / 365;
  return dailyReward * daysStaked;
});

// Method to update current price (would typically be called from an external API)
cryptoHoldingSchema.methods.updateCurrentPrice = function(newPrice) {
  this.currentPrice = newPrice;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add staking
cryptoHoldingSchema.methods.addStaking = function(amount, apy, endDate) {
  this.staking.isStaked = true;
  this.staking.stakedAmount = amount;
  this.staking.apy = apy;
  this.staking.stakingStartDate = new Date();
  this.staking.stakingEndDate = endDate;
  return this.save();
};

// Method to remove staking
cryptoHoldingSchema.methods.removeStaking = function() {
  this.staking.isStaked = false;
  this.staking.stakedAmount = 0;
  this.staking.apy = 0;
  this.staking.stakingStartDate = null;
  this.staking.stakingEndDate = null;
  return this.save();
};

module.exports = {
  CryptoTransaction: mongoose.model('CryptoTransaction', cryptoTransactionSchema),
  CryptoHolding: mongoose.model('CryptoHolding', cryptoHoldingSchema)
};
