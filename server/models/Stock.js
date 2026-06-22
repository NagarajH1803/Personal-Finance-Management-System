const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  transactions: [{
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    brokerage: {
      type: Number,
      default: 0
    },
    notes: String
  }],
  currentPrice: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate current holdings and average price
stockSchema.virtual('totalQuantity').get(function() {
  return this.transactions.reduce((total, transaction) => {
    if (transaction.type === 'buy') {
      return total + transaction.quantity;
    } else {
      return total - transaction.quantity;
    }
  }, 0);
});

stockSchema.virtual('averageBuyPrice').get(function() {
  const buyTransactions = this.transactions.filter(t => t.type === 'buy');
  const totalBuyQuantity = buyTransactions.reduce((sum, t) => sum + t.quantity, 0);
  const totalBuyValue = buyTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0);
  
  return totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;
});

stockSchema.virtual('totalInvested').get(function() {
  return this.transactions.reduce((total, transaction) => {
    if (transaction.type === 'buy') {
      return total + (transaction.quantity * transaction.price) + transaction.brokerage;
    } else {
      return total - (transaction.quantity * transaction.price) - transaction.brokerage;
    }
  }, 0);
});

stockSchema.virtual('currentValue').get(function() {
  return this.totalQuantity * this.currentPrice;
});

stockSchema.virtual('profitLoss').get(function() {
  return this.currentValue - this.totalInvested;
});

stockSchema.virtual('profitLossPercentage').get(function() {
  return this.totalInvested > 0 ? (this.profitLoss / this.totalInvested) * 100 : 0;
});

stockSchema.virtual('totalBrokerage').get(function() {
  return this.transactions.reduce((total, transaction) => total + transaction.brokerage, 0);
});

// Method to add transaction
stockSchema.methods.addTransaction = function(type, quantity, price, date, brokerage = 0, notes = '') {
  this.transactions.push({
    type,
    quantity,
    price,
    date: date || new Date(),
    brokerage,
    notes
  });
  
  // Update current price if it's a recent transaction
  if (date && (new Date() - new Date(date)) < 24 * 60 * 60 * 1000) {
    this.currentPrice = price;
    this.lastUpdated = new Date();
  }
  
  return this.save();
};

// Method to update current price
stockSchema.methods.updateCurrentPrice = function(price) {
  this.currentPrice = price;
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Stock', stockSchema);
