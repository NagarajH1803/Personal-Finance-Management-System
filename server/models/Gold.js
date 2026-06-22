const mongoose = require('mongoose');

const goldSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['jewelry', 'coins', 'bars', 'etf', 'other'],
    required: [true, 'Gold type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['grams', 'tolas', 'ounces'],
    default: 'grams'
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  purity: {
    type: Number,
    min: [0, 'Purity cannot be negative'],
    max: [100, 'Purity cannot exceed 100%'],
    default: 99.9
  },
  description: String,
  location: {
    type: String,
    enum: ['home', 'bank_locker', 'jewelry_shop', 'other'],
    default: 'home'
  },
  insurance: {
    provider: String,
    policyNumber: String,
    premium: Number,
    renewalDate: Date
  },
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current value
goldSchema.virtual('currentValue').get(function() {
  return this.quantity * this.currentPrice * (this.purity / 100);
});

// Virtual for purchase value
goldSchema.virtual('purchaseValue').get(function() {
  return this.quantity * this.purchasePrice * (this.purity / 100);
});

// Virtual for profit/loss
goldSchema.virtual('profitLoss').get(function() {
  return this.currentValue - this.purchaseValue;
});

// Virtual for profit/loss percentage
goldSchema.virtual('profitLossPercentage').get(function() {
  return this.purchaseValue > 0 ? (this.profitLoss / this.purchaseValue) * 100 : 0;
});

// Virtual for quantity in grams (standard unit)
goldSchema.virtual('quantityInGrams').get(function() {
  if (this.unit === 'grams') return this.quantity;
  if (this.unit === 'tolas') return this.quantity * 11.664; // 1 tola = 11.664 grams
  if (this.unit === 'ounces') return this.quantity * 31.1035; // 1 ounce = 31.1035 grams
  return this.quantity;
});

// Method to update current price
goldSchema.methods.updateCurrentPrice = function(price) {
  this.currentPrice = price;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add gold
goldSchema.methods.addGold = function(quantity, price, date) {
  const totalQuantity = this.quantity + quantity;
  const totalValue = (this.quantity * this.purchasePrice) + (quantity * price);
  this.quantity = totalQuantity;
  this.purchasePrice = totalValue / totalQuantity;
  this.purchaseDate = date || new Date();
  return this.save();
};

// Method to sell gold
goldSchema.methods.sellGold = function(quantity, price, date) {
  if (quantity > this.quantity) {
    throw new Error('Insufficient gold quantity');
  }
  
  this.quantity -= quantity;
  if (this.quantity === 0) {
    this.isActive = false;
  }
  
  return this.save();
};

module.exports = mongoose.model('Gold', goldSchema);
