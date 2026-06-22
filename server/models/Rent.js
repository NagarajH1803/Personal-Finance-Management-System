const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Rent type is required']
  },
  propertyName: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'office', 'shop', 'land', 'other'],
    default: 'apartment'
  },
  amount: {
    type: Number,
    required: [true, 'Rent amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  dueDate: {
    type: Number,
    required: [true, 'Due date is required'],
    min: [1, 'Due date must be between 1-31'],
    max: [31, 'Due date must be between 1-31']
  },
  agreement: {
    startDate: {
      type: Date,
      required: [true, 'Agreement start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Agreement end date is required']
    },
    agreementNumber: String,
    securityDeposit: {
      type: Number,
      default: 0
    },
    maintenanceCharges: {
      type: Number,
      default: 0
    },
    utilities: {
      electricity: {
        type: Boolean,
        default: false
      },
      water: {
        type: Boolean,
        default: false
      },
      gas: {
        type: Boolean,
        default: false
      },
      internet: {
        type: Boolean,
        default: false
      }
    }
  },
  tenant: {
    name: String,
    phone: String,
    email: String,
    idProof: {
      type: String,
      number: String
    }
  },
  landlord: {
    name: String,
    phone: String,
    email: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    }
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'terminated'],
    default: 'active'
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

// Virtual for next due date
rentSchema.virtual('nextDueDate').get(function() {
  const today = new Date();
  const nextDue = new Date(today.getFullYear(), today.getMonth(), this.dueDate);
  
  if (nextDue <= today) {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }
  
  return nextDue;
});

// Virtual for days until due
rentSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const nextDue = this.nextDueDate;
  const diffTime = nextDue - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total rent collected/paid
rentSchema.virtual('totalAmount').get(function() {
  const startDate = new Date(this.agreement.startDate);
  const endDate = new Date(this.agreement.endDate);
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth());
  return this.amount * months;
});

// Virtual for agreement status
rentSchema.virtual('agreementStatus').get(function() {
  const today = new Date();
  const endDate = new Date(this.agreement.endDate);
  
  if (today > endDate) return 'expired';
  if (today < new Date(this.agreement.startDate)) return 'pending';
  return 'active';
});

// Virtual for monthly total (including maintenance)
rentSchema.virtual('monthlyTotal').get(function() {
  return this.amount + this.agreement.maintenanceCharges;
});

module.exports = mongoose.model('Rent', rentSchema);
