const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['real_estate', 'vehicle', 'jewelry', 'electronics', 'furniture', 'investment', 'other'],
    required: [true, 'Asset type is required']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  currentValue: {
    type: Number,
    required: [true, 'Current value is required'],
    min: [0, 'Current value cannot be negative']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  depreciationRate: {
    type: Number,
    default: 0,
    min: [0, 'Depreciation rate cannot be negative'],
    max: [100, 'Depreciation rate cannot exceed 100%']
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  description: String,
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  insurance: {
    provider: String,
    policyNumber: String,
    premium: Number,
    renewalDate: Date
  },
  maintenance: [{
    date: Date,
    description: String,
    cost: Number,
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate current value based on depreciation
assetSchema.pre('save', function(next) {
  if (this.isModified('purchasePrice') || this.isModified('depreciationRate') || this.isModified('purchaseDate')) {
    const yearsSincePurchase = (new Date() - new Date(this.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
    const depreciationAmount = this.purchasePrice * (this.depreciationRate / 100) * yearsSincePurchase;
    this.currentValue = Math.max(0, this.purchasePrice - depreciationAmount);
  }
  next();
});

// Virtual for total maintenance cost
assetSchema.virtual('totalMaintenanceCost').get(function() {
  return this.maintenance.reduce((total, item) => total + item.cost, 0);
});

// Virtual for profit/loss
assetSchema.virtual('profitLoss').get(function() {
  return this.currentValue - this.purchasePrice;
});

// Virtual for age in years
assetSchema.virtual('age').get(function() {
  return (new Date() - new Date(this.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
});

module.exports = mongoose.model('Asset', assetSchema);
